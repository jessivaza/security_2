import 'leaflet/dist/leaflet.css';
import { useState } from 'react';
// ❌ ya no usamos Link
// import { Link } from "react-router-dom";
import "../css/dashboard.css";
import Historial from "./Vista_Administrador/Historial";
// Dashboard.jsx
import MapCalor from "./Vista_Administrador/maps/MapaDeCalor/mapCalor";


const Dashboard = () => {
  const [user, setUser] = useState({ username: "Admin", email: "admin@security.com" });
  const [activeSection, setActiveSection] = useState("dashboard"); // "dashboard" | "historial" | "mapaCalor"
  const [sidebarExpanded, setSidebarExpanded] = useState({
    elements: false,
    components: false,
    formElements: false,
    tables: false,
    chartBoxes: false,
    charts: false
  });

  const toggleSidebar = (section) => {
    setSidebarExpanded(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const agentsData = [
    { id: "#54", avatar: "👮‍♂️", name: "Carlos Mendoza", company: "Comisaría Los Olivos", status: "Activo", statusColor: "green", dueDate: "Hoy", progress: 89, progressColor: "green" },
    { id: "#55", avatar: "👮‍♀️", name: "Ana Vargas", company: "Serenazgo Municipal", status: "En Patrulla", statusColor: "blue", dueDate: "Hoy", progress: 72, progressColor: "blue" },
    { id: "#56", avatar: "🚑", name: "Dr. Luis Torres", company: "Emergencias Médicas", status: "Disponible", statusColor: "green", dueDate: "Guardia", progress: 95, progressColor: "green" },
    { id: "#58", avatar: "🚒", name: "Bomberos Los Olivos", company: "Estación Central", status: "En Servicio", statusColor: "orange", dueDate: "24h", progress: 78, progressColor: "orange" }
  ];

  const timelineEvents = [
    { text: "Reunión de seguridad diaria", status: "default" },
    { text: "Reporte de incidente en Av. Universitaria", status: "new" },
    { text: "Patrullaje nocturno programado", status: "default" },
    { text: "Mantenimiento de equipos", status: "default" },
    { text: "Capacitación de personal", status: "info" },
    { text: "Simulacro de emergencia", status: "new" },
    { text: "Revisión de protocolos", status: "dark" },
    { text: "Coordinación interinstitucional", status: "default" }
  ];

  const logout = () => {
    // (Opcional) unificar con tus guards: access/role
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
          <li
            className={activeSection === "dashboard" ? "active" : ""}
            onClick={() => setActiveSection("dashboard")}
          >
            Dashboard
          </li>

          <li onClick={() => toggleSidebar('elements')}>
            Alertas {sidebarExpanded.elements && '▼'}
            {sidebarExpanded.elements && (
              <ul className="submenu">
                <li>Alertas Activas</li>
                <li
                  onClick={() => setActiveSection("historial")}
                  className={activeSection === "historial" ? "active" : ""}
                >
                  Historial
                </li>
                <li>Configuración</li>
              </ul>
            )}
          </li>

          <li onClick={() => toggleSidebar('components')}>
            Personal {sidebarExpanded.components && '▼'}
            {sidebarExpanded.components && (
              <ul className="submenu">
                <li>Policías</li>
                <li>Serenazgo</li>
                <li>Emergencias</li>
              </ul>
            )}
          </li>

          <li onClick={() => toggleSidebar('formElements')}>
            Ubicaciones {sidebarExpanded.formElements && '▼'}
            {sidebarExpanded.formElements && (
              <ul className="submenu">
                {/* ✅ cambiamos Link por cambio de sección */}
                <li
                  onClick={() => setActiveSection("mapaCalor")}
                  className={activeSection === "mapaCalor" ? "active" : ""}
                >
                  Mapa de Calor
                </li>
                <li>Zonas de Riesgo</li>
                <li>Puntos de Control</li>
              </ul>
            )}
          </li>

          <li onClick={() => toggleSidebar('tables')}>
            Reportes {sidebarExpanded.tables && '▼'}
            {sidebarExpanded.tables && (
              <ul className="submenu">
                <li>Estadísticas</li>
                <li>Análisis</li>
              </ul>
            )}
          </li>
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

        {/* Estadísticas (Dashboard) */}
        {activeSection === "dashboard" && (
          <>
            <div className="statistics">
              <div className="stat-box">
                <h3>Total Incidentes</h3>
                <p>2,847</p>
              </div>
              <div className="stat-box">
                <h3>Casos Resueltos</h3>
                <p>1,963</p>
              </div>
              <div className="stat-box">
                <h3>Alertas Activas</h3>
                <p>284</p>
              </div>
            </div>

            <div className="dashboard-content">
              <h4>Panel de Control - Los Olivos</h4>
              <p>Sistema de gestión y monitoreo de seguridad ciudadana</p>

              <div className="dashboard-sections">
                {/* Personal de Emergencia */}
                <div className="section">
                  <h3>Personal de Emergencia Activo</h3>
                  <div className="agents-grid">
                    {agentsData.map((agent, index) => (
                      <div key={index} className="agent-card">
                        <div className="agent-avatar">{agent.avatar}</div>
                        <div className="agent-info">
                          <h4>{agent.name}</h4>
                          <p>{agent.company}</p>
                          <span className={`agent-status ${agent.statusColor}`}>
                            {agent.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Actividades Recientes */}
                <div className="section">
                  <h3>Actividades Recientes</h3>
                  <div className="timeline-simple">
                    {timelineEvents.slice(0, 5).map((event, index) => (
                      <div key={index} className="timeline-event">
                        <span className={`event-dot ${event.status}`}></span>
                        <span>{event.text}</span>
                        {event.status === 'new' && <span className="event-badge">NUEVO</span>}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Historial */}
        {activeSection === "historial" && <Historial />}

        {activeSection === "mapaCalor" && (
          <div className="section section--map">
            <h3>Mapa de Calor</h3>
            <div className="map-wrapper">
              <MapCalor />
            </div>
          </div>
        )}



      </div>

      {/* Logout Button */}
      <div className="dashboard-logout-btn">
        <button onClick={logout}>Cerrar sesión</button>
      </div>
    </div>
  );
};

export default Dashboard;
