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
  1: { name: "Bajo",  color: "#4caf50" },
  2: { name: "Medio", color: "#ff9800" },
  3: { name: "Alto",  color: "#f44336" },
};
const UNCLASS = { name: "No clasificado", color: "#9e9e9e" };

// --- Heurística para inferir nivel por título si no viene id/texto de escala
const inferFromTitle = (t = "") => {
  const s = String(t).toLowerCase();
  const alto  = ["robo", "asalto", "hurto", "intento de asesinato", "homicidio", "secuestro"];
  const medio = ["accidente", "choque", "incendio", "explosión", "pelea", "amenaza"];
  if (alto.some(k => s.includes(k))) return 3;
  if (medio.some(k => s.includes(k))) return 2;
  return 1; // resto -> bajo
};

// Texto a nivel (por si el backend devuelve "Alto/Medio/Bajo")
const strToLevel = (esc = "") => {
  const s = String(esc).toLowerCase().trim();
  if (s.includes("alto")) return 3;
  if (s.includes("medio")) return 2;
  if (s.includes("bajo")) return 1;
  return 0;
};

// Resuelve nivel de un reporte: id -> texto -> heurística
const resolveLevel = (r) => {
  const id = Number(
    r.idEscalaIncidencia ??
    r.id_escala ??
    r.IdEscala
  );
  if (!Number.isNaN(id) && id >= 1 && id <= 3) return id;

  const byText = strToLevel(r.Escala || r.escala || "");
  if (byText) return byText;

  return inferFromTitle(r.NombreIncidente || r.nombre || "");
};

// Pie data desde /mis-reportes si /resumen no sirve
const rollupFromReportes = (reportes = []) => {
  const counts = { 1: 0, 2: 0, 3: 0 };
  for (const r of reportes) {
    const lvl = resolveLevel(r);
    if (lvl >= 1 && lvl <= 3) counts[lvl] += 1;
  }
  const data = Object.entries(counts)
    .filter(([, v]) => v > 0)
    .map(([k, v]) => ({
      name: LEVELS[k].name,
      value: v,
      color: LEVELS[k].color,
    }));
  return data.length ? data : [{ name: UNCLASS.name, value: 0, color: UNCLASS.color }];
};

// --------- LÍNEA: utilidades (usar medianoche LOCAL) ---------
const fmtTick = (ts) =>
  new Date(ts).toLocaleDateString("es-PE", { day: "2-digit", month: "short" });

/** Convierte [{fecha:"YYYY-MM-DD", cantidad:N}] a [{ts, cantidad}] usando medianoche LOCAL */
const toLineData = (raw = []) =>
  raw.map((r) => {
    const s = String(r.fecha ?? "").slice(0, 10); // 'YYYY-MM-DD'
    let ts;
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
      const [y, m, d] = s.split("-").map(Number);
      ts = new Date(y, m - 1, d).getTime(); // medianoche local
    } else {
      const d = new Date(r.fecha);
      ts = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime(); // medianoche local
    }
    return { ts, cantidad: Number(r.cantidad) || 0 };
  });

/** Fallback desde /mis-reportes: agrupa por día (FechaHora) en medianoche LOCAL */
const rollupLineFromReportes = (reportes = []) => {
  const byDay = new Map();
  for (const r of reportes) {
    const d = new Date(r.FechaHora);
    if (Number.isNaN(d)) continue;
    const ts = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime(); // medianoche local
    byDay.set(ts, (byDay.get(ts) || 0) + 1);
  }
  return [...byDay.entries()]
    .map(([ts, cantidad]) => ({ ts, cantidad }))
    .sort((a, b) => a.ts - b.ts);
};

//  NUEVA FUNCIÓN: Agrupa por Ubicación y cuenta los niveles
const rollupTopZonasFromReportes = (reportes = []) => {
    const byLocation = new Map();

    for (const r of reportes) {
        // Usar la ubicación, asegurando que sea un string válido y quitando espacios extra
        const ubicacion = String(r.Ubicacion || "").trim();
        if (!ubicacion) continue;

        const lvl = resolveLevel(r);

        if (!byLocation.has(ubicacion)) {
            byLocation.set(ubicacion, {
                ubicacion: ubicacion,
                total: 0,
                alto: 0,
                medio: 0,
            });
        }

        const data = byLocation.get(ubicacion);
        data.total += 1;
        if (lvl === 3) {
            data.alto += 1;
        } else if (lvl === 2) {
            data.medio += 1;
        }
    }

    // Convertir el mapa a array y ordenar: 1. Total (desc) 2. Alto (desc)
    return Array.from(byLocation.values())
        .sort((a, b) => {
            if (b.total !== a.total) {
                return b.total - a.total;
            }
            return b.alto - a.alto;
        });
};


