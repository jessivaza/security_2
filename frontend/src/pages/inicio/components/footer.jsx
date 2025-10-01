import { FaFacebookF, FaInstagram, FaLinkedinIn } from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";
import "../../../css/inicio/styleFooter.css";
//PIE DE PÁGINA
export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-top">
        {/* Columna 1 - Logo y descripción */}
        <div className="footer-column">
          <h2 className="footer-logo">SEGURIDAD CIUDADANA</h2>
          <p className="footer-subtitle">Protección Inteligente</p>
          <p className="footer-text">
            Tecnología avanzada para crear comunidades más seguras.
            Conectamos ciudadanos, autoridades y servicios de seguridad.
          </p>
          <div className="footer-socials">
            <a href="https://www.facebook.com/"><FaFacebookF /></a>
            <a href="https://x.com/"><FaXTwitter /></a>
            <a href="https://www.instagram.com/"><FaInstagram /></a>
            <a href="https://es.linkedin.com/"><FaLinkedinIn /></a>
          </div>
        </div>

        {/* Columna 2 - Tecnologías */}
        <div className="footer-column">
          <h3>Tecnologías</h3>
          <ul>
            <li><a href="#">Mapa Interactivo en Tiempo Real</a></li>
            <li><a href="#">Acceso para Autoridades</a></li>
            <li><a href="#">Sistema de Reportes Ciudadanos</a></li>
            <li><a href="#">Monitoreo Inteligente</a></li>
            <li><a href="#">Contratación de Seguridad Privada</a></li>
            <li><a href="#">Alertas Instantáneas</a></li>
          </ul>
        </div>

        {/* Columna 3 - Servicios*/}
        <div className="footer-column">
          <h3>Servicios</h3>
          <ul>
            <li><a href="#">Para Ciudadanos</a></li>
            <li><a href="#">Para Empresas</a></li>
            <li><a href="#">Para Autoridades</a></li>
          </ul>
        </div>

        {/* Columna 4 - Contacto */}
        <div className="footer-column">
          <h3>Contacto</h3>
          <p>📞 +51 123-4567</p>
          <p>📧 info@seguridadciudadana.com</p>

        </div>
      </div>


    </footer>
  );
}
