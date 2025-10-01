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
  const [nuevoReporte, setNuevoReporte] = useState({
    Ubicacion: "",
    Descripcion: "",
    NombreIncidente: "",
    escala: "",
    Latitud: "",
    Longitud: "",
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
      .then((res) => {
        setReportes(res.data);
        if (onReportesActualizados) {
          onReportesActualizados(res.data);
        }
      })
      .catch((err) => console.error("Error cargando reportes:", err));
  };

  useEffect(() => {
    cargarReportes();
  }, []);

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
        } catch (error) {
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
    });
  };

  const registrarIncidente = async () => {
  try {
    const res = await axiosAuth.post("/registrar-incidente", {
      Ubicacion: nuevoReporte.Ubicacion,
      Descripcion: nuevoReporte.Descripcion,
      NombreIncidente: nuevoReporte.NombreIncidente,
      escala: Number(nuevoReporte.escala),
      Latitud: nuevoReporte.Latitud,
      Longitud: nuevoReporte.Longitud,
    });

    // Tomamos directamente la info del backend
    const det = res.data.registro;

    // Convertimos la escala a nombre legible
    const escalaNombre = ESCALAS.find((e) => e.id === det.Escala)?.nombre || "—";

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
    const msg = err?.response?.data?.error || "Error al registrar";
    alert(`No se pudo registrar:\n${JSON.stringify({ error: msg }, null, 2)}`);
    console.error("Error al registrar:", err);
  }
};


  const exportarPDF = async () => {
    const doc = new jsPDF();
    try {
      const res = await fetch(logo);
      const blob = await res.blob();
      const reader = new FileReader();
      reader.onload = () => doc.addImage(reader.result, "PNG", 14, 10, 20, 20);
      reader.readAsDataURL(blob);
    } catch (e) {
      console.warn("No se pudo cargar el logo:", e);
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text("Mis Reportes", 40, 22);

    const body = reportes.map((r) => [
      r.idTipoIncidencia || "-",
      r.FechaHora ? new Date(r.FechaHora).toLocaleString("es-ES") : "-",
      r.Ubicacion,
      r.NombreIncidente,
      r.Descripcion,
      r.Escala || "-",
    ]);

    autoTable(doc, {
      head: [["ID", "Fecha", "Ubicación", "Incidente", "Descripción", "Escala"]],
      body,
      startY: 50,
    });

    doc.save("mis_reportes.pdf");
  };

  const exportarExcel = async () => {
    // Aquí podrías mantener tu lógica original de Excel
  };

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
            </tr>
          ))}
        </tbody>
      </table>
      </div>
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
                <option key={opt.id} value={opt.id}>
                  {opt.nombre}
                </option>
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
