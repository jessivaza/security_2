import { useNavigate } from "react-router-dom";
import { useState } from "react";
import "../../css/Vista_usuario/dashUsuario.css";
import Resumen from "./Resumen";
import Alertas from "./Alertas";
import Perfil from "./Perfil";
import Prevencion from "./prevencion";
import MisReportes from "./Reportes"; // Asegúrate que el archivo se llame Reportes.jsx
import { FaMoon, FaSun } from "react-icons/fa";
import usuarioImg from "../../img/usuario/img.png";
import {
  FaChartBar,
  FaMapMarkedAlt,
  FaFileAlt,
  FaBell,
  FaBook,
  FaUser,
  FaDoorOpen,
  FaWhatsapp,
} from "react-icons/fa";

// Componente para alertas de la comunidad
function AlertasComunidad() {
  const [alertas, setAlertas] = useState([]);

  useState(() => {
    const interval = setInterval(() => {
      const hora = new Date().toLocaleTimeString();
      setAlertas(prev => [
        { id: Date.now(), mensaje: `Nueva alerta de la comunidad a las ${hora}` },
        ...prev,
      ]);
    }, 60000); // cada minuto

    return () => clearInterval(interval);
  }, []);

  const abrirWhatsapp = () => {
    window.open("https://chat.whatsapp.com/tuCodigoDelGrupo", "_blank");
  };

  return (
    <div className="alertas-comunidad">
      <h3><FaWhatsapp /> Comunidad - Alertas minuto a minuto</h3>
      {alertas.length === 0 ? <p>No hay alertas aún</p> : (
        <ul>
          {alertas.map(a => (
            <li key={a.id}>
              <span>{a.mensaje}</span>
              <button onClick={abrirWhatsapp} className="btn-whatsapp">
                Abrir conversación
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function DasUsuario() {
  const navigate = useNavigate();
  const [destination, setDestination] = useState("Plaza Norte, Lima");
  const [activeSection, setActiveSection] = useState("resumen");
  const [darkMode, setDarkMode] = useState(false);
  const [isSlim, setIsSlim] = useState(false);

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
    <div className={`dashboard ${darkMode ? "dark" : "light"}`}>
      <aside className={`sidebar ${isSlim ? "slim" : "wide"}`}>
        <div className="user-profile" onClick={() => setIsSlim(!isSlim)}>
          <img src={usuarioImg} alt="Usuario" className="sidebar-avatar" />
          {!isSlim && (
            <>
              <h3>Jessica Vazallo</h3>
              <p>Los Olivos</p>
            </>
          )}
        </div>

        <ul>
          <li onClick={() => setActiveSection("resumen")}>
            <FaChartBar size={25} /> {!isSlim && <span>Resumen</span>}
          </li>
          <li onClick={() => setActiveSection("mapa")}>
            <FaMapMarkedAlt size={25} /> {!isSlim && <span>Mapa</span>}
          </li>
          <li onClick={() => setActiveSection("reportes")}>
            <FaFileAlt size={25} /> {!isSlim && <span>Mis Reportes</span>}
          </li>
          <li onClick={() => setActiveSection("alertas")}>
            <FaBell size={25} /> {!isSlim && <span>Alertas</span>}
          </li>
          <li onClick={() => setActiveSection("prevencion")}>
            <FaBook size={25} /> {!isSlim && <span>Prevención</span>}
          </li>
          <li onClick={() => setActiveSection("perfil")}>
            <FaUser size={25} /> {!isSlim && <span>Mi Perfil</span>}
          </li>
          <li className="logout-item" onClick={handleLogout}>
            <FaDoorOpen size={25} /> {!isSlim && <span>Cerrar Sesión</span>}
          </li>
        </ul>

        <div className="mode-toggle" onClick={() => setDarkMode(!darkMode)}>
          {darkMode ? <FaSun /> : <FaMoon />}
          {!isSlim && <span>{darkMode ? "Modo Claro" : "Modo Oscuro"}</span>}
        </div>
      </aside>

      <main className="main-panel">
        <header className="header">
          <h1>🛡️ Seguridad Ciudadana – Los Olivos</h1>
        </header>

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
              <button type="submit" className="route-btn">🔍 Buscar Ruta</button>
            </form>
            <iframe
              src={`https://embed.waze.com/iframe?zoom=14&lat=${position.lat}&lon=${position.lon}&pin=1`}
              width="100%"
              height="450"
              allowFullScreen
              title="Mapa Waze"
            ></iframe>
          </section>
        )}
        {activeSection === "prevencion" && <Prevencion />}
        {activeSection === "alertas" && <Alertas />}
        {activeSection === "reportes" && <MisReportes darkMode={darkMode} />}
        {activeSection === "perfil" && <Perfil darkMode={darkMode} setDarkMode={setDarkMode} />}
      </main>
    </div>
  );
}
