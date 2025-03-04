import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  Alert,
  Box,
  Breadcrumbs,
  Button,
  Container,
  Menu,
  MenuItem,
  Pagination,
  Paper,
  Typography,
} from "@mui/material";

import Grid from "@mui/joy/Grid";
import { deleteEntry, searchEntries } from "../api/EntryApi.js";
import { deleteWiki, getWiki, translateWiki } from "../api/WikiApi.js";
import EntradaCard from "../components/EntradaCard.jsx";
import { useToast } from "../context/ToastContext.jsx";
import ConfirmationModal from "../components/ConfirmationModal.jsx";
import { availableLanguages } from "../constants/languages.js";
import { useLanguage } from "../context/LanguageContext.jsx";

function WikiPage() {
  const [wiki, setWiki] = useState({});
  const [entradas, setEntradas] = useState([]);
  const [error, setError] = useState(null);
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  const { wikiId } = useParams();

  const handlePageChange = (event, value) => {
    setCurrentPage(value);
  };

  const startIndex = (currentPage - 1) * itemsPerPage;
  const selectedEntradas = entradas.slice(
    startIndex,
    startIndex + itemsPerPage,
  );

  const [isModalOpen, setIsModalOpen] = useState(false);
  // Retrieve the JSON string for 'appUser' from sessionStorage
  const appUserJson = sessionStorage.getItem("appUser");

  // Check if 'appUser' exists in sessionStorage
  const isLoggedIn = !!appUserJson;

  let role = null;

  if (isLoggedIn) {
    const appUser = JSON.parse(appUserJson);

    role = appUser.role;
  }

  const { selectedOption, setSelectedOption } = useLanguage();
  const [anchorEl, setAnchorEl] = useState(null);
  const [pendingLanguage, setPendingLanguage] = useState(null);

  useEffect(() => {
    getWiki(wikiId)
      .then((data) => {
        if (data && Object.keys(data).length > 0) {
          setWiki(data);
        } else {
          setError("Wiki no encontrada.");
        }
      })
      .catch((err) => setError(err.message));
  }, [wikiId]);

  useEffect(() => {
    searchEntries({ wikiID: `${wikiId}` })
      .then((data) => {
        if (data && Array.isArray(data)) {
          setEntradas(data);
        } else {
          setEntradas([]);
        }
      })
      .catch((err) => setError(err.message));
  }, [wikiId]);

  const handleDeleteEntry = async (entryID) => {
    try {
      await deleteEntry(entryID);
      setEntradas((prevEntries) =>
        prevEntries.filter((entry) => entry.id !== entryID)
      );
      showToast("Entrada eliminada correctamente", "success");
    } catch (error) {
      console.error("Error al eliminar la entrada:", error);
      showToast("Error al eliminar la entrada", "error");
    }
  };

  const handleDeleteWiki = async () => {
    try {
      await deleteWiki(wikiId);
      showToast("Wiki eliminada correctamente", "success");
      navigate("/");
    } catch (error) {
      console.error("Error al eliminar la wiki:", error);
      showToast("Error al eliminar la wiki", "error");
    }
  };

  const handleDropdownClose = () => {
    setAnchorEl(null);
  };

  const handleOptionSelect = (option) => {
    setPendingLanguage(option);
    setIsModalOpen(true);
    setAnchorEl(null);
  };

  const handleTranslateWiki = async () => {
    if (wiki.sourceLang !== pendingLanguage) {
      try {
        await translateWiki(wikiId, pendingLanguage);
        showToast(
          `Wiki traducida a ${pendingLanguage} correctamente`,
          "success",
        );
        // Fetch the updated wiki data to reflect the translation
        const updatedWiki = await getWiki(wikiId);
        setWiki(updatedWiki);
        setSelectedOption(pendingLanguage);
        // Fetch the updated entries to reflect the translation
        const updatedEntries = await searchEntries({ wikiID: wikiId });
        // si no es vacia la lista de entradas, entonces se actualiza
        if (updatedEntries && Array.isArray(updatedEntries)){
        setEntradas(updatedEntries);
        }
      } catch (error) {
        console.error("Error al traducir la wiki:", error);
        showToast("Error al traducir la wiki", "error");
      }
      setIsModalOpen(false);
    } else {
      showToast(`Wiki traducida a ${pendingLanguage} correctamente`, "success");
      setSelectedOption(pendingLanguage);
      setIsModalOpen(false);
    }
  };

  const getTranslatedField = (field) => {
    if (wiki.sourceLang === selectedOption) {
      return wiki[field];
    } else {
      return wiki.translatedFields?.[selectedOption]?.[field] || wiki[field];
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Breadcrumbs sx={{ mb: 2 }}>
        <Typography
          color="textPrimary"
          component={Link}
          to="/"
          className="breadcrumb-link"
        >
          Inicio
        </Typography>
        <Typography color="textPrimary" className="breadcrumb-active">
          {getTranslatedField("title")}
        </Typography>
      </Breadcrumbs>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {!error && wiki && Object.keys(wiki).length > 0 && (
        <>
          {/* Page Header */}
          <Paper
            elevation={3}
            sx={{ p: 2, mb: 4, textAlign: "center", borderRadius: 1 }}
          >
            <Typography variant="h3" component="h1" sx={{ m: 0 }}>
              {getTranslatedField("title")}
            </Typography>
            <Typography variant="h6" gutterBottom>
              <strong>Descripción:</strong> {getTranslatedField("description")}
            </Typography>
            <Typography variant="h6" gutterBottom>
              <strong>Categoría:</strong> {getTranslatedField("category")}
            </Typography>
          </Paper>

          {/* Entradas */}
          <Paper elevation={3} sx={{ p: 3, mb: 4, borderRadius: 1 }}>
            <Typography
              variant="h4"
              component="h2"
              sx={{ borderBottom: "1px solid", pb: 1, mb: 2 }}
            >
              Entradas
            </Typography>
            {selectedEntradas && selectedEntradas.length > 0
              ? (
                <Grid container spacing={2}>
                  {selectedEntradas.map((entrada) => (
                    <Grid xs={12} sm={6} md={4} key={entrada.id}>
                      <EntradaCard
                        id={entrada.id}
                        title={entrada.translatedFields &&
                          entrada.translatedFields[selectedOption] &&
                          entrada.translatedFields[selectedOption].title
                          ? entrada.translatedFields[selectedOption].title
                          : entrada.title}
                        author={entrada.author}
                        createdAt={entrada.created_at}
                        onDelete={handleDeleteEntry}
                      />
                    </Grid>
                  ))}
                </Grid>
              )
              : <Typography>No entries available</Typography>}
            <Pagination
              count={Math.ceil(entradas.length / itemsPerPage)}
              page={currentPage}
              onChange={handlePageChange}
              sx={{ mt: 4, display: "flex", justifyContent: "center" }}
            />
          </Paper>

          {/* Language Change Button - Available for all users */}
          <Button
            variant="contained"
            color="primary"
            sx={{ mt: 2, mb: 2 }}
            onClick={(e) => {
              setAnchorEl(e.currentTarget);
              setPendingLanguage(null);
            }}
          >
            Cambiar Idioma: {selectedOption || "Seleccionar"}
          </Button>

          {/* Buttons requiring login */}
          {isLoggedIn && (
            <Box sx={{ display: "flex", justifyContent: "space-between" }}>
              <Button
                component={Link}
                to={`/entrada/form/${wikiId}`}
                variant="contained"
                color="primary"
                sx={{ mt: 2 }}
              >
                Crear Nueva Entrada
              </Button>

              <Box>
                {role != "redactor" && (
                  <Button
                    component={Link}
                    to={`/wiki/form/${wikiId}`}
                    variant="outlined"
                    color="primary"
                    sx={{ mt: 2, mr: 2 }}
                  >
                    Editar Wiki
                  </Button>
                )}

                {["admin", "editor", "redactor"].includes(
                  role,
                ) && (
                    <Button
                      variant="contained"
                      color="secondary"
                      sx={{ mt: 2 }}
                      onClick={(e) => {
                        setAnchorEl(e.currentTarget);
                        setPendingLanguage("translate");
                      }}
                    >
                      Traducir
                    </Button>
                  )}

                {role == "admin" && (
                  <Button
                    variant="contained"
                    color="error"
                    sx={{ mt: 2, ml: 2 }}
                    onClick={() => setIsModalOpen(true)}
                  >
                    Borrar Wiki
                  </Button>
                )}
              </Box>
            </Box>
          )}

          {/* Menu - Available for all users */}
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleDropdownClose}
          >
            {availableLanguages.map((lang) => {
              // For language change, only show available translations
              if (!pendingLanguage) {
                if (
                  wiki.translatedFields?.[lang.code] ||
                  wiki.sourceLang === lang.code
                ) {
                  return (
                    <MenuItem
                      key={lang.code}
                      onClick={() => {
                        setSelectedOption(lang.code);
                        handleDropdownClose();
                      }}
                    >
                      {lang.name}
                    </MenuItem>
                  );
                }
                return null;
              } // For translation, show all languages except source
              else if (wiki.sourceLang !== lang.code) {
                return (
                  <MenuItem
                    key={lang.code}
                    onClick={() => handleOptionSelect(lang.code)}
                  >
                    {lang.name}{" "}
                    {wiki.translatedFields?.[lang.code] ? "(Actualizar)" : ""}
                  </MenuItem>
                );
              }
              return null;
            })}
          </Menu>

          {/* Confirmation Modal */}
          <ConfirmationModal
            show={isModalOpen}
            handleClose={() => setIsModalOpen(false)}
            handleConfirm={pendingLanguage
              ? handleTranslateWiki
              : handleDeleteWiki}
            message={pendingLanguage
              ? `¿Estás seguro de que quieres traducir esta wiki a ${pendingLanguage}?`
              : "¿Estás seguro de que quieres borrar esta wiki?"}
          />
        </>
      )}
    </Container>
  );
}

export default WikiPage;
