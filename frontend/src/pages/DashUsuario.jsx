import { useNavigate } from "react-router-dom";
import { useState } from "react";
import "../css/dashUsuario.css";

export default function DasUsuario() {
  const navigate = useNavigate();
  const [destination, setDestination] = useState("Plaza Norte, Lima");

  const position = { lat: -11.95, lon: -77.07 }; // Ubicación base

  // 👉 Función de logout
  const handleLogout = () => {
    localStorage.removeItem("token"); // elimina sesión
    navigate("/login"); // redirige al login
  };

  // 👉 Función de búsqueda de ruta
  const handleSearch = (e) => {
    e.preventDefault();
    alert(`Buscando ruta hacia: ${destination} 🚗`);
  };

  return (
    <div className="dashboard">
      {/* ===== Sidebar ===== */}
      <aside className="sidebar">
        {/* Perfil del usuario */}
        <div className="user-profile">
          <img
            src="https://cdn-icons-png.flaticon.com/512/149/149071.png"
            alt="Usuario"
            className="sidebar-avatar"
          />
          <h3>Juan Pérez</h3>
          <p>Los Olivos</p>
        </div>

        {/* Menú */}
        <ul>
          <li>📊 Resumen</li>
          <li>🗺️ Mapa</li>
          <li>📝 Mis Reportes</li>
          <li>🔔 Alertas</li>
          <li>📚 Prevención</li>
          <li>👤 Mi Perfil</li>

          {/* 🔴 Cerrar Sesión */}
          <li className="logout-item" onClick={handleLogout}>
            🚪 Cerrar Sesión
          </li>
        </ul>
      </aside>

      {/* ===== Panel principal ===== */}
      <main className="main-panel">
        {/* Header */}
        <header className="header">
          <h1>🛡️ Seguridad Ciudadana – Los Olivos</h1>
        </header>

        {/* Tarjetas de Resumen */}
        <section className="cards">
          <div className="card">
            🔒 Estado actual: <br /> <span className="green">Seguro</span>
          </div>
          <div className="card">📊 Incidentes hoy: 12</div>
          <div className="card">⏱️ Respuesta promedio: 5 min</div>
          <div className="card">✅ Zonas seguras: 82%</div>
        </section>

        {/* Mapa con búsqueda */}
        <section className="map-section">
          <h2>🗺️ Rutas de salida rápida</h2>

          <form className="route-form" onSubmit={handleSearch}>
            <input
              type="text"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              placeholder="Ingresa tu destino (ej: Mall, Comisaría)"
              className="route-input"
            />
            <button type="submit" className="route-btn">
              🔍 Buscar Ruta
            </button>
          </form>

          <div style={{ position: "relative" }}>
            <iframe
              src={`https://embed.waze.com/iframe?zoom=14&lat=${position.lat}&lon=${position.lon}&pin=1`}
              width="100%"
              height="450"
              allowFullScreen
              title="Mapa Waze"
            ></iframe>
            <div className="hide-logo"></div>
          </div>
        </section>
      </main>
    </div>
  );
}
