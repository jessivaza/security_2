// frontend/src/pages/Vista_usuario/Resumen.jsx
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

// Colores por nivel
const LEVELS = {
  1: { name: "Bajo", color: "#4caf50" },
  2: { name: "Medio", color: "#ff9800" },
  3: { name: "Alto", color: "#f44336" },
};

// Resuelve nivel de un reporte con múltiples intentos
const resolveLevel = (r) => {
  // Intenta obtener el valor de diferentes posibles campos
  let escalaValue = r.Escala ?? r.escala ?? r.idEscala ?? r.idEscalaIncidencia ?? r.IdEscala;
  
  // Convierte a número si es string
  const nivel = Number(escalaValue);
  
  // Solo retorna si es 1, 2 o 3 (ignora 4 = Pendiente)
  if (nivel >= 1 && nivel <= 3) {
    return nivel;
  }
  
  // Si el valor es texto, intenta mapear
  if (typeof escalaValue === 'string') {
    const s = escalaValue.toLowerCase().trim();
    if (s.includes("bajo")) return 1;
    if (s.includes("medio")) return 2;
    if (s.includes("alto")) return 3;
  }
  
  return null; // No clasificable
};

// Pie data desde reportes
const rollupFromReportes = (reportes = []) => {
  const counts = { 1: 0, 2: 0, 3: 0 };

  for (const r of reportes) {
    const lvl = resolveLevel(r);
    if (lvl) counts[lvl] += 1;
  }

  // Retorna datos solo si hay al menos un reporte
  const pieData = Object.entries(counts)
    .map(([k, v]) => ({ 
      name: LEVELS[k].name, 
      value: v, 
      color: LEVELS[k].color 
    }))
    .filter(d => d.value > 0);

  // Si no hay datos, retorna un array con un elemento dummy
  return pieData.length > 0 ? pieData : [{ name: "Sin datos", value: 1, color: "#ccc" }];
};

// Formateo de fecha para el eje X
const fmtTick = (ts) =>
  new Date(ts).toLocaleDateString("es-PE", { day: "2-digit", month: "short" });

// Convierte datos de evolución a formato de línea
const toLineData = (raw = []) =>
  raw.map((r) => {
    const s = String(r.fecha ?? "").slice(0, 10);
    let ts;
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
      const [y, m, d] = s.split("-").map(Number);
      ts = new Date(y, m - 1, d).getTime();
    } else {
      const d = new Date(r.fecha);
      ts = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
    }
    return { ts, cantidad: Number(r.cantidad) || 0 };
  });

// Fallback: agrupa reportes por día
const rollupLineFromReportes = (reportes = []) => {
  const byDay = new Map();
  for (const r of reportes) {
    const d = new Date(r.FechaHora);
    if (Number.isNaN(d.getTime())) continue;
    const ts = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
    byDay.set(ts, (byDay.get(ts) || 0) + 1);
  }
  return [...byDay.entries()]
    .map(([ts, cantidad]) => ({ ts, cantidad }))
    .sort((a, b) => a.ts - b.ts);
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
        // Primero intenta obtener desde /mis-reportes (más confiable)
        const mrRes = await fetch(`${API}/mis-reportes/`, { 
          headers: { Authorization: `Bearer ${token}` } 
        });
        
        if (!mrRes.ok) throw new Error("No se pudo cargar reportes");
        
        const reportes = await mrRes.json();
        
        console.log("📊 Reportes cargados:", reportes); // Debug
        console.log("📊 Primer reporte:", reportes[0]); // Debug

        // Filtra solo niveles 1-3
        const filteredReportes = reportes.filter(r => {
          const lvl = resolveLevel(r);
          console.log(`Reporte ${r.idTipoIncidencia}: escala detectada = ${lvl}`); // Debug
          return lvl >= 1 && lvl <= 3;
        });

        console.log("✅ Reportes filtrados (1-3):", filteredReportes.length); // Debug

        // Genera datos del pie
        const pie = rollupFromReportes(filteredReportes);
        setPieData(pie);
        
        console.log("🥧 Datos del pie:", pie); // Debug

        // Genera datos de línea
        const line = rollupLineFromReportes(filteredReportes);
        setLineData(line);

        console.log("📈 Datos de línea:", line); // Debug

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

  // Leyenda manual
  const legendPayload = pieData
    .filter(d => d.name !== "Sin datos")
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
                  return `${payload.name}: ${payload.value} (${(percent * 100).toFixed(0)}%)`;
                }}
              >
                {pieData.map((e, i) => <Cell key={i} fill={e.color} />)}
              </Pie>
              <Tooltip formatter={(val, _n, { payload }) => [val, payload?.name]} />
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
              <LineChart data={lineData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="ts"
                  type="number"
                  scale="time"
                  domain={["dataMin", "dataMax"]}
                  tickFormatter={fmtTick}
                  minTickGap={20}
                />
                <YAxis allowDecimals={false} domain={[0, "dataMax + 1"]} />
                <Tooltip
                  labelFormatter={(ts) => `Fecha: ${fmtTick(ts)}`}
                  formatter={(v) => [v, "Reportes"]}
                />
                <Line
                  type="monotone"
                  dataKey="cantidad"
                  stroke="#2196f3"
                  strokeWidth={3}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
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