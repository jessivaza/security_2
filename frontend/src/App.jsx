import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/LoginPage";
import ResetPassword from "./pages/ResetPassword";
import Dashboard from "./pages/Dashboard";
import Incidentes from "./pages/Incidentes";
import DashUsuario from "./pages/DashUsuario"; // 👈 Importa tu nuevo dashboard de usuario

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

        {/* Redirigir por defecto */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}
