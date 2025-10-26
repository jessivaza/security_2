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
];

export default function MisReportes({ darkMode, onReportesActualizados }) {
  const [reportes, setReportes] = useState([]);
  const [mostrarModal, setMostrarModal] = useState(false);
  // 🔄 archivoPreview ahora almacena el OBJETO { url, type } o null
  const [archivoPreview, setArchivoPreview] = useState(null);
  const [tempPreviewUrl, setTempPreviewUrl] = useState(null);
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

  // ---------- Determinar escala automática (SOLO por NombreIncidente) ----------
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

  // ... (Funciones de Ubicación sin cambios) ...

  // ---------- Función para obtener ubicación por IP (Respaldo) ----------
  const obtenerUbicacionPorIP = async () => {
    try {
      const ipRes = await axios.get('https://ipapi.co/json/');
      const ipData = ipRes.data;

      const ubicacionIP = `${ipData.city || 'Ciudad'}, ${ipData.region || 'Región'}, ${ipData.country_name || 'País'} (Aprox. por IP)`;

      setNuevoReporte((prev) => ({
        ...prev,
        Ubicacion: ubicacionIP,
        Latitud: ipData.latitude || "",
        Longitud: ipData.longitude || "",
      }));

      alert(`Ubicación aproximada obtenida por IP: ${ubicacionIP}. La ubicación exacta requiere permiso de GPS.`);

    } catch (e) {
      console.error("Error obteniendo ubicación por IP:", e);
      alert("No se pudo obtener la ubicación automáticamente.");
    }
  };


  // ---------- Obtener ubicación por GPS (Máxima Precisión) ----------
  const obtenerUbicacionPorGPS = () => {
    return new Promise((resolve, reject) => {
      if (!("geolocation" in navigator)) {
        reject("Tu navegador no soporta la geolocalización.");
        return;
      }

      // Opciones para solicitar la máxima precisión (usando GPS)
      const options = {
        enableHighAccuracy: true, // Pide la máxima precisión
        timeout: 10000,           // 10 segundos antes de fallar
        maximumAge: 0             // No usar cache
      };

      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const { latitude, longitude } = pos.coords;
          const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`;

          try {
            // Convertir coordenadas a dirección legible
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
          } catch (error) {
            // Si Nominatim falla, usamos solo las coordenadas
            setNuevoReporte((prev) => ({
              ...prev,
              Ubicacion: `Lat: ${latitude}, Lon: ${longitude} (Error al obtener calle)`,
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
    });
  };

  // ---------- Vista previa ----------
  //  MODIFICADA para manejar objeto { url, type } o string (para URLs del backend)
  const abrirPreview = (data) => {
    if (typeof data === 'string') {
      // Es una URL del backend. Intentamos adivinar el tipo por la extensión.
      const url = data;
      let type = 'application/octet-stream'; // Default
      if (url.endsWith('.pdf')) type = 'application/pdf';
      else if (url.match(/\.(jpg|jpeg|png|gif)$/i)) type = 'image';
      else if (url.match(/\.(mp4|webm|ogg)$/i)) type = 'video';
      setArchivoPreview({ url, type });
    } else {
      // Es el objeto { url, type } del archivo local (tempPreviewUrl)
      setArchivoPreview(data);
    }
  };

  const cerrarPreview = () => {
    // Si la URL es la temporal, la limpiamos al cerrar.
    if (archivoPreview && archivoPreview.url === tempPreviewUrl) {
      URL.revokeObjectURL(tempPreviewUrl);
      setTempPreviewUrl(null);
    }
    setArchivoPreview(null);
  };

  // ---------- Registrar incidente (Sin cambios) ----------
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
      //alert("¡Incidente registrado con éxito!");
    } catch (err) {
      console.error("Error al registrar incidente:", err);
      alert("Error al registrar el incidente. Revisa la consola.");
    }
  };

  // ... (Funciones de Exportación sin cambios) ...

  // ---------- Exportar PDF (Sin cambios) ----------
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
      // Usar la hora local de Perú para el PDF
      new Date(r.FechaHora).toLocaleString("es-ES", { timeZone: 'America/Lima' }),
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

  // ---------- Exportar Excel (Sin cambios) ----------
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
      // Usar la hora local de Perú para el Excel
      new Date(r.FechaHora).toLocaleString("es-PE", { timeZone: 'America/Lima' }),
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
                      // 🔄 Pasar solo la URL para los archivos del backend (se infiere el tipo)
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
              placeholder="Nombre del Incidente"
              value={nuevoReporte.NombreIncidente}
              onChange={(e) => {
                const valor = e.target.value;
                const escalaDetectada = determinarEscala(valor);
                setNuevoReporte({
                  ...nuevoReporte,
                  NombreIncidente: valor,
                  escala: escalaDetectada,
                });
              }}
            />
            <input
              type="text"
              placeholder="Descripción"
              value={nuevoReporte.Descripcion}
              onChange={(e) => {
                setNuevoReporte({
                  ...nuevoReporte,
                  Descripcion: e.target.value,
                });
              }}
            />


            {/* Escala detectada automáticamente */}
            <p style={{ color: "#007BFF", textAlign: "center", fontWeight: "bold" }}>
              Escala detectada:{" "}
              {nuevoReporte.escala === "3"
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
              onChange={(e) => {
                const file = e.target.files[0];

                // Limpiar la URL anterior si existe
                if (tempPreviewUrl) {
                  URL.revokeObjectURL(tempPreviewUrl);
                }

                if (file) {
                  const newUrl = URL.createObjectURL(file);
                  setTempPreviewUrl(newUrl);
                  setNuevoReporte({ ...nuevoReporte, Archivo: file });
                } else {
                  setTempPreviewUrl(null);
                  setNuevoReporte({ ...nuevoReporte, Archivo: null });
                }
              }}
            />

            {nuevoReporte.Archivo && (

              <div className="file-upload-container" style={{ marginTop: "15px" }}>

                <span className="file-upload-status">
                  <span className="icon">📎</span> Archivo listo para subir
                </span>

                {tempPreviewUrl && nuevoReporte.Archivo.type && (
                  <button
                    onClick={() => abrirPreview({ url: tempPreviewUrl, type: nuevoReporte.Archivo.type })}
                    className="btn-preview-file"
                  >
                    <span className="icon">🔍</span> Ver Contenido
                  </button>
                )}
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
              boxShadow: "0 4px 15px rgba(0,0,0,0.3)",
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
                cursor: "pointer",
              }}
            >
              ✖
            </button>

            <h3 style={{ textAlign: "center", marginBottom: "10px" }}>
              Vista previa del archivo
            </h3>

            {/* 🔄 DETECCIÓN BASADA EN EL TIPO MIME */}
            {archivoPreview.type.includes("pdf") ? (
              <iframe
                src={archivoPreview.url}
                width="100%"
                height="400px"
                title="Vista PDF"
                style={{ border: "1px solid #ccc", borderRadius: "6px" }}
              ></iframe>
            ) : archivoPreview.type.includes("image") ? (
              <img
                src={archivoPreview.url}
                alt="Vista previa"
                style={{
                  width: "100%",
                  maxHeight: "400px",
                  objectFit: "contain",
                  borderRadius: "8px",
                }}
              />
            ) : archivoPreview.type.includes("video") ? (
              <video
                src={archivoPreview.url}
                controls
                style={{
                  width: "100%",
                  borderRadius: "8px",
                  maxHeight: "400px",
                }}
              ></video>
            ) : (
              <p>Formato de archivo no compatible o URL de vista previa no válida.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}