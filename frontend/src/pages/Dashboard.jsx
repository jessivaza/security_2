import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "../css/dashboard.css";


export default function Dashboard() {
  const [user, setUser] = useState({ username: "", email: "" });
  const [darkMode, setDarkMode] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Estados para datos dinámicos (mantener igual)
  const [stats, setStats] = useState({
    total_incidentes: 0,
    casos_resueltos: 0,
    alertas_activas: 0
  });
  const [personnel, setPersonnel] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Funciones existentes (mantener igual)
  const fetchStats = async () => {
    try {
      const response = await fetch('http://127.0.0.1:8000/api/dashboard/stats/');
      const data = await response.json();
      
      if (data.success) {
        setStats(data.stats);
        console.log('✅ Estadísticas cargadas:', data.stats);
      } else {
        console.error('❌ Error en stats API:', data.error);
        setError('Error al cargar estadísticas');
      }
    } catch (error) {
      console.error('❌ Error fetching stats:', error);
      setError('Error de conexión con las estadísticas');
    }
  };

  const fetchPersonnel = async () => {
    try {
      const response = await fetch('http://127.0.0.1:8000/api/dashboard/personnel/');
      const data = await response.json();
      
      if (data.success) {
        setPersonnel(data.personal);
        console.log('✅ Personal cargado:', data.personal.length, 'miembros');
      } else {
        console.error('❌ Error en personnel API:', data.error);
        setError('Error al cargar personal');
      }
    } catch (error) {
      console.error('❌ Error fetching personnel:', error);
      setError('Error de conexión con el personal');
    }
  };

  const fetchActivities = async () => {
    try {
      const response = await fetch('http://127.0.0.1:8000/api/dashboard/activities/');
      const data = await response.json();
      
      if (data.success) {
        setActivities(data.activities);
        console.log('✅ Actividades cargadas:', data.activities.length, 'items');
      } else {
        console.error('❌ Error en activities API:', data.error);
        setError('Error al cargar actividades');
      }
    } catch (error) {
      console.error('❌ Error fetching activities:', error);
      setError('Error de conexión con las actividades');
    }
  };

  // UseEffects (mantener igual)
  useEffect(() => {
    const loadDashboardData = async () => {
      console.log('🔄 Cargando datos del dashboard...');
      setLoading(true);
      setError(null);
      
      try {
        await Promise.all([
          fetchStats(),
          fetchPersonnel(),
          fetchActivities()
        ]);
        console.log('✅ Todos los datos cargados exitosamente');
      } catch (error) {
        console.error('❌ Error general al cargar datos:', error);
        setError('Error general al cargar el dashboard');
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
    const interval = setInterval(() => {
      console.log('🔄 Actualizando datos automáticamente...');
      loadDashboardData();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/login";
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <div className={`dashboard-container ${darkMode ? "dark-mode" : ""} ${sidebarCollapsed ? "sidebar-collapsed" : ""}`}>
      {/* SIDEBAR REDISEÑADO */}
      <div className={`sidebar ${sidebarCollapsed ? "collapsed" : ""} ${mobileMenuOpen ? "open" : ""}`}>
        <div className="sidebar-header">
          <h2 onClick={toggleSidebar} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
            <img 
              src="/src/img/logo_1.png" 
              alt="Logo" 
              className="sidebar-logo"
              style={{ display: sidebarCollapsed ? 'none' : 'inline-block' }}
            />
            {sidebarCollapsed ? "🛡️" : "SEGURIDAD"}
          </h2>
        </div>

        <nav className="sidebar-nav">
          <ul className="nav-list">
            <li className="nav-item active">
              <Link to="/dashboard" className="nav-link">
                <span className="nav-icon">📊</span>
                <span className="nav-text">Dashboard</span>
              </Link>
            </li>

            
            <li className="nav-item">
              <Link to="/alertas" className="nav-link">
                <span className="nav-icon">🚨</span>
                <span className="nav-text">Alertas</span>
              </Link>
            </li>
            
            <li className="nav-item">
              <Link to="/personal" className="nav-link">
                <span className="nav-icon">👥</span>
                <span className="nav-text">Personal</span>
              </Link>
            </li>
            
            <li className="nav-item">
              <Link to="/ubicaciones" className="nav-link">
                <span className="nav-icon">📍</span>
                <span className="nav-text">Ubicaciones</span>
              </Link>
            </li>
            
            <li className="nav-item">
              <Link to="/reportes" className="nav-link">
                <span className="nav-icon">📊</span>
                <span className="nav-text">Reportes</span>
              </Link>
            </li>
          </ul>
        </nav>

        {/* FOOTER CON BOTÓN LOGOUT ACTUALIZADO */}
        <div className="sidebar-footer">
          <button onClick={logout} className="logout-btn">
            {sidebarCollapsed ? "✕" : (
              <>
                <span>🚪</span>
                <span>Cerrar sesión</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* CONTENIDO PRINCIPAL */}
      <div className="main-content">
        {/* HEADER REDISEÑADO - Mejor organización */}
        <div className="header">
          <div className="header-left">
            <div className="search-bar">
              <span className="search-icon">🔍</span>
              <input 
                type="text" 
                placeholder="Buscar incidencias..." 
                className="search-input"
              />
            </div>
          </div>
          
          <div className="header-right">
            <div className="user-section">
              <div className="user-info">
                <p className="user-greeting">Hola,</p>
                <p className="user-name">{user.username || "Admin"}</p>
              </div>
              
              <div className="user-avatar">
                <img 
                  src="/public/img/Usuario/default-avatar.png" 
                  alt="Avatar Usuario"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                />
                <div className="avatar-icon" style={{ display: 'none' }}>
                  👤
                  <div className="status-indicator"></div>
                </div>
              </div>
              
              <button 
                className="theme-toggle-btn" 
                onClick={toggleDarkMode}
                title={darkMode ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
              >
                {darkMode ? "☀️" : "🌙"}
              </button>
              
              <button className="profile-btn">
                Perfil
              </button>
            </div>
          </div>
        </div>

        {/* Mostrar errores si los hay */}
        {error && (
          <div className="error-banner">
            ⚠️ {error}
            <button onClick={() => window.location.reload()}>Reintentar</button>
          </div>
        )}

        {/* Estadísticas dinámicas */}
        <div className="stats-section">
          {loading ? (
            <div className="loading">
              <div className="loading-spinner">🔄</div>
              Cargando estadísticas...
            </div>
          ) : (
            <>
              <div className="stat-card incidentes">
                <h3>Total Incidentes</h3>
                <div className="stat-number">{stats.total_incidentes.toLocaleString()}</div>
                <div className="stat-subtitle">📈 Registrados en el sistema</div>
              </div>
              <div className="stat-card resueltos">
                <h3>Casos Resueltos</h3>
                <div className="stat-number">{stats.casos_resueltos.toLocaleString()}</div>
                <div className="stat-subtitle">✅ Atendidos exitosamente</div>
              </div>
              <div className="stat-card alertas">
                <h3>Alertas Activas</h3>
                <div className="stat-number">{stats.alertas_activas}</div>
                <div className="stat-subtitle">🚨 Requieren atención</div>
              </div>
            </>
          )}
        </div>

        <div className="dashboard-grid">
          {/* Personal de Emergencia Rediseñado */}
          <div className="dashboard-section">
            <div className="section-header">
              <h3>
                <span className="section-icon">👥</span>
                Personal de Emergencia Activo
              </h3>
              <div className="personnel-summary">
                <span className="total-count">{personnel.length} activos</span>
              </div>
            </div>
            
            {loading ? (
              <div className="loading">
                <div className="loading-spinner">🔄</div>
                Cargando personal...
              </div>
            ) : personnel.length === 0 ? (
              <div className="empty-personnel">
                <div className="empty-icon">👥</div>
                <p>No hay personal activo disponible</p>
              </div>
            ) : (
              <div className="personnel-container">
                {personnel.slice(0, 4).map((person) => (
                  <div key={person.id} className="personnel-card-modern">
                    <div className="card-header">
                      <div className={`personnel-avatar-modern ${person.tipo.toLowerCase()}`}>
                        <img 
                          src={`/src/img/inicio/${
                            person.tipo === 'Policía' ? 'policia.png' : 
                            person.tipo === 'Bombero' ? 'policia.png' : 
                            person.tipo === 'Médico' ? 'policia.png' : 
                            person.tipo === 'Serenazgo' ? 'policia.png' : 'policia.png'
                          }`}
                          alt={`${person.tipo} ${person.nombre}`}
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                          }}
                        />
                        <div className="avatar-bg" style={{ display: 'none' }}>
                          {person.tipo === 'Policía' ? '👮‍♂️' : 
                          person.tipo === 'Bombero' ? '🚒' : 
                          person.tipo === 'Médico' ? '👨‍⚕️' : 
                          person.tipo === 'Serenazgo' ? '🚔' : '👤'}
                        </div>
                        <div className={`status-dot ${person.estado.toLowerCase().replace(/\s+/g, '-')}`}></div>
                      </div>
                      <div className="card-actions">
                        <button className="action-btn call-btn" title="Llamar">📞</button>
                        <button className="action-btn message-btn" title="Mensaje">💬</button>
                      </div>
                    </div>
                    
                    <div className="personnel-details">
                      <div className="personnel-name-modern">{person.nombre}</div>
                      <div className="personnel-role-modern">
                        <span className="role-badge">
                          {person.tipo === 'Policía' && <span className="role-icon">🚔</span>}
                          {person.tipo === 'Bombero' && <span className="role-icon">🚒</span>}
                          {person.tipo === 'Médico' && <span className="role-icon">🏥</span>}
                          {person.tipo === 'Serenazgo' && <span className="role-icon">🛡️</span>}
                          {person.tipo}
                        </span>
                      </div>
                    </div>
                    
                    <div className="personnel-footer">
                      <div className={`status-badge-modern ${person.estado.toLowerCase().replace(/\s+/g, '-')}`}>
                        <span className="status-indicator"></span>
                        {person.estado}
                      </div>
                      <div className="last-update">
                        Actualizado hace 2 min
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {/* Botón Ver Todos */}
            <div className="section-footer">
              <button className="view-all-btn">
                Ver todo el personal
                <span className="btn-arrow">→</span>
              </button>
            </div>
          </div>

          {/* Actividades Recientes Dinámicas */}
          <div className="dashboard-section">
            <h3>Actividades Recientes</h3>
            {loading ? (
              <div className="loading">
                <div className="loading-spinner">🔄</div>
                Cargando actividades...
              </div>
            ) : (
              <div className="inbox-container">
                {activities.slice(0, 5).map((activity) => (
                  <div key={activity.id} className={`inbox-message ${activity.unread ? 'unread' : ''}`}>
                    <div className="activity-avatar">
                      <img 
                        src="/src/img/inicio/ciudadano.png" 
                        alt={activity.sender}
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'inline';
                        }}
                      />
                      <span style={{ display: 'none' }}>{activity.avatar}</span>
                    </div>
                    <div className="message-content">
                      <div className="message-sender">{activity.sender}</div>
                      <div className="message-body">{activity.message}</div>
                    </div>
                    <div className="message-meta">
                      <div className="message-time">{activity.timestamp}</div>
                      {activity.unread && <div className="notification-bell">🔔</div>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

