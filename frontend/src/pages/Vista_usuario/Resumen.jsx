import { useEffect, useState } from "react";
import "../../css/Vista_usuario/Graficoresumen.css";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";

const API = "http://127.0.0.1:8000/api";

const LEVELS = {
  1: { name: "Bajo", color: "#4caf50" },
  2: { name: "Medio", color: "#ff9800" },
  3: { name: "Alto", color: "#f44336" },
};

const resolveLevel = (r) => {
  const escalaValue =
    r.Escala ?? r.escala ?? r.idEscala ?? r.idEscalaIncidencia ?? r.IdEscala;
  const nivel = Number(escalaValue);
  if (nivel >= 1 && nivel <= 3) return nivel;
  if (typeof escalaValue === "string") {
    const s = escalaValue.toLowerCase().trim();
    if (s.includes("bajo")) return 1;
    if (s.includes("medio")) return 2;
    if (s.includes("alto")) return 3;
  }
  return null;
};

const rollupFromReportes = (reportes = []) => {
  const counts = { 1: 0, 2: 0, 3: 0 };
  for (const r of reportes) {
    const lvl = resolveLevel(r);
    if (lvl) counts[lvl] += 1;
  }
  const pieData = Object.entries(counts)
    .map(([k, v]) => ({
      name: LEVELS[k].name,
      value: v,
      color: LEVELS[k].color,
    }))
    .filter((d) => d.value > 0);

  return pieData.length > 0
    ? pieData
    : [{ name: "Sin datos", value: 1, color: "#ccc" }];
};

const fmtTick = (ts) =>
  new Date(ts).toLocaleDateString("es-PE", { day: "2-digit", month: "short" });

const rollupLineFromReportes = (reportes = []) => {
  const byDay = new Map();
  for (const r of reportes) {
    const d = new Date(r.FechaHora);
    if (Number.isNaN(d.getTime())) continue;
    const fecha = d.toISOString().slice(0, 10);
    byDay.set(fecha, (byDay.get(fecha) || 0) + 1);
  }
  return [...byDay.entries()]
    .map(([fecha, cantidad]) => ({ fecha, cantidad }))
    .sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
};

export default function Resumen() {
  const [pieData, setPieData] = useState(null);
  const [lineData, setLineData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("access");
    if (!token) {
      setError("No hay token. Inicia sesión.");
      setLoading(false);
      return;
    }

    const fetchResumen = async () => {
      try {
        const mrRes = await fetch(`${API}/mis-reportes/`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!mrRes.ok) throw new Error("No se pudo cargar reportes");

        const reportes = await mrRes.json();
        const filteredReportes = reportes.filter((r) => {
          const lvl = resolveLevel(r);
          return lvl >= 1 && lvl <= 3;
        });

        const pie = rollupFromReportes(filteredReportes);
        setPieData(pie);

        let line = rollupLineFromReportes(filteredReportes);

// ✅ BLOQUE DEFINITIVO: muestra los últimos 7 días incluyendo HOY (sin desfase)
const today = new Date();
const last7Days = [];

for (let i = 5; i >= 0; i--) {
  const d = new Date();
  d.setDate(today.getDate() - i);

  // Corrige zona horaria manualmente
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const formatted = `${year}-${month}-${day}`;

  last7Days.push(formatted);
}

const completeLineData = last7Days.map((day) => {
  const found = line.find((r) => r.fecha === day);
  return { fecha: day, cantidad: found ? found.cantidad : 0 };
});

        setLineData(completeLineData);
      } catch (err) {
        console.error("❌ Error cargando datos:", err);
        setError("No se pudo cargar el resumen");
      } finally {
        setLoading(false);
      }
    };

    fetchResumen();
  }, []);

  if (error) return <p style={{ color: "red" }}>⚠️ {error}</p>;
  if (loading) return <p>Cargando resumen...</p>;
  if (!pieData || !lineData) return <p>No hay datos disponibles</p>;

  const legendPayload = pieData
    .filter((d) => d.name !== "Sin datos")
    .map((d, i) => ({
      id: i,
      type: "square",
      value: d.name,
      color: d.color,
    }));

  return (
    <section className="resumen-section">
      <div className="resumen-cards">
        {/* PIE CHART */}
        <div className="resumen-card">
          <h3>🚨 Incidentes por nivel</h3>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={pieData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={90}
                label={({ payload, percent }) => {
                  if (payload.name === "Sin datos") return "Sin datos";
                  return `${payload.name}: ${payload.value} (${(
                    percent * 100
                  ).toFixed(0)}%)`;
                }}
              >
                {pieData.map((e, i) => (
                  <Cell key={i} fill={e.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(val, _n, { payload }) => [val, payload?.name]}
              />
              {legendPayload.length > 0 && (
                <Legend payload={legendPayload} verticalAlign="bottom" />
              )}
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* LINE CHART */}
        <div className="resumen-card">
          <h3>📈 Evolución de reportes</h3>
          {Array.isArray(lineData) && lineData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart
                data={lineData}
                margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="fecha"
                  type="category"
                  tickFormatter={(d) =>
                    new Date(d).toLocaleDateString("es-PE", {
                      day: "2-digit",
                      month: "short",
                    })
                  }
                />
                <YAxis allowDecimals={false} domain={[0, "dataMax + 1"]} />
                <Tooltip
                  labelFormatter={(ts) => `Fecha: ${fmtTick(ts)}`}
                  formatter={(v) => [v, "Reportes"]}
                />
                <defs>
                  <linearGradient id="colorLine" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2196f3" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#2196f3" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Line
                  type="monotone"
                  dataKey="cantidad"
                  stroke="#2196f3"
                  strokeWidth={3}
                  dot={{ r: 5, stroke: "#2196f3", strokeWidth: 2, fill: "#fff" }}
                  activeDot={{ r: 7, fill: "#2196f3" }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p style={{ color: "#999", margin: "12px 0 0 8px" }}>
              No hay evolución de reportes
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
