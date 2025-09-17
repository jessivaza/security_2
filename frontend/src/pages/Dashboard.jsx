import React from "react";
import { Link } from "react-router-dom"; // Importar Link para redirección
import "../css/dashboard.css"; // Asegúrate de que el archivo esté en la ruta correcta

export default function Dashboard() {
  const logout = () => {
    localStorage.removeItem("token");
    window.location.href = "/login";
  };

  return (
    <div className="dashboard-container">
      {/* Sidebar */}
      <div className="sidebar">
        <h2>Seguridad</h2>
        <ul>
          <li>Dashboard</li>
          <li>
            {/* Usar Link para navegar */}
            <Link to="/incidentes" className="sidebar-link">Incidentes</Link>
          </li>
          <li>Historial</li>
          <li>Mapa</li>
        </ul>
      </div>

      {/* Main content */}
      <div className="main-content">
        <div className="header">
          <input
            type="text"
            className="search-bar"
            placeholder="Buscar incidencias..."
          />
          <div className="user-info">
            <p>Hola, emerson (emontenegro1234@gmail.com)</p>
            <button className="profile-btn">Profile</button>
          </div>
        </div>

        <div className="statistics">
          <div className="stat-box">
            <h3>Historial</h3>
            <p>2000</p>
          </div>
          <div className="stat-box">
            <h3>Incidentes</h3>
            <p>30</p>
          </div>
          <div className="stat-box">
            <h3>Usuarios</h3>
            <p>3000</p>
          </div>
        </div>

        <div className="dashboard-content">
          <h4>Contenido predeterminado del Dashboard</h4>
          <div className="map-container">
            <img src="map_placeholder.png" alt="Mapa" />
          </div>
        </div>
      </div>

      {/* Logout Button */}
      <div className="logout-btn">
        <button onClick={logout}>Cerrar sesión</button>
      </div>
    </div>
  );
}
