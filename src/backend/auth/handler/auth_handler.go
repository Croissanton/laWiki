package handler

import (
	"context"
	"crypto/rand"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"

	"github.com/laWiki/auth/config"
	"github.com/laWiki/auth/model"

	"github.com/golang-jwt/jwt"
)

const FRONTEND_URL = "http://localhost:5173"

// HealthCheck godoc
// @Summary      Health Check
// @Description  Checks if the service is up
// @Tags         Health
// @Produce      plain
// @Success      200  {string}  string  "OK"
// @Router       /api/auth/health [get]
func HealthCheck(w http.ResponseWriter, r *http.Request) {
	w.WriteHeader(http.StatusOK)
	w.Write([]byte("OK"))
}

// generateStateOauthCookie generates a random state string and sets it as a cookie
func generateStateOauthCookie(w http.ResponseWriter) string {
	expiration := time.Now().UTC().Add(1 * time.Hour)

	b := make([]byte, 16)
	rand.Read(b)
	state := base64.URLEncoding.EncodeToString(b)

	cookie := http.Cookie{
		Name:     "oauthstate",
		Value:    state,
		Expires:  expiration,
		HttpOnly: true,
		Secure:   true,
		SameSite: http.SameSiteStrictMode,
	}
	http.SetCookie(w, &cookie)
	return state
}

// Login godoc
// @Summary      Initiate OAuth2 Login
// @Description  Initiates the OAuth2 flow with Google
// @Tags         Authentication
// @Success      302  {string}  string  "Redirect to Google OAuth2 login"
// @Router       /api/auth/login [get]
func Login(w http.ResponseWriter, r *http.Request) {
	// Generate a random state parameter to prevent CSRF attacks.
	state := generateStateOauthCookie(w)

	// Get the OAuth2 Config
	oauthConfig := config.App.GoogleOAuthConfig

	// Redirect user to Google's OAuth consent page
	url := oauthConfig.AuthCodeURL(state)
	http.Redirect(w, r, url, http.StatusTemporaryRedirect)
}

// Callback godoc
// @Summary      OAuth2 Callback
// @Description  Handles the OAuth2 callback from Google
// @Tags         Authentication
// @Param        state  query     string  true  "OAuth state"
// @Param        code   query     string  true  "Authorization code"
// @Success      302    {string}  string  "Redirect after login"
// @Failure      401    {string}  string  "Invalid OAuth state"
// @Failure      500    {string}  string  "Could not create JWT"
// @Router       /api/auth/callback [get]
func Callback(w http.ResponseWriter, r *http.Request) {
	// Validate 'state' and 'code' parameters
	state := r.FormValue("state")
	code := r.FormValue("code")
	if state == "" || code == "" {
		http.Error(w, "Missing 'state' or 'code' parameters", http.StatusBadRequest)
		return
	}

	// Get state from the cookie
	oauthState, err := r.Cookie("oauthstate")
	if err != nil {
		http.Error(w, "State cookie not found", http.StatusUnauthorized)
		return
	}

	if state != oauthState.Value {
		http.Error(w, "Invalid OAuth state", http.StatusUnauthorized)
		return
	}

	// Exchange code for access token and retrieve user data
	data, err := getUserDataFromGoogle(code)
	if err != nil {
		config.App.Logger.Error().Err(err).Msg("Failed to get user data from Google")
		http.Redirect(w, r, "/", http.StatusTemporaryRedirect)
		return
	}

	// Generate JWT token
	jwtToken, err := createJWTToken(data)
	if err != nil {
		config.App.Logger.Error().Err(err).Msg("Failed to create JWT token")
		http.Error(w, "Could not create JWT", http.StatusInternalServerError)
		return
	}

	// Set the JWT token in a secure cookie
	http.SetCookie(w, &http.Cookie{
		Name:     "jwt_token",
		Value:    jwtToken,
		Expires:  time.Now().UTC().Add(24 * time.Hour),
		HttpOnly: true,
		Secure:   true,
		SameSite: http.SameSiteStrictMode,
	})

	// Redirect to the frontend application
	http.Redirect(w, r, FRONTEND_URL, http.StatusSeeOther)
}

