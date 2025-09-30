// frontend/src/pages/Vista_usuario/Reportes.jsx
import { useState, useEffect } from "react";
import axios from "axios";
import * as XLSX from "xlsx";
import logo from "../../img/inicio/policia.png";
import "../../css/Vista_usuario/reportes.css";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

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

//  Excel
// Reemplaza tu exportarExcel por este:
const exportarExcel = async () => {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Reportes");

  // --- Encabezado: Logo mediano + Título ---
  try {
    const imgData = await toDataURL(logo); // tu helper existente
    const imgId = wb.addImage({ base64: imgData, extension: "png" });
    ws.addImage(imgId, {
      tl: { col: 0, row: 0 },        // esquina superior izquierda (A1)
      ext: { width: 50, height: 50 } // tamaño mediano aprox.
    });
  } catch (e) {
    console.warn("No se pudo cargar el logo para Excel:", e);
  }

  ws.mergeCells("B1:F2");
  const title = ws.getCell("B1");
  title.value = "Mis Reportes";
  title.font = { name: "Calibri", size: 22, bold: true };
  title.alignment = { vertical: "middle", horizontal: "left" };

  // Fila separadora
  ws.getRow(3).height = 8;

  // --- Datos para la tabla ---
  const rows = (reportes || []).map((r) => [
    r.idTipoIncidencia,
    new Date(r.FechaHora).toLocaleString("es-PE"),
    r.Ubicacion || "",
    r.NombreIncidente || "",
    r.Descripcion || "",
    r.Escala || "", // Debe venir "Bajo" | "Medio" | "Alto"
  ]);

  // Anchos de columnas
  ws.columns = [
    { key: "ID", width: 8 },
    { key: "Fecha", width: 22 },
    { key: "Ubicacion", width: 28 },
    { key: "Incidente", width: 26 },
    { key: "Descripcion", width: 48 },
    { key: "Escala", width: 12 },
  ];

  // --- Tabla con estilo ---
  const startRow = 4; // tabla desde A4
  ws.addTable({
    name: "TablaReportes",
    ref: `A${startRow}`,
    headerRow: true,
    style: {
      theme: "TableStyleMedium9",
      showRowStripes: true,
    },
    columns: [
      { name: "ID" },
      { name: "Fecha" },
      { name: "Ubicación" },
      { name: "Incidente" },
      { name: "Descripción" },
      { name: "Escala" },
    ],
    rows: rows,
  });

  // Alineaciones / wrap
  ws.getColumn(1).alignment = { vertical: "middle", horizontal: "center" }; // ID
  ws.getColumn(5).alignment = { wrapText: true, vertical: "top" };          // Descripción
  for (let r = startRow; r <= startRow + rows.length; r++) {
    ws.getRow(r).height = 20;
  }

  // --- Colorear columna "Escala" (F) ---
  const colorMap = {
    bajo:  "FF4CAF50", // verde
    medio: "FFFF9800", // naranja
    alto:  "FFF44336", // rojo
  };

  // Header está en F{startRow}; datos empiezan en la siguiente fila
  for (let i = 0; i < rows.length; i++) {
    const excelRow = startRow + 1 + i;         // +1 por cabecera
    const cell = ws.getCell(`F${excelRow}`);   // Columna Escala
    const val = String(cell.value ?? "").toLowerCase().trim();
    const fg = colorMap[val];
    if (fg) {
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: fg } };
      cell.font = { color: { argb: "FFFFFFFF" }, bold: true };
      cell.alignment = { vertical: "middle", horizontal: "center" };
    }
  }

  // --- Descargar ---
  const buf = await wb.xlsx.writeBuffer();
  const blob = new Blob([buf], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  saveAs(blob, "mis_reportes.xlsx");
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
