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
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("access");
    if (!token) {
      setError("No hay token disponible. Inicia sesión.");
      return;
    }

    fetch("http://127.0.0.1:8000/api/resumen/", {
      headers: {
        "Authorization": `Bearer ${token}`, // ✅ SimpleJWT
      },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Error al cargar resumen");
        return res.json();
      })
      .then((data) => setData(data))
      .catch((err) => setError(err.message));
  }, []);


  if (error) return <p style={{ color: "red" }}>⚠️ {error}</p>;
  if (!data) return <p>Cargando resumen...</p>;

  // ✅ Mapeo de colores por nombre
  const getColorByNivel = (nombre) => {
    if (!nombre) return "#999";
    const nivel = nombre.toLowerCase();
    if (nivel.includes("alto")) return "#f44336"; // rojo
    if (nivel.includes("medio")) return "#ff9800"; // naranja
    if (nivel.includes("bajo")) return "#4caf50"; // verde
    return "#999";
  };


  const incidentesData =
    data?.niveles_incidencia?.map((nivel) => ({
      name: nivel.idEscalaIncidencia__Descripcion,
      value: nivel.total,
    })) || [];

  const evolucionData =
    data?.evolucion_reportes?.map((rep) => ({
      fecha: rep.fecha,
      cantidad: rep.cantidad,
    })) || [];

  return (
    <section className="resumen-section">
      <div className="resumen-cards">
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
                      fill={getColorByNivel(entry.name)}
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

        <div className="resumen-card">
          <h3>📈 Evolución de reportes</h3>
          {evolucionData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={evolucionData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="fecha" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="cantidad" stroke="#2196f3" strokeWidth={2} />
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
