import { useState } from "react"; 
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable"; 
import * as XLSX from "xlsx";
import logo from "../../img/inicio/policia.png"; 
import "../../css/Vista_usuario/reportes.css";

export default function MisReportes({ darkMode }) {
  const [reportes] = useState([
    { id: 1, fecha: "2025-09-25", tipo: "Robo", detalle: "Se reportó un robo en la Av. Central" },
    { id: 2, fecha: "2025-09-26", tipo: "Accidente", detalle: "Accidente vehicular en Av. Universitaria" },
  ]);

  // Exportar PDF
  const exportarPDF = () => {
    const doc = new jsPDF();

    // 👉 Logo arriba a la izquierda
    doc.addImage(logo, "PNG", 14, 10, 20, 20);

    // 👉 Título (sin emoji)
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text("Mis Reportes", 40, 22);

    // 👉 Subtítulo con fecha de exportación
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.text(`Fecha de exportación: ${new Date().toLocaleDateString()}`, 14, 40);

    // 👉 Datos en tabla
    const datos = reportes.map(r => [r.id, r.fecha, r.tipo, r.detalle]);

    autoTable(doc, {
      head: [["ID", "Fecha", "Tipo", "Detalle"]],
      body: datos,
      startY: 50,
      styles: { fontSize: 10, halign: "center" },
      headStyles: {
        fillColor: [37, 99, 235], // azul
        textColor: [255, 255, 255],
        fontStyle: "bold",
      },
      alternateRowStyles: { fillColor: [240, 240, 240] }, // filas grises
      margin: { left: 14, right: 14 },
    });

    // 👉 Footer
    doc.setFontSize(9);
    doc.text("Reporte generado automáticamente por el sistema", 14, doc.internal.pageSize.height - 10);

    doc.save("mis_reportes.pdf");
  };

  // Exportar Excel
  const exportarExcel = () => {
    const datos = reportes.map(r => ({
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

      {/* Botones exportar */}
      <div style={{ marginBottom: "10px" }}>
        <button onClick={exportarPDF} className="btn-export">📄 Exportar PDF</button>
        <button onClick={exportarExcel} className="btn-export">📊 Exportar Excel</button>
      </div>

      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Fecha</th>
            <th>Tipo</th>
            <th>Detalle</th>
          </tr>
        </thead>
        <tbody>
          {reportes.map(r => (
            <tr key={r.id}>
              <td>{r.id}</td>
              <td>{r.fecha}</td>
              <td>{r.tipo}</td>
              <td>{r.detalle}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
