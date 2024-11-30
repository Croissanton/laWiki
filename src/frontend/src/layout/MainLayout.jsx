import { Box, CssBaseline } from "@mui/material";
import Header from "../components/Header";
import Footer from "../components/Footer";
import ToastMessage from "../components/ToastMessage";
import { useToast } from "../context/ToastContext";
import { Outlet } from "react-router-dom";

function MainLayout() {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <CssBaseline />
      <Header />
      <Box sx={{ flexGrow: 1, pb: 5 }}>
        <Outlet />
        <ToastMessagesLayout />
      </Box>
      <Footer />
    </Box>
  );
}

const ToastMessagesLayout = () => {
  const { toast, hideToast } = useToast();

  return (
    <ToastMessage
      show={toast.show}
      onClose={hideToast}
      message={toast.message}
      severity={toast.severity}
    />
  );
};

export default MainLayout;
