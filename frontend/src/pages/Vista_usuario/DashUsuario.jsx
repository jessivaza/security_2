import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import "../../css/Vista_usuario/dashUsuario.css";
import Resumen from "./Resumen";
import MapaInteractivo from "./Mapa";
import Alertas from "./Alertas";
import Perfil from "./Perfil";
import Prevencion from "./prevencion";
import MisReportes from "./Reportes";
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

  useEffect(() => {
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

  const [usuario, setUsuario] = useState({ nombre: "Usuario" });

  // Traer nombre del usuario logueado desde backend
  useEffect(() => {
    const token = localStorage.getItem("access"); // JWT
    if (!token) return;

    fetch("http://127.0.0.1:8000/api/perfilUsuario/", {
      headers: { "Authorization": `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setUsuario(prev => ({ ...prev, nombre: data.nombre || prev.nombre })))
      .catch(err => console.error("Error al cargar usuario:", err));
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("access");
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
              <h3>{usuario.nombre}</h3>
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
        {activeSection === "mapa" && <MapaInteractivo />}
        {activeSection === "prevencion" && <Prevencion />}
        {activeSection === "alertas" && <Alertas />}
        {activeSection === "reportes" && <MisReportes darkMode={darkMode} />}
        {activeSection === "perfil" && <Perfil darkMode={darkMode} setDarkMode={setDarkMode} />}
      </main>
    </div>
  );
}