export default function Resumen() {
  const [pieData, setPieData] = useState(null);
  const [lineData, setLineData] = useState(null);
  const [topZonas, setTopZonas] = useState(null); 
  const [error, setError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("access");
    if (!token) { setError("No hay token. Inicia sesión."); return; }

    const headers = { Authorization: `Bearer ${token}` };

    // Función para manejar el fallback a /mis-reportes
    const handleFallback = async () => {
      try {
        const mrRes = await fetch(`${API}/mis-reportes/`, { headers });
        if (!mrRes.ok) throw new Error("mis-reportes no disponible");
        const mr = await mrRes.json();
        setPieData(rollupFromReportes(mr));
        setLineData(rollupLineFromReportes(mr));
        setTopZonas(rollupTopZonasFromReportes(mr)); 
      } catch (errFallback) {
        console.error("Fallo la carga de datos:", errFallback);
        setError("No se pudo cargar el resumen");
      }
    };

    // 1. Cargar datos principales (Pie y Línea)
    fetch(`${API}/resumen/`, { headers })
      .then(r => { if (!r.ok) throw new Error("No se pudo cargar el resumen"); return r.json(); })
      .then(async (res) => {
        // ---- PIE desde /resumen
        const raw = (res?.niveles_incidencia ?? []);
        const mapped = raw.map(n => {
          const desc =
            n.idEscalaIncidencia__Descripcion ??
            n.Descripcion ??
            n.name ??
            n.Escala ??
            "";
          const lvl = strToLevel(desc);
          if (lvl) {
            return { name: LEVELS[lvl].name, value: n.total, color: LEVELS[lvl].color };
          }
          return { name: UNCLASS.name, value: n.total, color: UNCLASS.color };
        });
        const onlyUnclass = mapped.length && mapped.every(d => d.name === UNCLASS.name);

        // ---- LÍNEA desde /resumen (pasado a medianoche LOCAL)
        const evo = toLineData(res?.evolucion_reportes ?? []);

        // Aplicar datos o Fallback
        if (!mapped.length || onlyUnclass || !evo.length) {
          await handleFallback();
        } else {
          setPieData(mapped);
          setLineData(evo);
          
     
          const mrRes = await fetch(`${API}/mis-reportes/`, { headers });
          const mr = mrRes.ok ? await mrRes.json() : [];
          setTopZonas(rollupTopZonasFromReportes(mr));
        }
      })
      .catch(async (errResumen) => {
        console.warn("Fallo /resumen, intentando fallback:", errResumen);
        await handleFallback(); // Llama a fallback si el endpoint principal falla
      });

  
  }, []);


  if (error) return <p style={{ color: "red" }}>⚠️ {error}</p>;
  if (!pieData || !lineData || !topZonas) return <p>Cargando resumen...</p>;

  
  const legendPayload = pieData.map((d, i) => ({
    id: i,
    type: "square",
    value: d.name,
    color: d.color,
  }));

  return (
    <section className="resumen-section">
      <div className="resumen-cards">
        {/* --------- PIE --------- */}
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
                label={({ payload, percent }) =>
                  `${payload.name} : ${payload.value}${
                    percent ? ` (${(percent * 100).toFixed(0)}%)` : ""
                  }`
                }
              >
                {pieData.map((e, i) => <Cell key={i} fill={e.color} />)}
              </Pie>
              <Tooltip formatter={(val, _n, { payload }) => [val, payload?.name]} />
              <Legend payload={legendPayload} verticalAlign="bottom" />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* --------- LÍNEA --------- */}
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
    
    {/* --------- zonas --------- */}
    <div className="resumen-card full-width">
        <h3>📍 Top Zonas con Mayor Incidencia</h3>
        {Array.isArray(topZonas) && topZonas.length > 0 ? (
            <div className="table-wrapper">
                <table>
                    <thead>
                        <tr>
                            <th>Puesto</th>
                            <th>Zona / Ubicación</th>
                            <th style={{color: LEVELS[3].color}}>Alto</th>
                            <th style={{color: LEVELS[2].color}}>Medio</th>
                            <th>Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        {/* Mostrar solo el Top 5 */}
                        {topZonas.slice(0, 3).map((zona, index) => (
                            <tr key={index}>
                                <td>{index + 1}</td>
                                <td>{zona.ubicacion || 'Sin Especificar'}</td>
                                <td style={{color: LEVELS[3].color, fontWeight: zona.alto > 0 ? 'bold' : 'normal'}}>{zona.alto || 0}</td>
                                <td style={{color: LEVELS[2].color, fontWeight: zona.medio > 0 ? 'bold' : 'normal'}}>{zona.medio || 0}</td>
                                <td><b>{zona.total || 0}</b></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        ) : (
            <p style={{ color: "#999", margin: "12px 0 0 8px" }}>
                No hay suficientes datos de reportes para clasificar las zonas.
            </p>
        )}
    </div>
    </section>
  );
}