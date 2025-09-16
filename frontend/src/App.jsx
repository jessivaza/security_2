import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/LoginPage";
import ResetPassword from "./pages/ResetPassword";
import Dashboard from "./pages/Dashboard";

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

        {/* Dashboard protegido */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        {/* Redirigir por defecto */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}
