import { useNavigate } from "react-router-dom";
import '../../../css/inicio/styleHeader.css'; // <-- Importa el CSS
import PoliciaImg from '../../../img/inicio/policia.png';
{/*Encabezado */}
export default function Header() {
	const navigate = useNavigate();

	return (
		<header className="header">
			<div className="header-container">
				<div className="logo-section">
					<div className="logo-circle">
						<img src={PoliciaImg} alt="Policía" />
					</div>
					<div className="logo-text">
						<div className="title">SEGURIDAD CIUDADANA</div>
						<div className="subtitle" style={{color: "black"}}>Protección Inteligente</div>
					</div>
				</div>
				<nav className="nav-buttons">
					<a href="#">Inicio</a>
					<a href="#">Tecnologías</a>
					<a href="#planes">Planes</a>
					<button onClick={() => navigate("/login")}>Iniciar sesión</button>
				</nav>
			</div>
		</header>
	);
}
