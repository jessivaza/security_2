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
  { id: "1", nombre: "Bajo" },
  { id: "2", nombre: "Medio" },
  { id: "3", nombre: "Alto" },
  { id: "4", nombre: "Pendiente (por asignar)" },
];

const INCIDENTES_COMUNES = [
  { nombre: "Robo", escala: "3" },
  { nombre: "Asalto", escala: "3" },
  { nombre: "Homicidio", escala: "3" },
  { nombre: "Secuestro", escala: "3" },
  { nombre: "Accidente de tránsito", escala: "2" },
  { nombre: "Incendio", escala: "2" },
  { nombre: "Pelea callejera", escala: "2" },
  { nombre: "Amenaza", escala: "2" },
  { nombre: "Daño a propiedad", escala: "1" },
  { nombre: "Vandalismo", escala: "1" },
  { nombre: "Pérdida de mascota", escala: "1" },
  { nombre: "Otro", escala: "4" },
];

const ESCALA_MAP = {
  "1": 1, // Bajo
  "2": 2, // Medio
  "3": 3, // Alto
  "4": 4, // Pendiente (por asignar)
};

export default function MisReportes({ darkMode, onReportesActualizados }) {
  const [reportes, setReportes] = useState([]);
  const [mostrarModal, setMostrarModal] = useState(false);
  // 🔄 archivoPreview ahora almacena el OBJETO { url, type } o null
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

  // ---------- Determinar escala automática ----------
  const determinarEscala = (texto) => {
    if (!texto) return "";
    const t = texto.toLowerCase();

    // Cuadro de palabras clave -> nivel de escala
    const reglas = [
      { palabras: ["robo", "asalto", "hurto", "intento de asesinato", "homicidio", "secuestro"], escala: "3" }, // Alto
      { palabras: ["accidente", "choque", "incendio", "explosión", "pelea", "amenaza"], escala: "2" }, // Medio
      { palabras: ["daño", "vandalismo", "desperfecto", "perdida de mascota", "pérdida menor"], escala: "1" }, // Bajo
    ];

    // Buscar coincidencia dentro del texto
    for (const regla of reglas) {
      if (regla.palabras.some((p) => t.includes(p))) {
        return regla.escala;
      }
    }

    return "";
  };

  // ---------- Función para obtener ubicación por IP (Respaldo) ----------
  const obtenerUbicacionPorIP = async () => {
    try {
      const ipRes = await axios.get("https://ipapi.co/json/");
      const ipData = ipRes.data;
      
      const ubicacionIP = `${ipData.city || 'Ciudad'}, ${ipData.region || 'Región'}, ${ipData.country_name || 'País'} (Aprox. por IP)`;

      setNuevoReporte((prev) => ({
        ...prev,
        Ubicacion: ubicacionIP,
        Latitud: ipData.latitude || "",
        Longitud: ipData.longitude || "",
      }));
      alert(`Ubicación aproximada obtenida por IP: ${ubicacionIP}.`);
    } catch (e) {
      console.error("Error obteniendo ubicación por IP:", e);
      alert("No se pudo obtener la ubicación automáticamente.");
    }
  };

  const obtenerUbicacionPorGPS = () => {
    return new Promise((resolve, reject) => {
      if (!("geolocation" in navigator)) {
        reject("Tu navegador no soporta la geolocalización.");
        return;
      }

      // Opciones para solicitar la máxima precisión (usando GPS)
      const options = {
        enableHighAccuracy: true, // Pide la máxima precisión
        timeout: 10000,           // 10 segundos antes de fallar
        maximumAge: 0             // No usar cache
      };

      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const { latitude, longitude } = pos.coords;
          const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`;
          try {
            const res = await fetch(url);
            const data = await res.json();
            const direccion = data.display_name || `Lat: ${latitude}, Lon: ${longitude}`;
            
            // Establecer el estado con la dirección precisa
            setNuevoReporte((prev) => ({
              ...prev,
              Ubicacion: direccion,
              Latitud: latitude,
              Longitud: longitude,
            }));
            resolve(true);
          } catch {
            setNuevoReporte((prev) => ({
              ...prev,
              Ubicacion: `Lat: ${latitude}, Lon: ${longitude}`,
              Latitud: latitude,
              Longitud: longitude,
            }));
            resolve(true);
          }
        },
        (error) => {
          // Manejo de error de geolocalización
          let mensaje = "";
          switch (error.code) {
            case 1:
              mensaje = "Permiso de ubicación denegado por el usuario.";
              break;
            case 2:
              mensaje = "Ubicación no disponible.";
              break;
            case 3:
              mensaje = "Tiempo de espera agotado.";
              break;
            default:
              mensaje = "Error desconocido de geolocalización.";
          }
          console.error("Error GPS:", mensaje);
          reject(mensaje); 
        },
        options
      );
    });
  };

  const abrirModal = async () => {
    setMostrarModal(true);
    
    try {
        await obtenerUbicacionPorGPS();
    } catch (errorMensaje) {
        if (errorMensaje.includes("Permiso de ubicación denegado") || errorMensaje.includes("Ubicación no disponible") || errorMensaje.includes("Tiempo de espera agotado")) {
            // Recurrir a la ubicación por IP si el GPS falla
            await obtenerUbicacionPorIP();
        } else {
            alert(`Error crítico de ubicación: ${errorMensaje}`);
        }
    }
  };

  const cerrarModal = () => {
    setMostrarModal(false);
    //  Limpiar la URL temporal de previsualización para liberar memoria
    if (tempPreviewUrl) {
      URL.revokeObjectURL(tempPreviewUrl);
    }
    setTempPreviewUrl(null);
    setNuevoReporte({
      Ubicacion: "",
      Descripcion: "",
      NombreIncidente: "",
      escala: "",
      Latitud: "",
      Longitud: "",
      Archivo: null,
      esOtro: false,
      NombreIncidenteOtro: "",
    });
  };

  // ---------- Vista previa ----------
  const abrirPreview = (archivoUrl) => setArchivoPreview(archivoUrl);
  const cerrarPreview = () => setArchivoPreview(null);

  // ---------- Registrar incidente (Sin cambios) ----------
  const registrarIncidente = async () => {
    if (!token) return alert("Debes iniciar sesión");
    try {
      const formData = new FormData();
      formData.append("Ubicacion", nuevoReporte.Ubicacion);
      
      // Si la descripción está vacía, enviar "No determinado"
      const descripcionFinal = nuevoReporte.Descripcion.trim() || "No determinado";
      formData.append("Descripcion", descripcionFinal);
      
      const nombreFinal = nuevoReporte.esOtro
        ? (nuevoReporte.NombreIncidenteOtro || "").trim()
        : nuevoReporte.NombreIncidente;

      if (!nombreFinal) return alert("Debes especificar el nombre del incidente.");
      formData.append("NombreIncidente", nombreFinal);
      
      // Asegurar que la escala sea un número válido
      const escalaFinal = Number(nuevoReporte.escala) || 4;
      formData.append("escala", escalaFinal);
      
      formData.append("Latitud", nuevoReporte.Latitud);
      formData.append("Longitud", nuevoReporte.Longitud);
      if (nuevoReporte.Archivo) formData.append("Archivo", nuevoReporte.Archivo);

      // Log para debugging
      console.log("📤 Enviando escala:", escalaFinal);
      for (let [key, value] of formData.entries()) {
        console.log(key, value);
      }
      const res = await axios.post(`${API}/registrar-incidente`, formData, {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" },
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
      alert("¡Incidente registrado con éxito!");
    } catch (err) {
      console.error("Error al registrar incidente:", err);
      alert("Error al registrar el incidente. Revisa la consola.");
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
      const response = await fetch(logo);
      const blob = await response.blob();
      const reader = new FileReader();
      await new Promise((resolve) => {
        reader.onloadend = () => resolve();
        reader.readAsDataURL(blob);
      });
      doc.addImage(reader.result, "PNG", 14, 10, 20, 20);
    } catch (e) {
      console.warn("No se pudo cargar el logo:", e);
    }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text("Mis Reportes", 40, 22);

    const body = reportes.map((r) => [
      r.idTipoIncidencia,
      // Usar la hora local de Perú para el PDF
      new Date(r.FechaHora).toLocaleString("es-ES", { timeZone: 'America/Lima' }), 
      r.Ubicacion,
      r.NombreIncidente,
      r.Descripcion || "No determinado",
      r.Escala === 1 ? "Bajo" : r.Escala === 2 ? "Medio" : r.Escala === 3 ? "Alto" : r.Escala === 4 ? "Pendiente (por asignar)" : "No determinado",
      r.Archivo ? "Sí" : "No",
    ]);

    autoTable(doc, {
      head: [["ID", "Fecha", "Ubicación", "Incidente", "Descripción", "Escala", "Archivo"]],
      body,
      startY: 50,
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [41, 128, 185] },
    });
    doc.save("mis_reportes.pdf");
  };

  // ---------- Exportar Excel ----------
  const exportarExcel = async () => {
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet("Mis Reportes");
    ws.mergeCells("B1:F2");
    const title = ws.getCell("B1");
    title.value = "Mis Reportes";
    title.font = { name: "Calibri", size: 22, bold: true };
    title.alignment = { vertical: "middle", horizontal: "left" };
    const rows = (reportes || []).map((r) => [
      r.idTipoIncidencia,
      new Date(r.FechaHora).toLocaleString("es-PE", { timeZone: "America/Lima" }),
      r.Ubicacion || "",
      r.NombreIncidente || "",
      r.Descripcion || "No determinado",
      r.Escala === 1 ? "Bajo" : r.Escala === 2 ? "Medio" : r.Escala === 3 ? "Alto" : r.Escala === 4 ? "Pendiente (por asignar)" : "No determinado",
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
      rows,
    });
    const buf = await wb.xlsx.writeBuffer();
    saveAs(new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }), "mis_reportes.xlsx");
  };

  // ---------- FILTROS ----------
  const [filterDate, setFilterDate] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const filtrarReportesPorFecha = (reportes, fechaFiltro) => {
    if (!fechaFiltro) return reportes;
    const fechaSeleccionada = new Date(fechaFiltro);
    return reportes.filter((r) => {
      if (!r.FechaHora) return false;
      const fechaLocal = new Date(new Date(r.FechaHora).toLocaleString("en-US", { timeZone: "America/Lima" }));
      return (
        fechaLocal.getDate() === fechaSeleccionada.getUTCDate() &&
        fechaLocal.getMonth() === fechaSeleccionada.getUTCMonth() &&
        fechaLocal.getFullYear() === fechaSeleccionada.getUTCFullYear()
      );
    });
  };

  let filteredReportes = reportes;
  if (filterDate) filteredReportes = filtrarReportesPorFecha(reportes, filterDate);
  if (searchTerm) {
    const term = searchTerm.toLowerCase();
    filteredReportes = filteredReportes.filter(
      (r) =>
        r.idTipoIncidencia?.toString().toLowerCase().includes(term) ||
        r.Ubicacion?.toLowerCase().includes(term) ||
        r.NombreIncidente?.toLowerCase().includes(term) ||
        r.Descripcion?.toLowerCase().includes(term)
    );
  }

  // ---------- Ordenar ----------
  const ordenarPor = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") direction = "desc";
    setSortConfig({ key, direction });
    const sorted = [...filteredReportes].sort((a, b) => {
      if (a[key] < b[key]) return direction === "asc" ? -1 : 1;
      if (a[key] > b[key]) return direction === "asc" ? 1 : -1;
      return 0;
    });
    setReportes(sorted);
  };

  const getArrow = (key) => {
    if (sortConfig.key !== key) return "↕️";
    return sortConfig.direction === "asc" ? "🔼" : "🔽";
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

      {/* Filtros */}
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px", gap: "10px" }}>
        <input type="date" value={filterDate} onChange={(e) => setFilterDate(e.target.value)} />
        <input
          type="text"
          placeholder="Buscar..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ marginLeft: "auto" }}
        />
      </div>

      {/* Tabla */}
      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th onClick={() => ordenarPor("idTipoIncidencia")}>ID {getArrow("idTipoIncidencia")}</th>
              <th onClick={() => ordenarPor("FechaHora")}>Fecha {getArrow("FechaHora")}</th>
              <th onClick={() => ordenarPor("Ubicacion")}>Ubicación {getArrow("Ubicacion")}</th>
              <th onClick={() => ordenarPor("NombreIncidente")}>Incidente {getArrow("NombreIncidente")}</th>
              <th onClick={() => ordenarPor("Descripcion")}>Descripción {getArrow("Descripcion")}</th>
              <th onClick={() => ordenarPor("Escala")}>Escala {getArrow("Escala")}</th>
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
                        // <<--- CORRECCIÓN CLAVE: Especificar el huso horario de Lima
                        timeZone: 'America/Lima' 
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
            )}
          </tbody>
        </table>
      </div>

      {/* Modal registrar */}
      {mostrarModal && (
        <div className="modal-backdrop">
          <div className="modal">
            <h3>Registrar Incidente</h3>

            <input
              type="text"
              placeholder="Ubicación"
              value={nuevoReporte.Ubicacion}
              onChange={(e) => setNuevoReporte({ ...nuevoReporte, Ubicacion: e.target.value })}
            />

            <input
              type="text"
              placeholder="Descripción"
              value={nuevoReporte.Descripcion}
              onChange={(e) => {
                const valor = e.target.value;
                const escalaDetectada = determinarEscala(valor);
                setNuevoReporte({
                  ...nuevoReporte,
                  Descripcion: valor,
                  escala: escalaDetectada,
                });
              }}
            />

            <input
              type="text"
              placeholder="Nombre del Incidente"
              value={nuevoReporte.NombreIncidente}
              onChange={(e) => {
                const valor = e.target.value;
                const incidente = INCIDENTES_COMUNES.find((i) => i.nombre === valor);
                const escala = incidente ? Number(incidente.escala) : 4;
                setNuevoReporte({
                  ...nuevoReporte,
                  NombreIncidente: valor,
                  escala,
                  esOtro: valor === "Otro",
                });
              }}
            />

            {/* Escala detectada automáticamente */}
            <p style={{ color: "#007BFF", textAlign: "center", fontWeight: "bold" }}>
              Escala:{" "}
              {nuevoReporte.escala === 3
                ? "Alto"
                : nuevoReporte.escala === "2"
                ? "Medio"
                : nuevoReporte.escala === "1"
                ? "Bajo"
                : "No determinada"}
            </p>

            {/* Visualizacion de archivo */}
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

      {/* Modal Vista previa - LÓGICA DE DETECCIÓN CORREGIDA */}
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
            }}
            onClick={(e) => e.stopPropagation()}
          >
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
              }}
            >
              ✖
            </button>

            <h3 style={{ textAlign: "center", marginBottom: "10px" }}>Vista previa del archivo</h3>

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
                  borderRadius: "8px",
                  maxHeight: "400px",
                }}
              ></video>
            ) : (
              <p>Formato de archivo no compatible.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}