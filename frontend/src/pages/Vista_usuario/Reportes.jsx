// frontend/src/pages/Vista_usuario/Reportes.jsx
import { useState, useEffect } from "react";
import axios from "axios";
import * as XLSX from "xlsx";
import logo from "../../img/inicio/policia.png";
import "../../css/Vista_usuario/reportes.css";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const API = "http://127.0.0.1:8000/api";

// Opciones locales (sin BD)
const ESCALAS = [
  { id: 1, nombre: "Bajo" },
  { id: 2, nombre: "Medio" },
  { id: 3, nombre: "Alto" },
];

export default function Reportes({ darkMode }) {
  const [reportes, setReportes] = useState([]);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [nuevoReporte, setNuevoReporte] = useState({
    Ubicacion: "",
    Descripcion: "",
    NombreIncidente: "",
    escala: "", // 1,2,3
  });

  const token = localStorage.getItem("access");

  const axiosAuth = axios.create({
    baseURL: API,
    headers: { Authorization: `Bearer ${token}` },
  });

  const cargarReportes = () => {
    if (!token) return;
    axiosAuth
      .get("/mis-reportes")
      .then((res) => setReportes(res.data))
      .catch((err) => console.error("Error cargando reportes:", err));
  };

  useEffect(() => {
    cargarReportes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const abrirModal = () => setMostrarModal(true);
  const cerrarModal = () => {
    setMostrarModal(false);
    setNuevoReporte({
      Ubicacion: "",
      Descripcion: "",
      NombreIncidente: "",
      escala: "",
    });
  };

  const registrarIncidente = async () => {
    try {
      await axiosAuth.post("/registrar-incidente", {
        Ubicacion: nuevoReporte.Ubicacion,
        Descripcion: nuevoReporte.Descripcion,
        NombreIncidente: nuevoReporte.NombreIncidente,
        escala: Number(nuevoReporte.escala),
      });
      cerrarModal();
      cargarReportes();
    } catch (err) {
      const msg = err?.response?.data?.error || "Error al registrar";
      alert(`No se pudo registrar:\n${JSON.stringify({ error: msg }, null, 2)}`);
      console.error("Error al registrar:", err);
    }
  };

  // PDF
// Helper robusto: URL/asset -> DataURL (base64)
async function toDataURL(url) {
  const res = await fetch(url);            // funciona con assets importados en Vite
  const blob = await res.blob();
  return await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
  const exportarPDF = async () => {
  const doc = new jsPDF();

  try {
    const imgData = await toDataURL(logo);     // <- convierte el asset en base64
    doc.addImage(imgData, "PNG", 14, 10, 20, 20);
  } catch (e) {
    console.warn("No se pudo cargar el logo:", e);
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("Mis Reportes", 40, 22);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text("Mis Reportes", 40, 22);

    const body = reportes.map((r) => [
      r.idTipoIncidencia,
      new Date(r.FechaHora).toLocaleString("es-ES"),
      r.Ubicacion,
      r.NombreIncidente,
      r.Descripcion,
      r.Escala || "",
    ]);

    autoTable(doc, {
      head: [["ID", "Fecha", "Ubicación", "Incidente", "Descripción", "Escala"]],
      body,
      startY: 50,
    });

    doc.save("mis_reportes.pdf");
  };

  // Excel
  const exportarExcel = () => {
    const datos = reportes.map((r) => ({
      ID: r.idTipoIncidencia,
      Fecha: new Date(r.FechaHora).toLocaleString("es-ES"),
      Ubicacion: r.Ubicacion,
      Incidente: r.NombreIncidente,
      Descripcion: r.Descripcion,
      Escala: r.Escala || "",
    }));
    const hoja = XLSX.utils.json_to_sheet(datos);
    const libro = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(libro, hoja, "Reportes");
    XLSX.writeFile(libro, "mis_reportes.xlsx");
  };

  return (
    <div className={`mis-reportes ${darkMode ? "dark" : "light"}`}>
      <h2>Mis Reportes</h2>

      <div style={{ marginBottom: "10px" }}>
        <button onClick={abrirModal} className="btn-export">➕ Nuevo</button>
        <button onClick={exportarPDF} className="btn-export">📄 PDF</button>
        <button onClick={exportarExcel} className="btn-export">📊 Excel</button>
      </div>

      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Fecha</th>
            <th>Ubicación</th>
            <th>Incidente</th>
            <th>Descripción</th>
            <th>Escala</th>
          </tr>
        </thead>
        <tbody>
          {reportes.map((r, index) => (
            <tr key={index}>
              <td>{r.idTipoIncidencia}</td>
              <td>
                {new Date(r.FechaHora).toLocaleString("es-ES", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: true,
                })}
              </td>
              <td>{r.Ubicacion}</td>
              <td>{r.NombreIncidente}</td>
              <td>{r.Descripcion}</td>
              <td>{r.Escala || "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {mostrarModal && (
        <div className="modal-backdrop">
          <div className="modal">
            <h3>Registrar Incidente</h3>

            <input
              type="text"
              placeholder="Ubicación"
              value={nuevoReporte.Ubicacion}
              onChange={(e) =>
                setNuevoReporte({ ...nuevoReporte, Ubicacion: e.target.value })
              }
            />

            <input
              type="text"
              placeholder="Descripción"
              value={nuevoReporte.Descripcion}
              onChange={(e) =>
                setNuevoReporte({ ...nuevoReporte, Descripcion: e.target.value })
              }
            />

            <input
              type="text"
              placeholder="Nombre del Incidente"
              value={nuevoReporte.NombreIncidente}
              onChange={(e) =>
                setNuevoReporte({
                  ...nuevoReporte,
                  NombreIncidente: e.target.value,
                })
              }
            />

            <select
              value={nuevoReporte.escala}
              onChange={(e) =>
                setNuevoReporte({ ...nuevoReporte, escala: e.target.value })
              }
            >
              <option value="">Selecciona la escala</option>
              {ESCALAS.map((opt) => (
                <option key={opt.id} value={opt.id}>{opt.nombre}</option>
              ))}
            </select>

            <div className="modal-buttons">
              <button onClick={registrarIncidente} className="btn-guardar">
                Guardar
              </button>
              <button onClick={cerrarModal} className="btn-cancelar">
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
