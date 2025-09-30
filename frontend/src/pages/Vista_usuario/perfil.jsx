// frontend/src/pages/Vista_usuario/Perfil.jsx
import { useState, useEffect, useCallback } from "react";
import usuarioImg from "../../img/usuario/img.png";
import "../../css/Vista_usuario/perfil.css";
import { FaEdit, FaLock, FaPhoneAlt } from "react-icons/fa";

const API = "http://127.0.0.1:8000/api";

/* Helpers ------------------------------------------------- */
async function fetchJSON(path, token) {
  try {
    const res = await fetch(path, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}
async function fetchFirst(paths, token) {
  for (const p of paths) {
    const data = await fetchJSON(p, token);
    if (data) return data;
  }
  return null;
}

/* Sanitizador: solo dígitos y máximo 9 */
const digits9 = (str) => String(str ?? "").replace(/\D/g, "").slice(0, 9);

/* Pequeños estilos inline para embellecer los modales sin romper tu CSS */
const modalCard = {
  background: "#fff",
  borderRadius: 14,
  boxShadow: "0 12px 30px rgba(0,0,0,.12)",
  padding: "18px 18px 14px",
  width: "min(520px, 92vw)",
};
const modalHeader = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  marginBottom: 10,
};
const modalClose = {
  cursor: "pointer",
  fontSize: 22,
  lineHeight: 1,
  border: "none",
  background: "transparent",
};
const field = { display: "flex", flexDirection: "column", gap: 6, margin: "8px 0" };
const input = {
  padding: "10px 12px",
  border: "1px solid #e3e6eb",
  borderRadius: 10,
  outline: "none",
};
const actions = {
  display: "flex",
  gap: 10,
  justifyContent: "flex-end",
  marginTop: 14,
};

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
  const [guardado, setGuardado] = useState(false);
  const [error, setError] = useState("");

  /* Editar perfil */
  const [showEdit, setShowEdit] = useState(false);
  const [form, setForm] = useState({
    nombre: "",
    telefono: "",
    contacto_emergencia_nombre: "",
    contacto_emergencia_telefono: "",
  });
  const [saving, setSaving] = useState(false);

  /* Cambiar password */
  const [showPass, setShowPass] = useState(false);
  const [pwd, setPwd] = useState({ actual: "", nueva: "" });
  const [pwdSaving, setPwdSaving] = useState(false);
  const [pwdMsg, setPwdMsg] = useState("");

  /* Cerrar modal con ESC */
  const handleKey = useCallback((e) => {
    if (e.key === "Escape") {
      setShowEdit(false);
      setShowPass(false);
    }
  }, []);
  useEffect(() => {
    if (showEdit || showPass) window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [showEdit, showPass, handleKey]);

  /* Carga de datos del usuario logueado */
  useEffect(() => {
    (async () => {
      const token = localStorage.getItem("access");
      if (!token) { setLoading(false); return; }

      // 1) Usuario autenticado
      const me = await fetchJSON(`${API}/me/`, token);
      if (me) {
        setUsuario(prev => ({
          ...prev,
          nombre: me.username || localStorage.getItem("username") || prev.nombre,
          email: me.email || prev.email,
        }));
      } else {
        // respaldo por si el endpoint falla
        const lsName = localStorage.getItem("username");
        if (lsName) setUsuario(prev => ({ ...prev, nombre: lsName }));
      }

      // 2) Perfil extendido
      const perfil = await fetchFirst(
        [`${API}/perfil-usuario/`, `${API}/perfilUsuario/`, `${API}/perfil/`],
        token
      );
      if (perfil) {
        setUsuario(prev => ({
          ...prev,
          telefono: perfil.telefono || prev.telefono,
          activo: typeof perfil.activo === "boolean" ? perfil.activo : prev.activo,
          ultimo_acceso: perfil.ultimo_acceso || perfil.last_login || prev.ultimo_acceso,
          contacto_emergencia: {
            nombre: perfil.contacto_emergencia_nombre
              ?? perfil?.contacto_emergencia?.nombre
              ?? prev.contacto_emergencia.nombre,
            telefono: perfil.contacto_emergencia_telefono
              ?? perfil?.contacto_emergencia?.telefono
              ?? prev.contacto_emergencia.telefono,
          },
          preferencias: perfil.preferencias || prev.preferencias,
        }));
      }

      setLoading(false);
    })();
  }, []);

  /* Abrir modal de edición con valores actuales */
  const abrirEditar = () => {
    setForm({
      nombre: usuario.nombre || "",
      telefono:
        usuario.telefono && usuario.telefono !== "No hay número registrado"
          ? digits9(usuario.telefono)
          : "",
      contacto_emergencia_nombre:
        usuario.contacto_emergencia?.nombre &&
        usuario.contacto_emergencia.nombre !== "No registrado"
          ? usuario.contacto_emergencia.nombre
          : "",
      contacto_emergencia_telefono:
        usuario.contacto_emergencia?.telefono &&
        usuario.contacto_emergencia.telefono !== "No registrado"
          ? digits9(usuario.contacto_emergencia.telefono)
          : "",
    });
    setError("");
    setGuardado(false);
    setShowEdit(true);
  };

  /* Validación suave (exactamente 9 dígitos si se informa) */
  const validar = () => {
    const nombre = form.nombre.trim();
    if (nombre.length < 2) return "El nombre debe tener al menos 2 caracteres";

    const tel = digits9(form.telefono);
    if (tel && !/^\d{9}$/.test(tel)) return "El teléfono debe tener exactamente 9 dígitos";

    const telEmer = digits9(form.contacto_emergencia_telefono);
    if (telEmer && !/^\d{9}$/.test(telEmer)) return "El teléfono de emergencia debe tener 9 dígitos";

    return "";
  };

  /* Guardar edición */
  const guardarPerfil = async (e) => {
    e?.preventDefault?.();
    const token = localStorage.getItem("access");
    if (!token) return;
    const v = validar();
    if (v) { setError(v); return; }

    setSaving(true);
    setError("");
    setGuardado(false);

    try {
      // Normaliza teléfonos antes de enviar
      const payload = {
        nombre: form.nombre.trim(),
        telefono: digits9(form.telefono),
        contacto_emergencia_nombre: form.contacto_emergencia_nombre.trim(),
        contacto_emergencia_telefono: digits9(form.contacto_emergencia_telefono),
      };

      // Quita vacíos para no pisar con string vacío
      Object.keys(payload).forEach((k) => {
        if (payload[k] === "" || payload[k] == null) delete payload[k];
      });

      const res = await fetch(`${API}/perfil-usuario/`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || "No se pudo actualizar");
      }

      // Reflejar en UI
      setUsuario(prev => ({
        ...prev,
        nombre: payload.nombre ?? prev.nombre,
        telefono: payload.telefono ?? prev.telefono ?? "No hay número registrado",
        contacto_emergencia: {
          nombre: payload.contacto_emergencia_nombre ?? prev.contacto_emergencia.nombre ?? "No registrado",
          telefono: payload.contacto_emergencia_telefono ?? prev.contacto_emergencia.telefono ?? "No registrado",
        },
      }));

      if (payload.nombre) localStorage.setItem("username", payload.nombre);

      setGuardado(true);
      setShowEdit(false);
      setTimeout(() => setGuardado(false), 2500);
    } catch (e2) {
      setError(e2.message);
    } finally {
      setSaving(false);
    }
  };

  /* Cambiar contraseña */
  const cambiarPassword = async (e) => {
    e?.preventDefault?.();
    const token = localStorage.getItem("access");
    if (!token) return;

    if (!pwd.actual || !pwd.nueva || pwd.nueva.length < 6) {
      setPwdMsg("La nueva contraseña debe tener al menos 6 caracteres");
      return;
    }

    setPwdSaving(true);
    setPwdMsg("");

    try {
      const res = await fetch(`${API}/cambiar-password/`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ actual: pwd.actual, nueva: pwd.nueva }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error || "No se pudo cambiar la contraseña");

      setPwdMsg("Contraseña actualizada ✅");
      setPwd({ actual: "", nueva: "" });
      setShowPass(false);
      setTimeout(() => setPwdMsg(""), 2000);
    } catch (e2) {
      setPwdMsg(e2.message);
    } finally {
      setPwdSaving(false);
    }
  };

  if (loading) return <p>Cargando información del usuario...</p>;

  return (
    <section className={`perfil ${darkMode ? "dark" : "light"}`}>
      <div className="perfil-grid">
        {/* Foto y estado */}
        <div className="card perfil-foto">
          <img src={usuarioImg} alt="Usuario" className="profile-avatar" />
          <h2>{usuario.nombre}</h2>
          <p><FaPhoneAlt /> Teléfono: {usuario.telefono}</p>
          <p>Email: {usuario.email}</p>
          <span className={`profile-status ${usuario.activo ? "activo" : "desactivado"}`}>
            {usuario.activo ? "Activo" : "Desactivado"}
          </span>
        </div>

        {/* Información de contacto */}
        <div className="card perfil-info">
          <h3>Información de Contacto <FaEdit /></h3>
          <div className="contacto">
            <h4>Contacto de Emergencia</h4>
            <p><FaPhoneAlt /> Nombre: {usuario.contacto_emergencia?.nombre || "No registrado"}</p>
            <p><FaPhoneAlt /> Teléfono: {usuario.contacto_emergencia?.telefono || "No registrado"}</p>
          </div>

          {guardado && (
            <p style={{ color: "#22a06b", fontWeight: 600, marginTop: 8 }}>
              Datos actualizados ✅
            </p>
          )}
          {error && (
            <p style={{ color: "#d33", marginTop: 8 }}>
              {error}
            </p>
          )}

          <button className="btn-edit" onClick={abrirEditar}>
            <FaEdit /> Editar Información
          </button>
        </div>

        {/* Seguridad */}
        <div className="card perfil-seguridad">
          <h3>Seguridad</h3>
          <p>Último acceso: {usuario.ultimo_acceso}</p>
          <button className="btn-change-pass" onClick={() => setShowPass(true)}>
            <FaLock /> Cambiar Contraseña
          </button>
          {!!pwdMsg && <p style={{ marginTop: 8 }}>{pwdMsg}</p>}
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

      {/* MODAL Editar información */}
      {showEdit && (
        <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && setShowEdit(false)}>
          <form
            style={modalCard}
            className="modal"
            onSubmit={guardarPerfil}
            onKeyDown={(e) => e.key === "Enter" && guardarPerfil(e)}
          >
            <div style={modalHeader}>
              <h3 style={{ margin: 0 }}>Editar Información</h3>
              <button type="button" aria-label="Cerrar" style={modalClose} onClick={() => setShowEdit(false)}>×</button>
            </div>

            <div style={field}>
              <label>Nombre</label>
              <input
                style={input}
                type="text"
                value={form.nombre}
                onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                placeholder="Tu nombre"
              />
            </div>

            <div style={field}>
              <label>Teléfono (9 dígitos)</label>
              <input
                style={input}
                type="text"
                value={form.telefono}
                onChange={(e) => setForm({ ...form, telefono: digits9(e.target.value) })}
                placeholder="Ej: 987654321"
                inputMode="numeric"
              />
            </div>

            <div style={field}>
              <label>Contacto de emergencia - Nombre</label>
              <input
                style={input}
                type="text"
                value={form.contacto_emergencia_nombre}
                onChange={(e) =>
                  setForm({ ...form, contacto_emergencia_nombre: e.target.value })
                }
                placeholder="Nombre del contacto"
              />
            </div>

            <div style={field}>
              <label>Contacto de emergencia - Teléfono (9 dígitos)</label>
              <input
                style={input}
                type="text"
                value={form.contacto_emergencia_telefono}
                onChange={(e) =>
                  setForm({ ...form, contacto_emergencia_telefono: digits9(e.target.value) })
                }
                placeholder="Ej: 912345678"
                inputMode="numeric"
              />
            </div>

            <div style={actions}>
              <button className="btn-guardar" type="submit" disabled={saving}>
                {saving ? "Guardando..." : "Guardar"}
              </button>
              <button className="btn-cancelar" type="button" onClick={() => setShowEdit(false)} disabled={saving}>
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL Cambiar contraseña */}
      {showPass && (
        <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && setShowPass(false)}>
          <form
            style={modalCard}
            className="modal"
            onSubmit={cambiarPassword}
            onKeyDown={(e) => e.key === "Enter" && cambiarPassword(e)}
          >
            <div style={modalHeader}>
              <h3 style={{ margin: 0 }}>Cambiar contraseña</h3>
              <button type="button" aria-label="Cerrar" style={modalClose} onClick={() => setShowPass(false)}>×</button>
            </div>

            <div style={field}>
              <label>Contraseña actual</label>
              <input
                style={input}
                type="password"
                value={pwd.actual}
                onChange={(e) => setPwd({ ...pwd, actual: e.target.value })}
                placeholder="Actual"
              />
            </div>

            <div style={field}>
              <label>Nueva contraseña</label>
              <input
                style={input}
                type="password"
                value={pwd.nueva}
                onChange={(e) => setPwd({ ...pwd, nueva: e.target.value })}
                placeholder="Nueva (mínimo 6 caracteres)"
              />
            </div>

            <div style={actions}>
              <button className="btn-guardar" type="submit" disabled={pwdSaving}>
                {pwdSaving ? "Actualizando..." : "Actualizar"}
              </button>
              <button className="btn-cancelar" type="button" onClick={() => setShowPass(false)} disabled={pwdSaving}>
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}
    </section>
  );
}
