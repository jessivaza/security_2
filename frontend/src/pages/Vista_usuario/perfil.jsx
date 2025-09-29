import { useState, useEffect } from "react";
import usuarioImg from "../../img/usuario/img.png";
import "../../css/Vista_usuario/perfil.css";
import { FaEdit, FaLock, FaPhoneAlt } from "react-icons/fa";

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
        const token = localStorage.getItem("access"); // JWT del login
        if (!token) return;

        fetch("http://127.0.0.1:8000/api/perfilUsuario/", {
            headers: { "Authorization": `Bearer ${token}` }
        })
            .then((res) => res.json())
            .then((data) => {
                setUsuario((prev) => ({
                    ...prev,
                    nombre: data.nombre || prev.nombre,
                    email: data.email || prev.email,
                    telefono: data.telefono || prev.telefono,
                    activo: data.activo !== undefined ? data.activo : prev.activo,
                    ultimo_acceso: data.ultimo_acceso || prev.ultimo_acceso,
                    contacto_emergencia: data.contacto_emergencia || prev.contacto_emergencia,
                    preferencias: data.preferencias || prev.preferencias,
                }));
            })
            .catch((err) => console.error("Error al cargar perfil:", err))
            .finally(() => setLoading(false));
    }, []);

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
                        <p><FaPhoneAlt /> Nombre: {usuario.contacto_emergencia.nombre}</p>
                        <p><FaPhoneAlt /> Teléfono: {usuario.contacto_emergencia.telefono}</p>
                    </div>
                    <button className="btn-edit"><FaEdit /> Editar Información</button>
                </div>

                {/* Seguridad */}
                <div className="card perfil-seguridad">
                    <h3>Seguridad</h3>
                    <p>Último acceso: {usuario.ultimo_acceso}</p>
                    <button className="btn-change-pass"><FaLock /> Cambiar Contraseña</button>
                </div>

                {/* Preferencias */}
                <div className="card perfil-preferencias">
                    <h3>Preferencias</h3>
                    <label className="toggle">
                        <input
                            type="checkbox"
                            checked={darkMode}
                            onChange={() => setDarkMode(!darkMode)}
                        />
                        <span className="slider"></span>
                        Modo Oscuro
                    </label>
                </div>

            </div>
        </section>
    );
}
