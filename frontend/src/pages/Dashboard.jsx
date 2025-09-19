import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom"; 
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "../css/dashboard.css"; 

export default function Dashboard() {
  const [user, setUser] = useState({ username: "", email: "" });

  // Al cargar el Dashboard, obtenemos el usuario desde localStorage
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser)); // Lo convertimos a objeto
    }
  }, []);

  // Inicializar el mapa Leaflet
  useEffect(() => {
    const losOlivos = [-11.978, -76.999];
    const map = L.map("map").setView(losOlivos, 14);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);

    const incidencias = [
      { coords: [-11.978, -76.999], mensaje: "Robo en Av. Universitaria" },
      { coords: [-11.976, -77.002], mensaje: "Accidente de tránsito" },
      { coords: [-11.981, -76.995], mensaje: "Incendio menor" },
    ];

    incidencias.forEach((i) =>
      L.marker(i.coords).addTo(map).bindPopup(i.mensaje)
    );

    // Cleanup
    return () => {
      map.remove();
    };
  }, []);

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user"); 
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
            <p>Hola, {user.username}</p>
            <button className="profile-btn">Perfil</button>
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
          <h4>Mapa de Los Olivos</h4>
          <div
            id="map"
            className="map-container"
            style={{ height: "400px", width: "100%", borderRadius: "10px" }}
          ></div>
        </div>
      </div>

      {/* Logout Button */}
      <div className="logout-btn">
        <button onClick={logout}>Cerrar sesión</button>
      </div>
    </div>
  );
}
