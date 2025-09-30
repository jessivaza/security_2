// frontend/src/pages/Vista_usuario/Perfil.jsx
import { useState, useEffect } from "react";
import usuarioImg from "../../img/usuario/img.png";
import "../../css/Vista_usuario/perfil.css";
import { FaEdit, FaLock, FaPhoneAlt } from "react-icons/fa";

const API = "http://127.0.0.1:8000/api";

/** Helper: GET JSON con token; devuelve null si !ok o error */
async function fetchJSON(path, token) {
  try {
    const res = await fetch(path, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

/** Helper: intenta varias rutas y devuelve el primer JSON válido */
async function fetchFirst(paths, token) {
  for (const p of paths) {
    const data = await fetchJSON(p, token);
    if (data) return data;
  }
  return null;
}

export default function Perfil({ darkMode, setDarkMode }) {
  const [usuario, setUsuario] = useState({
    nombre: "Usuario",
    email: "No registrado",
    telefono: "No hay número registrado",
    activo: true,
    ultimo_acceso: "No disponible",
    contacto_emergencia: { nombre: "No registrado", telefono: "No registrado" },
    preferencias: {},
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const token = localStorage.getItem("access");
      if (!token) {
        setLoading(false);
        return;
      }

      // 1) Datos base del usuario autenticado
      const me = await fetchJSON(`${API}/me`, token);
      if (me) {
        setUsuario((prev) => ({
          ...prev,
          nombre: me.username || prev.nombre,
          email: me.email || prev.email,
        }));
      }

      // 2) Intentar cargar perfil extendido si existe
      const perfil = await fetchFirst(
        [
          `${API}/perfil-usuario/`,   // por si lo expusiste así
          `${API}/perfilUsuario/`,    // tu ruta original
          `${API}/perfil/`,           // alternativa común
        ],
        token
      );

      if (perfil) {
        setUsuario((prev) => ({
          ...prev,
          telefono: perfil.telefono || prev.telefono,
          activo:
            typeof perfil.activo === "boolean" ? perfil.activo : prev.activo,
          ultimo_acceso:
            perfil.ultimo_acceso || perfil.last_login || prev.ultimo_acceso,
          contacto_emergencia: {
            nombre:
              perfil.contacto_emergencia_nombre ??
              perfil?.contacto_emergencia?.nombre ??
              prev.contacto_emergencia.nombre,
            telefono:
              perfil.contacto_emergencia_telefono ??
              perfil?.contacto_emergencia?.telefono ??
              prev.contacto_emergencia.telefono,
          },
          preferencias: perfil.preferencias || prev.preferencias,
        }));
      }

      setLoading(false);
    })();
  }, []);

  if (loading) return <p>Cargando información del usuario...</p>;

  return (
    <section className={`perfil ${darkMode ? "dark" : "light"}`}>
      <div className="perfil-grid">
        {/* Foto y estado */}
        <div className="card perfil-foto">
          <img src={usuarioImg} alt="Usuario" className="profile-avatar" />
          <h2>{usuario.nombre}</h2>
          <p>
            <FaPhoneAlt /> Teléfono: {usuario.telefono}
          </p>
          <p>Email: {usuario.email}</p>
          <span
            className={`profile-status ${
              usuario.activo ? "activo" : "desactivado"
            }`}
          >
            {usuario.activo ? "Activo" : "Desactivado"}
          </span>
        </div>

        {/* Información de contacto */}
        <div className="card perfil-info">
          <h3>
            Información de Contacto <FaEdit />
          </h3>
          <div className="contacto">
            <h4>Contacto de Emergencia</h4>
            <p>
              <FaPhoneAlt /> Nombre: {usuario.contacto_emergencia.nombre}
            </p>
            <p>
              <FaPhoneAlt /> Teléfono: {usuario.contacto_emergencia.telefono}
            </p>
          </div>
          <button className="btn-edit">
            <FaEdit /> Editar Información
          </button>
        </div>

        {/* Seguridad */}
        <div className="card perfil-seguridad">
          <h3>Seguridad</h3>
          <p>Último acceso: {usuario.ultimo_acceso}</p>
          <button className="btn-change-pass">
            <FaLock /> Cambiar Contraseña
          </button>
        </div>

        {/* Preferencias */}
        <div className="card perfil-preferencias">
          <h3>Preferencias</h3>
          <label className="toggle">
            <input
              type="checkbox"
              checked={!!darkMode}
              onChange={() => setDarkMode && setDarkMode(!darkMode)}
            />
            <span className="slider"></span>
            Modo Oscuro
          </label>
        </div>
      </div>
    </section>
  );
}
