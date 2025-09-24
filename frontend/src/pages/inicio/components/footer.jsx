import '../../../css/inicio/styleFooter.css';
{/*Pie de página*/}
export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-container">
        © {new Date().getFullYear()} SEGURIDAD CIUDADANA — Mapas en tiempo real · Reportes ciudadanos · Seguridad privada · Acceso para emergencias
      </div>
    </footer>
  );

}


