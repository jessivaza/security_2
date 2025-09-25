import { useEffect, useState } from "react";
import "../../css/Vista_usuario/Graficoresumen.css";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";

export default function Resumen() {
  const [data, setData] = useState({
    niveles_incidencia: [
      { idEscalaIncidencia__Descripcion: "Alta", total: 5 },
      { idEscalaIncidencia__Descripcion: "Media", total: 8 },
      { idEscalaIncidencia__Descripcion: "Baja", total: 12 },
    ],
    evolucion_reportes: [
      { fecha: "2025-09-20", cantidad: 3 },
      { fecha: "2025-09-21", cantidad: 5 },
      { fecha: "2025-09-22", cantidad: 7 },
      { fecha: "2025-09-23", cantidad: 2 },
    ],
  });
  const [error, setError] = useState(null);
  const [nuevoNivel, setNuevoNivel] = useState("Media");
  const [nuevoTotal, setNuevoTotal] = useState(1);
  const [nuevaFecha, setNuevaFecha] = useState("2025-09-24");
  const [nuevaCantidad, setNuevaCantidad] = useState(1);

  const COLORS = ["#4caf50", "#ff9800", "#f44336"];

  const incidentesData = data.niveles_incidencia.map((nivel) => ({
    name: nivel.idEscalaIncidencia__Descripcion,
    value: nivel.total,
  }));

  const evolucionData = data.evolucion_reportes.map((rep) => ({
    fecha: rep.fecha,
    cantidad: rep.cantidad,
  }));

  // Función para agregar datos manualmente
  const agregarDatos = () => {
    setData((prev) => ({
      niveles_incidencia: [
        ...prev.niveles_incidencia,
        { idEscalaIncidencia__Descripcion: nuevoNivel, total: Number(nuevoTotal) },
      ],
      evolucion_reportes: [
        ...prev.evolucion_reportes,
        { fecha: nuevaFecha, cantidad: Number(nuevaCantidad) },
      ],
    }));
    setNuevoTotal(1);
    setNuevaCantidad(1);
  };

  return (
    <section className="resumen-section">
      {/* Formulario para agregar datos manualmente */}
      <div className="resumen-form mb-3">
        <h4>Agregar datos de prueba</h4>
        <div className="d-flex gap-2 mb-2">
          <select value={nuevoNivel} onChange={(e) => setNuevoNivel(e.target.value)}>
            <option>Alta</option>
            <option>Media</option>
            <option>Baja</option>
          </select>
          <input
            type="number"
            value={nuevoTotal}
            onChange={(e) => setNuevoTotal(e.target.value)}
            placeholder="Total incidentes"
          />
          <input
            type="date"
            value={nuevaFecha}
            onChange={(e) => setNuevaFecha(e.target.value)}
          />
          <input
            type="number"
            value={nuevaCantidad}
            onChange={(e) => setNuevaCantidad(e.target.value)}
            placeholder="Cantidad reportes"
          />
          <button className="btn btn-sm btn-primary" onClick={agregarDatos}>
            Agregar
          </button>
        </div>
      </div>

      {/* Contenedor de gráficos */}
      <div className="resumen-cards">
        {/* Gráfico de niveles de incidencia */}
        <div className="resumen-card">
          <h3>🚨 Incidentes por nivel</h3>
          {incidentesData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={incidentesData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  label
                >
                  {incidentesData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p>No hay datos de incidentes</p>
          )}
        </div>

        {/* Gráfico de evolución de reportes */}
        <div className="resumen-card">
          <h3>📈 Evolución de reportes</h3>
          {evolucionData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={evolucionData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="fecha" />
                <YAxis />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="cantidad"
                  stroke="#2196f3"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p>No hay evolución de reportes</p>
          )}
        </div>
      </div>
    </section>
  );
}
