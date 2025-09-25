import React, { useState, useEffect } from "react";
import "../../css/Vista_usuario/reportes.css";

export default function MisReportes() {
  const usuarioActual = "Jessica Vazallo"; // Usuario logueado

  const [reportes, setReportes] = useState([
    { id: 1, usuario: "Jessica Vazallo", fecha: "2025-09-24 10:30", tipo: "Robo", mensaje: "Robo reportado en Av. Universitaria", prioridad: "alta" },
    { id: 2, usuario: "Juan Perez", fecha: "2025-09-24 09:15", tipo: "Accidente", mensaje: "Choque entre vehículos en Av. Alfredo Mendiola", prioridad: "media" },
    { id: 3, usuario: "Jessica Vazallo", fecha: "2025-09-23 20:45", tipo: "Evento", mensaje: "Reunión vecinal sobre seguridad en Los Olivos", prioridad: "baja" },
  ]);

  // Filtrar solo reportes del usuario actual
  const misReportes = reportes.filter(r => r.usuario === usuarioActual);

  return (
    <div className="mis-reportes">
      <h3>📋 Mis Reportes</h3>
      {misReportes.length === 0 ? (
        <p>No tienes reportes aún</p>
      ) : (
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
            {misReportes.map(r => (
              <tr key={r.id} className={`prioridad-${r.prioridad}`}>
                <td>{r.fecha}</td>
                <td>{r.tipo}</td>
                <td>{r.mensaje}</td>
                <td>{r.prioridad}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
