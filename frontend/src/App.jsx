import { Navigate, Route, BrowserRouter as Router, Routes } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import DashUsuario from "./pages/DashUsuario"; // 👈 Importa tu nuevo dashboard de usuario
import Incidentes from "./pages/Incidentes";
// Inicio moved to subfolder
import Inicio from "./pages/inicio/inicio";
import Login from "./pages/LoginPage";
import ResetPassword from "./pages/ResetPassword";

// 🔹 Función para validar si hay token
const isAuthenticated = () => {
  return !!localStorage.getItem("token");
};

// 🔹 Ruta protegida
const ProtectedRoute = ({ children }) => {
  return isAuthenticated() ? children : <Navigate to="/login" replace />;
};

export default function App() {
  return (
    <Router>
      <Routes>
        {/* Página principal promocional */}
        <Route path="/" element={<Inicio />} />
        <Route path="/inicio" element={<Inicio />} />
        {/* Login, Registro y Recuperar */}
        <Route path="/login" element={<Login />} />

        {/* Restablecer contraseña con token */}
        <Route path="/reset-password/:token" element={<ResetPassword />} />

        {/* Dashboard protegido (Admin o general) */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        {/* Dashboard del usuario común */}
        <Route
          path="/dashUsuario"
          element={
            <ProtectedRoute>
              <DashUsuario />
            </ProtectedRoute>
          }
        />

        {/* Módulo de incidentes */}
        <Route path="/incidentes" element={<Incidentes />} />

        {/* Redirigir por defecto a la página principal */}
        <Route path="*" element={<Navigate to="/inicio" replace />} />
      </Routes>
    </Router>
  );
}
