import React, { useState, useEffect } from "react";
import { FaWhatsapp } from "react-icons/fa";
import "../../css/Vista_usuario/alertas.css";

export default function MisAlertas({ darkMode }) {
  const [alertas, setAlertas] = useState([
    { id: 1, fecha: "2025-09-24 10:30", tipo: "Robo", mensaje: "Robo reportado en Av. Universitaria", prioridad: "alta" },
    { id: 2, fecha: "2025-09-24 09:15", tipo: "Accidente", mensaje: "Choque entre vehículos en Av. Alfredo Mendiola", prioridad: "media" },
    { id: 3, fecha: "2025-09-23 20:45", tipo: "Evento", mensaje: "Reunión vecinal sobre seguridad en Los Olivos", prioridad: "baja" },
    { id: 4, fecha: "2025-09-23 18:30", tipo: "Emergencia", mensaje: "Incendio controlado en zona industrial", prioridad: "alta" },
    { id: 5, fecha: "2025-09-22 08:00", tipo: "Info", mensaje: "Campaña de prevención de delitos en parques", prioridad: "baja" },
  ]);

  useEffect(() => {
    const interval = setInterval(() => {
      const hora = new Date().toLocaleTimeString();
      const tipos = ["Robo", "Accidente", "Evento", "Emergencia", "Info"];
      const prioridades = ["alta", "media", "baja"];
      const tipo = tipos[Math.floor(Math.random() * tipos.length)];
      const prioridad = prioridades[Math.floor(Math.random() * prioridades.length)];

      setAlertas(prev => [
        {
          id: Date.now(),
          fecha: new Date().toLocaleString(),
          tipo,
          mensaje: `Nueva alerta de tipo ${tipo} generada a las ${hora}`,
          prioridad
        },
        ...prev
      ]);
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  const ultimoRobo = alertas.find(a => a.tipo === "Robo");

  const abrirWhatsapp = () => {
    window.open("https://chat.whatsapp.com/tuCodigoDelGrupo", "_blank");
  };

  return (
    <div className={`mis-alertas ${darkMode ? "dark" : "light"}`}>
      <h3>📢 Alertas de la Comunidad</h3>

      {ultimoRobo && (
        <div className="ultimo-robo">
          <strong>Último Robo:</strong> {ultimoRobo.mensaje}  
          <button onClick={abrirWhatsapp} className="btn-whatsapp">
            <FaWhatsapp /> Unirse
          </button>
        </div>
      )}

      {alertas.length === 0 ? (
        <p>No hay alertas aún</p>
      ) : (
        <div className="table-wrapper">
          <table>
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Tipo</th>
              <th>Mensaje</th>
              <th>Prioridad</th>
            </tr>
          </thead>
          <tbody>
            {alertas.map(a => (
              <tr key={a.id} className={`prioridad-${a.prioridad}`}>
                <td>{a.fecha}</td>
                <td>{a.tipo}</td>
                <td>{a.mensaje}</td>
                <td>{a.prioridad}</td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      )}
    </div>
  );
}
