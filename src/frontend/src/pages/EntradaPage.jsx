import { useEffect, useState, useRef } from "react";
import {
  searchComments,
  postComment,
  deleteComment,
} from "../api/CommentApi.js";
import { getEntry } from "../api/EntryApi.js";
import { getVersion, searchVersions } from "../api/VersionApi.js";
import { useParams, Link } from "react-router-dom";
import Comentario from "../components/Comentario.jsx";
import Version from "../components/Version.jsx";
import ConfirmationModal from "../components/ConfirmationModal.jsx";
import { useToast } from "../context/ToastContext.1.jsx";
import {
  Container,
  Paper,
  Typography,
  Button,
  Alert,
  List,
  ListItem,
  TextField,
  Grid,
} from "@mui/material";

function EntradaPage() {
  const { entryId, versionId } = useParams();
  const [entry, setEntry] = useState({}); // si se pone null cuanndo se crea una version nueva no carga a la primera
  const [version, setVersion] = useState({});
  const [comments, setComments] = useState([]);
  const [entryError, setEntryError] = useState(null);
  const [commentsError, setCommentsError] = useState(null);
  const [versionError, setVersionError] = useState(null);
  const [coordinates, setCoordinates] = useState(null);

  const [showModal, setShowModal] = useState(false);
  const [pendingComment, setPendingComment] = useState(null);
  const { showToast } = useToast();
  const formRef = useRef(null);

  const [actualVersionId, setActualVersionId] = useState(versionId || null);

  const fixedAdress = "bulevar louis pasteur";
  const fetchCoordinatesNominatim = async (address) => {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&addressdetails=1&limit=1`;
  
    try {
      const response = await fetch(url);
      const data = await response.json();
  
      if (data.length > 0) {
        const { lat, lon } = data[0];
        console.log("Coordenadas:", lat, lon);
        return { lat: parseFloat(lat), lon: parseFloat(lon) };
      } else {
        throw new Error("No se encontraron coordenadas para la dirección.");
      }
    } catch (error) {
      console.error("Error al realizar la geocodificación:", error);
      return null;
    }
  };


  // Handler to close the confirmation modal
  const handleClose = () => {
    setShowModal(false);
    setPendingComment(null);
    showToast("El comentario no se ha creado", "danger");
  };

  // Handler to confirm and post the comment
  const handleConfirm = async () => {
    setShowModal(false);
    try {
      const result = await postComment(pendingComment);
      setComments((prevComments) => [...prevComments, result]);
      formRef.current.reset();
      setPendingComment(null);
      showToast("El comentario se ha creado correctamente!", "success");
    } catch (error) {
      console.error("Error al enviar:", error);
      showToast("Error al enviar el comentario", "danger");
    }
  };

  // Handler to delete a comment
  const handleDeleteComment = async (commentId) => {
    try {
      await deleteComment(commentId);
      setComments((prevComments) =>
        prevComments.filter((comment) => comment.id !== commentId),
      );
      showToast("Comentario eliminado correctamente", "success");
    } catch (error) {
      console.error("Error al eliminar el comentario:", error);
      showToast("Error al eliminar el comentario", "danger");
    }
  };

  // Fetch the entry details
  useEffect(() => {
    if (entryId) {
      getEntry(entryId)
        .then((data) => {
          if (data && Object.keys(data).length > 0) {
            setEntry(data);
          } else {
            setEntryError("No se encontró la entrada solicitada.");
          }
        })
        .catch(() =>
          setEntryError("Se produjo un error al obtener la entrada."),
        );
    } else {
      setEntryError("No se proporcionó un ID de entrada válido.");
    }
  }, [entryId]);

  // Fetch the version details
  useEffect(() => {
    if (versionId) {
      // If versionId is provided in the URL, fetch that specific version
      setActualVersionId(versionId);
    } else if (entryId) {
      // If no versionId is provided, fetch the latest version for the entry
      searchVersions({ entryID: entryId })
        .then((versions) => {
          if (versions && versions.length > 0) {
            // Sort the versions by createdAt descending to get the latest
            versions.sort(
              (a, b) => new Date(b.created_at) - new Date(a.created_at),
            );
            const latestVersion = versions[0];
            setActualVersionId(latestVersion.id);
          } else {
            setVersionError(
              "No se encontró ninguna versión para esta entrada.",
            );
          }
        })
        .catch(() =>
          setVersionError("Se produjo un error al obtener las versiones."),
        );
    }
  }, [entryId, versionId]);

  // Fetch the version data when actualVersionId changes
  useEffect(() => {
    if (actualVersionId) {
      getVersion(actualVersionId)
        .then(async (data) => {
          if (data && Object.keys(data).length > 0) {
            setVersion(data);
            //if (data.address) {
              const coords = await fetchCoordinatesNominatim(fixedAdress);   // Hay que descomentar el if y poner data.address en la función
              setCoordinates(coords);
            //}
          } else {
            setVersionError("No se encontró la versión solicitada.");
          }
        })
        .catch(() =>
          setVersionError("Se produjo un error al obtener la versión."),
        );

      // Fetch comments for the actual version
      searchComments({ versionID: actualVersionId })
        .then((data) => {
          if (data && data.length > 0) {
            setComments(data);
          } else {
            setComments([]);
            setCommentsError(
              "No se encontraron comentarios para esta versión.",
            );
          }
        })
        .catch(() =>
          setCommentsError("Se produjo un error al obtener los comentarios."),
        );
    }
  }, [actualVersionId]);

  // Handler to submit a new comment
  async function subirComentario(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    const jsonData = Object.fromEntries(formData.entries());
    jsonData["version_id"] = actualVersionId;
    jsonData["rating"] = parseInt(jsonData["rating"], 10);
    setPendingComment(jsonData);
    setShowModal(true);
  }

{/* http://localhost:5173/entrada/67311bf03399f3b49ccb8072/67311bfb43d96ecd81728a93 */}

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Entry Details */}
      <Paper elevation={3} sx={{ p: 2, mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Datos de la Entrada
        </Typography>
        {entryError && <Alert severity="error">{entryError}</Alert>}
        {!entryError && entry && (
          <>
            <Typography variant="h6">Título: {entry.title}</Typography>
            <Typography variant="h6">Autor: {entry.author}</Typography>
            <Typography variant="h6">
              Fecha de creación:{" "}
              {new Date(entry.created_at).toLocaleDateString()}
            </Typography>
            <Typography variant="h6">
              <Link to={`/versiones/${entry.id}`}>Ver historial</Link>
              <br></br>
              <Link to={`/editarEntrada/${entry.id}/${version.id}`}>Editar contenido</Link>
            </Typography>
          </>
        )}
      </Paper>

        {/* Contenido de la Versión */}
        <Paper elevation={3} sx={{ p: 2, mb: 4 }}>
          <Typography variant="h5" gutterBottom>
            Contenido de la Versión
          </Typography>
          {versionError && <Alert severity="error">{versionError}</Alert>}
          {!versionError && version && (
            <Version
              content={version.content}
              editor={version.editor}
              created_at={version.created_at}
              entry_id={version.entry_id}
              address={fixedAdress}   // Hay que poner version.address
              coordinates={coordinates}
            />
          )}
        </Paper>

      {/* Comments */}
      <Paper elevation={3} sx={{ p: 2, mb: 4 }}>
        <Typography variant="h5" gutterBottom>
          Comentarios
        </Typography>
        {commentsError && <Alert severity="error">{commentsError}</Alert>}
        {!commentsError && comments.length > 0 ? (
          <List>
            {comments.map((comment) => (
              <ListItem key={comment.id}>
                <Comentario
                  id={comment.id}
                  content={comment.content}
                  rating={comment.rating}
                  created_at={comment.created_at}
                  author={comment.author}
                  onDelete={handleDeleteComment}
                />
              </ListItem>
            ))}
          </List>
        ) : (
          !commentsError && (
            <Alert severity="info">No se encontraron comentarios.</Alert>
          )
        )}
      </Paper>

      {/* Form to Add Comment */}
      <Paper elevation={3} sx={{ p: 2, mb: 4 }}>
        <Typography variant="h5" gutterBottom>
          Añadir comentario
        </Typography>
        <form id="miFormulario" ref={formRef} onSubmit={subirComentario}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                id="content"
                name="content"
                label="Contenido"
                multiline
                required
                fullWidth
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <TextField
                id="rating"
                name="rating"
                label="Calificación"
                type="number"
                inputProps={{ min: 1, max: 5 }}
                required
                fullWidth
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <TextField
                id="author"
                name="author"
                label="Autor"
                required
                fullWidth
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                fullWidth
                sx={{ height: "100%" }}
              >
                Enviar
              </Button>
            </Grid>
          </Grid>
        </form>
      </Paper>
      <ConfirmationModal
        message="¿Estás seguro de que quieres crear este comentario?"
        show={showModal}
        handleClose={handleClose}
        handleConfirm={handleConfirm}
      />
    </Container>
  );
}

export default EntradaPage;
