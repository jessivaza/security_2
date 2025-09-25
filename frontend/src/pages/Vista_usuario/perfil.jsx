import { useState, useEffect } from "react";
import usuarioImg from "../../img/usuario/img.png";
import "../../css/Vista_usuario/perfil.css";
import { FaEdit, FaLock, FaBell, FaPhoneAlt } from "react-icons/fa";

export default function Perfil({ darkMode, setDarkMode }) {
    const [usuario, setUsuario] = useState({
        nombre: "Jessica Vazallo",
        email: "jessica@example.com",
        telefono: "+51 999 999 999",
        activo: true,
        emergencia: { nombre: "Ana Pérez", telefono: "+51 988 888 888" },
        ultimo_acceso: "24/09/2025 14:00",
        reportes: [
            { id: 1, titulo: "Reporte 1", fecha: "20/09/2025" },
            { id: 2, titulo: "Reporte 2", fecha: "21/09/2025" },
        ]
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem("access_token"); // tu JWT

        // Traer info básica y seguridad
        fetch("/dashUsuario/", {
            headers: { "Authorization": `Bearer ${token}` }
        })
        .then(res => res.json())
        .then(data => {
            console.log("Datos de dashUsuario:", data); // <--- revisa en consola
            setUsuario(prev => ({
                ...prev,
                nombre: data.user.username || prev.nombre,
                email: data.user.email || prev.email,
                activo: true
            }));
        })
        .catch(err => console.error("Error dashUsuario:", err));

        // Traer reportes / actividad
        fetch("/resumen/", {
            headers: { "Authorization": `Bearer ${token}` }
        })
        .then(res => res.json())
        .then(data => {
            console.log("Datos de resumen:", data); // <--- revisa en consola
            if (data.evolucion_reportes) {
                setUsuario(prev => ({
                    ...prev,
                    reportes: data.evolucion_reportes.map((r, index) => ({
                        id: index,
                        titulo: `Reporte del ${r.fecha}`,
                        fecha: r.fecha
                    }))
                }));
            }
        })
        .catch(err => console.error("Error resumen:", err))
        .finally(() => setLoading(false));
    }, []);

    if (loading) return <p>Cargando información del usuario...</p>;

    return (
        <section className={`perfil ${darkMode ? "dark" : "light"}`}>
            <div className="perfil-grid">

                {/* Cuadro 1: Foto */}
                <div className="card perfil-foto">
                    <img src={usuarioImg} alt="Usuario" className="profile-avatar" />
                    <h2>{usuario.nombre}</h2>
                    <p><FaPhoneAlt /> Teléfono: {usuario.telefono}</p>
                    <p>Email: {usuario.email}</p>
                    <span className={`profile-status ${usuario.activo ? "activo" : "desactivado"}`}>
                        {usuario.activo ? "Activo" : "Desactivado"}
                    </span>
                </div>

                {/* Cuadro 2: Información */}
                <div className="card perfil-info">
                    <h3>Información de Contacto <FaEdit /></h3>
                    <div className="contacto">
                        <h4>Contacto de Emergencia</h4>
                        <p><FaPhoneAlt /> Nombre: {usuario.emergencia.nombre}</p>
                        <p><FaPhoneAlt /> Teléfono: {usuario.emergencia.telefono}</p>
                    </div>
                    <button className="btn-edit"><FaEdit /> Editar Información</button>
                </div>

                {/* Cuadro 3: Seguridad */}
                <div className="card perfil-seguridad">
                    <h3>Seguridad <FaLock /></h3>
                    <p>Último acceso: {usuario.ultimo_acceso}</p>
                    <button className="btn-change-pass"><FaLock /> Cambiar Contraseña</button>
                </div>

                {/* Cuadro 4: Preferencias */}
                <div className="card perfil-preferencias">
                    <h3>Preferencias <FaBell /></h3>
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

            {/* Actividad / Mis reportes */}
            <div className="card perfil-actividad">
                <h3>Mis Reportes</h3>
                <ul>
                    {usuario.reportes && usuario.reportes.length > 0 ? (
                        usuario.reportes.map(r => (
                            <li key={r.id}>
                                {r.titulo} - {r.fecha}
                            </li>
                        ))
                    ) : (
                        <li>No hay reportes</li>
                    )}
                </ul>
            </div>
        </section>
    );
}
