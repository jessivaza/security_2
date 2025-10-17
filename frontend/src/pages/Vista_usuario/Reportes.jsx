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

const ESCALAS = [
  { id: 1, nombre: "Bajo" },
  { id: 2, nombre: "Medio" },
  { id: 3, nombre: "Alto" },
];

export default function MisReportes({ darkMode, onReportesActualizados }) {
  const [reportes, setReportes] = useState([]);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [archivoPreview, setArchivoPreview] = useState(null);
  const [nuevoReporte, setNuevoReporte] = useState({
    Ubicacion: "",
    Descripcion: "",
    NombreIncidente: "",
    escala: "",
    Latitud: "",
    Longitud: "",
    Archivo: null,
  });

  const token = localStorage.getItem("access");

  const axiosAuth = axios.create({
    baseURL: API,
    headers: { Authorization: `Bearer ${token}` },
  });

  // ---------- Cargar reportes ----------
  const cargarReportes = () => {
    if (!token) return;
    axiosAuth
      .get("/mis-reportes")
      .then((res) => {
        setReportes(res.data);
        if (onReportesActualizados) onReportesActualizados(res.data);
      })
      .catch((err) => console.error("Error cargando reportes:", err));
  };

  useEffect(() => {
    cargarReportes();
  }, []);

  // ---------- Abrir modal ----------
  const abrirModal = async () => {
    setMostrarModal(true);
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(async (pos) => {
        const { latitude, longitude } = pos.coords;
        const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`;
        try {
          const res = await fetch(url);
          const data = await res.json();
          const direccion = data.display_name || `${latitude}, ${longitude}`;
          setNuevoReporte((prev) => ({
            ...prev,
            Ubicacion: direccion,
            Latitud: latitude,
            Longitud: longitude,
          }));
        } catch {
          setNuevoReporte((prev) => ({
            ...prev,
            Ubicacion: `${latitude}, ${longitude}`,
            Latitud: latitude,
            Longitud: longitude,
          }));
        }
      });
    }
  };

  const cerrarModal = () => {
    setMostrarModal(false);
    setNuevoReporte({
      Ubicacion: "",
      Descripcion: "",
      NombreIncidente: "",
      escala: "",
      Latitud: "",
      Longitud: "",
      Archivo: null,
    });
  };

  // ---------- Vista previa de archivo ----------
  const abrirPreview = (archivoUrl) => {
    setArchivoPreview(archivoUrl);
  };

  const cerrarPreview = () => {
    setArchivoPreview(null);
  };

  // ---------- Registrar incidente ----------
  const registrarIncidente = async () => {
    if (!token) return alert("Debes iniciar sesión");

    try {
      const formData = new FormData();
      formData.append("Ubicacion", nuevoReporte.Ubicacion);
      formData.append("Descripcion", nuevoReporte.Descripcion);
      formData.append("NombreIncidente", nuevoReporte.NombreIncidente);
      formData.append("escala", nuevoReporte.escala);
      formData.append("Latitud", nuevoReporte.Latitud);
      formData.append("Longitud", nuevoReporte.Longitud);
      if (nuevoReporte.Archivo) formData.append("Archivo", nuevoReporte.Archivo);

      const res = await axios.post(`${API}/registrar-incidente`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      const det = res.data.registro;
      const escalaNombre =
        ESCALAS.find((e) => e.id === det.Escala)?.nombre ||
        det.Escala ||
        "—";

      const reporteRegistrado = {
        ...det,
        Escala: escalaNombre,
      };

      setReportes((prev) => [...prev, reporteRegistrado]);
      if (onReportesActualizados) {
        onReportesActualizados([...reportes, reporteRegistrado]);
      }

      cerrarModal();
    } catch (err) {
      console.error("Error al registrar incidente:", err);
      alert("Error al registrar el incidente");
    }
  };

  // ---------- Exportar PDF ----------
  const toDataURL = async (url) => {
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.readAsDataURL(blob);
    });
  };

  const exportarPDF = async () => {
    const doc = new jsPDF();
    try {
      const imgData = await toDataURL(logo);
      doc.addImage(imgData, "PNG", 14, 10, 20, 20);
    } catch (e) {
      console.warn("No se pudo cargar el logo:", e);
    }

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
      r.Archivo ? "Sí" : "No",
    ]);

    autoTable(doc, {
      head: [["ID", "Fecha", "Ubicación", "Incidente", "Descripción", "Escala", "Archivo"]],
      body,
      startY: 50,
    });

    doc.save("mis_reportes.pdf");
  };

  // ---------- Exportar Excel ----------
  const exportarExcel = async () => {
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet("Reportes");

    ws.mergeCells("B1:F2");
    const title = ws.getCell("B1");
    title.value = "Mis Reportes";
    title.font = { name: "Calibri", size: 22, bold: true };
    title.alignment = { vertical: "middle", horizontal: "left" };

    const rows = (reportes || []).map((r) => [
      r.idTipoIncidencia,
      new Date(r.FechaHora).toLocaleString("es-PE"),
      r.Ubicacion || "",
      r.NombreIncidente || "",
      r.Descripcion || "",
      r.Escala || "",
      r.Archivo ? "Sí" : "No",
    ]);

    ws.addTable({
      name: "TablaReportes",
      ref: "A4",
      headerRow: true,
      columns: [
        { name: "ID" },
        { name: "Fecha" },
        { name: "Ubicación" },
        { name: "Incidente" },
        { name: "Descripción" },
        { name: "Escala" },
        { name: "Archivo" },
      ],
      rows: rows,
    });

    const buf = await wb.xlsx.writeBuffer();
    const blob = new Blob([buf], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    saveAs(blob, "mis_reportes.xlsx");
  };

  // ---------- Render ----------
  return (
    <div className={`mis-reportes ${darkMode ? "dark" : "light"}`}>
      <h2>Mis Reportes</h2>

      <div style={{ marginBottom: "10px" }}>
        <button onClick={abrirModal} className="btn-export">➕ Nuevo</button>
        <button onClick={exportarPDF} className="btn-export">📄 PDF</button>
        <button onClick={exportarExcel} className="btn-export">📊 Excel</button>
      </div>

      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Fecha</th>
              <th>Ubicación</th>
              <th>Incidente</th>
              <th>Descripción</th>
              <th>Escala</th>
              <th>Archivo</th>
            </tr>
          </thead>
          <tbody>
            {reportes.map((r, index) => (
              <tr key={index}>
                <td>{r.idTipoIncidencia || "-"}</td>
                <td>
                  {r.FechaHora
                    ? new Date(r.FechaHora).toLocaleString("es-ES", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                      hour12: true,
                    })
                    : "-"}
                </td>
                <td>{r.Ubicacion}</td>
                <td>{r.NombreIncidente}</td>
                <td>{r.Descripcion}</td>
                <td>{r.Escala || "—"}</td>
                <td style={{ textAlign: "center" }}>
                  {r.Archivo ? (
                    <button
                      onClick={() => abrirPreview(r.Archivo)}
                      style={{
                        background: "none",
                        border: "none",
                        color: "#007BFF",
                        fontSize: "18px",
                        cursor: "pointer",
                      }}
                    >
                      📎
                    </button>
                  ) : (
                    ""
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal Registrar */}
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

            <input
              type="file"
              accept="image/*,video/*,application/pdf"
              onChange={(e) =>
                setNuevoReporte({ ...nuevoReporte, Archivo: e.target.files[0] })
              }
            />

            {nuevoReporte.Archivo && (
              <div style={{ textAlign: "center", marginTop: "10px" }}>
                <span style={{ color: "#007BFF", fontSize: "22px" }}>
                  📎 Archivo listo para subir
                </span>
              </div>
            )}

            <select
              value={nuevoReporte.escala}
              onChange={(e) =>
                setNuevoReporte({ ...nuevoReporte, escala: e.target.value })
              }
            >
              <option value="">Selecciona la escala</option>
              {ESCALAS.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.nombre}
                </option>
              ))}
            </select>

            <div style={{ textAlign: "center", marginTop: "15px" }}>
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

      {/* Modal Vista previa (versión mejorada) */}
      {archivoPreview && (
        <div className="modal-backdrop" onClick={cerrarPreview}>
          <div
            className="modal"
            style={{
              position: "relative",
              maxWidth: "600px",
              maxHeight: "500px",
              overflow: "auto",
              backgroundColor: "#fff",
              padding: "15px",
              borderRadius: "10px",
              boxShadow: "0 4px 15px rgba(0,0,0,0.3)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Botón X de cierre */}
            <button
              onClick={cerrarPreview}
              style={{
                position: "absolute",
                top: "8px",
                right: "10px",
                background: "none",
                border: "none",
                fontSize: "22px",
                fontWeight: "bold",
                color: "#555",
                cursor: "pointer",
              }}
            >
              ✖
            </button>

            <h3 style={{ textAlign: "center", marginBottom: "10px" }}>
              Vista previa del archivo
            </h3>

            {archivoPreview.endsWith(".pdf") ? (
              <iframe
                src={archivoPreview}
                width="100%"
                height="400px"
                title="Vista PDF"
                style={{ border: "1px solid #ccc", borderRadius: "6px" }}
              ></iframe>
            ) : archivoPreview.match(/\.(jpg|jpeg|png|gif)$/i) ? (
              <img
                src={archivoPreview}
                alt="Vista previa"
                style={{
                  width: "100%",
                  maxHeight: "400px",
                  objectFit: "contain",
                  borderRadius: "8px",
                }}
              />
            ) : archivoPreview.match(/\.(mp4|webm|ogg)$/i) ? (
              <video
                src={archivoPreview}
                controls
                style={{
                  width: "100%",
                  maxHeight: "400px",
                  borderRadius: "8px",
                }}
              />
            ) : (
              <p style={{ textAlign: "center" }}>
                No se puede mostrar vista previa de este tipo de archivo.
              </p>
            )}
            </div>
  
          </div>
        )}
      </div>
    );
  }