import React, { useState, useEffect } from 'react';
import '../../css/Vista_Administrador/Historial.css';

const Historial = () => {
  const [incidentes, setIncidentes] = useState([]);

  useEffect(() => {
    // Datos de ejemplo - aquí conectarías con tu API
    const datosEjemplo = [
      {
        id: "INC-001",
        fecha: "2024-01-15",
        ubicacion: "Av. Universitaria 123",
        tipo: "Robo",
        descripcion: "Robo de celular a transeúnte",
        estado: "Resuelto"
      },
      {
        id: "INC-002", 
        fecha: "2024-01-14",
        ubicacion: "Jr. Los Olivos 456",
        tipo: "Accidente",
        descripcion: "Choque menor entre vehículos",
        estado: "En proceso"
      },
      {
        id: "INC-003",
        fecha: "2024-01-13",
        ubicacion: "Plaza Los Olivos",
        tipo: "Disturbios",
        descripcion: "Alteración del orden público",
        estado: "Pendiente"
      },
      {
        id: "INC-004",
        fecha: "2024-01-12",
        ubicacion: "Av. Carlos Izaguirre 789",
        tipo: "Asalto",
        descripcion: "Asalto a mano armada en comercio",
        estado: "Resuelto"
      },
      {
        id: "INC-005",
        fecha: "2024-01-11",
        ubicacion: "Jr. Mercurio 321",
        tipo: "Vandalismo",
        descripcion: "Daños a propiedad privada",
        estado: "En proceso"
      }
    ];
    setIncidentes(datosEjemplo);
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
        <p>Registro completo de incidencias reportadas en Los Olivos</p>
      </div>
      
      <div className="historial-table-container">
        <table className="historial-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Fecha</th>
              <th>Ubicación</th>
              <th>Tipo</th>
              <th>Descripción</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {incidentes.map((incidente, index) => (
              <tr key={index}>
                <td>{incidente.id}</td>
                <td>{incidente.fecha}</td>
                <td>{incidente.ubicacion}</td>
                <td>{incidente.tipo}</td>
                <td>{incidente.descripcion}</td>
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