// getUserDataFromGoogle exchanges the code for a token and gets user info from Google
func getUserDataFromGoogle(code string) ([]byte, error) {
	oauthConfig := config.App.GoogleOAuthConfig

	// Exchange the code for a token
	token, err := oauthConfig.Exchange(context.Background(), code)
	if err != nil {
		return nil, fmt.Errorf("failed to exchange code for token: %v", err)
	}

	// Create a new HTTP client using the token
	client := oauthConfig.Client(context.TODO(), token)

	// Get the user's info from the Google API
	resp, err := client.Get("https://www.googleapis.com/oauth2/v2/userinfo")
	if err != nil {
		return nil, fmt.Errorf("failed to get user info: %v", err)
	}
	defer resp.Body.Close()
	data, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read user info response: %v", err)
	}
	return data, nil
}

// createJWTToken creates a JWT token with the user's information
func createJWTToken(data []byte) (string, error) {
	var user model.User
	err := json.Unmarshal(data, &user)
	if err != nil {
		return "", fmt.Errorf("failed to unmarshal user data: %v", err)
	}

	// Validate or set user role
	if user.Role == "" {
		user.Role = "user" // Set a default role
	}

	// Create the JWT claims
	claims := jwt.MapClaims{
		"email": user.Email,
		"name":  user.Name,
		"role":  user.Role,
		"exp":   time.Now().UTC().Add(time.Hour * 1).Unix(), // Token expires in 1 hour
		"iat":   time.Now().UTC().Unix(),
		"iss":   "auth_service", // Issuer identifier
	}

	// Create the token
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)

	// Sign the token with the secret key
	tokenString, err := token.SignedString([]byte(config.App.JWTSecret))
	if err != nil {
		return "", fmt.Errorf("failed to sign JWT token: %v", err)
	}

	return tokenString, nil
}

// Logout godoc
// @Summary      Logout
// @Description  Clears the JWT token cookie
// @Tags         Authentication
// @Success      302  {string}  string  "Redirect after logout"
// @Router       /api/auth/logout [get]
func Logout(w http.ResponseWriter, r *http.Request) {
	// Clear the jwt_token cookie
	http.SetCookie(w, &http.Cookie{
		Name:     "jwt_token",
		Value:    "",
		Expires:  time.Now().UTC().Add(-1 * time.Hour), // Set expiration in the past
		HttpOnly: true,
		Secure:   true,
		SameSite: http.SameSiteStrictMode,
	})

	// Redirect to the login page or home page
	http.Redirect(w, r, "/", http.StatusSeeOther)
}

// UserInfo godoc
// @Summary      Get User Info
// @Description  Returns user information for the authenticated user
// @Tags         Authentication
// @Success      200  {object}  model.User
// @Failure      401  {string}  string  "Unauthorized"
// @Router       /api/auth/userinfo [get]
func UserInfo(w http.ResponseWriter, r *http.Request) {
	// Get the JWT token from the cookie
	cookie, err := r.Cookie("jwt_token")
	if err != nil {
		http.Error(w, "Unauthorized: missing token", http.StatusUnauthorized)
		return
	}

	tokenString := cookie.Value

	// Parse and validate the token
	token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
		// Ensure the signing method is HMAC
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return []byte(config.App.JWTSecret), nil
	})

	if err != nil || !token.Valid {
		http.Error(w, "Unauthorized: invalid token", http.StatusUnauthorized)
		return
	}

	// Extract user claims
	if claims, ok := token.Claims.(jwt.MapClaims); ok && token.Valid {
		user := model.User{
			Email: claims["email"].(string),
			Name:  claims["name"].(string),
			Role:  claims["role"].(string),
		}
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(user)
	} else {
		http.Error(w, "Unauthorized: invalid token claims", http.StatusUnauthorized)
		return
	}

}
