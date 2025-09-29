import { useState, useEffect } from "react";
import axios from "axios";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import logo from "../../img/inicio/policia.png";
import "../../css/Vista_usuario/reportes.css";

export default function MisReportes({ darkMode }) {
  const [reportes, setReportes] = useState([]);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [nuevoReporte, setNuevoReporte] = useState({
    Ubicacion: "",
    Descripcion: "",
    NombreIncidente: "",
    idEscalaIncidencia: "",
  });

  const token = localStorage.getItem("access");

  // ✅ Cargar reportes del backend
  useEffect(() => {
    if (!token) return;
    axios
      .get("http://127.0.0.1:8000/api/mis-reportes/", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setReportes(res.data))
      .catch((err) => console.error("Error cargando reportes:", err));
  }, []);

  // ✅ Abrir y cerrar modal
  const abrirModal = () => setMostrarModal(true);
  const cerrarModal = () => {
    setMostrarModal(false);
    setNuevoReporte({
      Ubicacion: "",
      Descripcion: "",
      NombreIncidente: "",
      idEscalaIncidencia: "",
    });
  };

  // ✅ Registrar nuevo incidente (POST correcto)
  const registrarIncidente = () => {
    axios
      .post(
        "http://127.0.0.1:8000/registrar-incidente/",
        nuevoReporte,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      )
      .then(() => {
        cerrarModal();
        window.location.reload();
      })
      .catch((err) => console.error("Error al registrar:", err));
  };

  // ✅ Exportar a PDF
  const exportarPDF = () => {
    const doc = new jsPDF();
    doc.addImage(logo, "PNG", 14, 10, 20, 20);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text("Mis Reportes", 40, 22);

    const datos = reportes.map((r) => [r.id, r.fecha, r.tipo, r.detalle]);
    autoTable(doc, {
      head: [["ID", "Fecha", "Tipo", "Detalle"]],
      body: datos,
      startY: 50,
    });
    doc.save("mis_reportes.pdf");
  };

  // ✅ Exportar a Excel
  const exportarExcel = () => {
    const datos = reportes.map((r) => ({
      ID: r.id,
      Fecha: r.fecha,
      Tipo: r.tipo,
      Detalle: r.detalle,
    }));
    const hoja = XLSX.utils.json_to_sheet(datos);
    const libro = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(libro, hoja, "Reportes");
    XLSX.writeFile(libro, "mis_reportes.xlsx");
  };

  return (
    <div className={`mis-reportes ${darkMode ? "dark" : "light"}`}>
      <h2>Mis Reportes</h2>

      {/* ✅ Botón Nuevo + Exportaciones */}
      <div style={{ marginBottom: "10px" }}>
        <button onClick={abrirModal} className="btn-export">➕ Nuevo</button>
        <button onClick={exportarPDF} className="btn-export">📄 PDF</button>
        <button onClick={exportarExcel} className="btn-export">📊 Excel</button>
      </div>

      {/* ✅ Tabla */}
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Fecha</th>
            <th>Ubicacion</th>
            <th>Tipo</th>
            <th>Descripcion</th>
            <th>Estado</th>

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
              <td>{index % 2 === 0 ? "En proceso" : "Completado"}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* ✅ Modal de Registro */}
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
              type="number"
              placeholder="ID Escala Incidencia"
              value={nuevoReporte.idEscalaIncidencia}
              onChange={(e) =>
                setNuevoReporte({
                  ...nuevoReporte,
                  idEscalaIncidencia: e.target.value,
                })
              }
            />

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
