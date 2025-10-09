import React, { useState, useEffect } from 'react';
import '../../css/Vista_Administrador/Historial.css';

const API = "http://127.0.0.1:8000/api";

const Historial = () => {
  const [incidentes, setIncidentes] = useState([]);

  useEffect(() => {
    // Datos de ejemplo fallback
    const datosEjemplo = [
      { id: "INC-001", fecha: "2024-01-15", usuario: "Carlos Mendoza", ubicacion: "Av. Universitaria 123", incidente: "Robo", descripcion: "Robo de celular a transeúnte", escala: "Alta", estado: "Resuelto" },
      { id: "INC-002", fecha: "2024-01-14", usuario: "Ana Vargas", ubicacion: "Jr. Los Olivos 456", incidente: "Accidente", descripcion: "Choque menor entre vehículos", escala: "Alta", estado: "En proceso" }
    ];

    const token = localStorage.getItem("access");
    if (!token) {
      setIncidentes(datosEjemplo);
      return;
    }

    fetch(`${API}/historial/incidentes/`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then((res) => {
        if (!res.ok) throw new Error("No se pudo cargar historial");
        return res.json();
      })
      .then((data) => {
        // normalizar formato para la tabla
        const mapped = (data || []).map((d) => ({
          id: d.idTipoIncidencia,
          fecha: d.FechaHora ? new Date(d.FechaHora).toLocaleString() : "",
          usuario: d.usuario || "-",
          ubicacion: d.Ubicacion,
          incidente: d.NombreIncidente,
          descripcion: d.Descripcion,
          escala: d.Escala || d.Escala, // puede venir ya como etiqueta
          estado: d.estado,
        }));
        setIncidentes(mapped.length ? mapped : datosEjemplo);
      })
      .catch((err) => {
        console.error("Historial fetch error:", err);
        setIncidentes(datosEjemplo);
      });
  }, []);

  const getEstadoClass = (estado) => {
    switch(estado) {
      case 'Resuelto': return 'estado-resuelto';
      case 'En proceso': return 'estado-proceso';
      case 'Pendiente': return 'estado-pendiente';
      default: return '';
    }
  };

  return (
    <div className="historial-container">
      <div className="historial-header">
        <h2>📋 Historial de Incidentes</h2>
        <p>Registro completo de incidencias</p>
      </div>
      
      <div className="historial-table-container" style={{ maxHeight: '400px', overflowY: 'auto' }}>
        <table className="historial-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Fecha</th>
              <th>Usuario</th>
              <th>Ubicación</th>
              <th>Incidente</th>
              <th>Descripción</th>
              <th>Escala</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {incidentes.map((incidente, index) => (
              <tr key={index}>
                <td>{incidente.id}</td>
                <td>{incidente.fecha}</td>
                <td>{incidente.usuario}</td>
                <td>{incidente.ubicacion}</td>
                <td>{incidente.incidente}</td>
                <td>{incidente.descripcion}</td>
                <td>{incidente.escala}</td>
                <td>
                  <span className={`estado-badge ${getEstadoClass(incidente.estado)}`}>
                    {incidente.estado}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Historial;