import { useNavigate } from "react-router-dom";
import { useState } from "react";
import "../css/dashUsuario.css";
import Resumen from "./Resumen"; // 👈 Nuevo componente

export default function DasUsuario() {
  const navigate = useNavigate();
  const [destination, setDestination] = useState("Plaza Norte, Lima");
  const [activeSection, setActiveSection] = useState("resumen");

  const position = { lat: -11.95, lon: -77.07 };

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  const handleSearch = (e) => {
    e.preventDefault();
    alert(`Buscando ruta hacia: ${destination} 🚗`);
  };

  return (
    <div className="dashboard">
      {/* ===== Sidebar ===== */}
      <aside className="sidebar">
        <div className="user-profile">
          <img
            src="https://cdn-icons-png.flaticon.com/512/149/149071.png"
            alt="Usuario"
            className="sidebar-avatar"
          />
          <h3>Juan Pérez</h3>
          <p>Los Olivos</p>
        </div>

        <ul>
          <li onClick={() => setActiveSection("resumen")}>📊 Resumen</li>
          <li onClick={() => setActiveSection("mapa")}>🗺️ Mapa</li>
          <li onClick={() => setActiveSection("reportes")}>📝 Mis Reportes</li>
          <li onClick={() => setActiveSection("alertas")}>🔔 Alertas</li>
          <li onClick={() => setActiveSection("prevencion")}>📚 Prevención</li>
          <li onClick={() => setActiveSection("perfil")}>👤 Mi Perfil</li>

          <li className="logout-item" onClick={handleLogout}>
            🚪 Cerrar Sesión
          </li>
        </ul>
      </aside>

      {/* ===== Panel principal ===== */}
      <main className="main-panel">
        <header className="header">
          <h1>🛡️ Seguridad Ciudadana – Los Olivos</h1>
        </header>

        {/* ===== Secciones dinámicas ===== */}
        {activeSection === "resumen" && <Resumen />}

        {activeSection === "mapa" && (
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
        )}
      </main>
    </div>
  );
}

