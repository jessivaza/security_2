import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../css/index.css";

// Importar FontAwesome
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser, faLock, faEye, faEyeSlash, faEnvelope } from "@fortawesome/free-solid-svg-icons";

export default function LoginPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState("login");
  const [form, setForm] = useState({ username: "", email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);//  Estado para mostrar/ocultar contraseña
  const [error, setError] = useState("");
  //  Manejar cambios en los inputs
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  //  Función para cambiar de pestaña y limpiar los campos
  const changeTab = (newTab) => {
    setTab(newTab);
    setForm({ username: "", email: "", password: "" }); // Limpiar valores
    setError(""); // Limpiar errores
    setShowPassword(false); // Resetear mostrar contraseña
  };

  //  Función para login
  const handleLogin = async () => {
    setError("");
    try {
      const res = await axios.post("http://localhost:8000/api/login", {
        username: form.username,
        password: form.password,
      });
      const token = res.data.access;
      if (token) {
        localStorage.setItem("token", token);
        alert("Login exitoso ✅");
        navigate("/dashboard");
      } else {
        setError("No se recibió token del servidor.");
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || "Error al iniciar sesión");
    }
  };

  //  Función para registro
  const handleRegister = async () => {
    setError("");
    try {
      const res = await axios.post("http://localhost:8000/api/registro", {
        username: form.username,
        email: form.email,
        password: form.password,
      });
      alert("Usuario registrado ✅");
      changeTab("login"); // Volver al login después del registro
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || err.response?.data?.detail || "Error al registrar");
    }
  };

  //  Función para restablecer contraseña
  const handleReset = async () => {
    setError("");
    try {
      const res = await axios.post("http://localhost:8000/api/enviar-correo", {
        email: form.email,
      });
      alert("Correo de recuperación enviado ✅");
      changeTab("login"); // Volver al login
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || err.response?.data?.detail || "Error al enviar correo");
    }
  };

  return (
    <div className="login-background">
      <div className="login-card">
        {/*  Icono grande de usuario arriba */}
        <div className="avatar-wrap">
          <FontAwesomeIcon icon={faUser} size="4x" />
        </div>

        {/*  Título dinámico según tab */}
        <h1>
          {tab === "login" ? "Iniciar Sesión" :
            tab === "registro" ? "Registrar" :
              "Restablecer Contraseña"}
        </h1>

        <form
          onSubmit={(e) => e.preventDefault()} // prevenimos recargar la página
        >
          {/*  Campo usuario (solo login y registro) */}
          {(tab === "login" || tab === "registro") && (
            <div className="input-group">
              <label>Usuario</label>
              <div className="input-row">
                <div className="icon-box">
                  <FontAwesomeIcon icon={faUser} />
                </div>
                <input
                  type="text"
                  name="username"
                  placeholder="Ingrese su usuario"
                  value={form.username}
                  onChange={handleChange}
                  autoComplete="username"
                  required
                />
              </div>
            </div>
          )}

          {/*  Campo email (solo registro y reset) */}
          {(tab === "registro" || tab === "reset") && (
            <div className="input-group">
              <label>Email</label>
              <div className="input-row">
                <div className="icon-box">
                  <FontAwesomeIcon icon={faEnvelope} />
                </div>
                <input
                  type="email"
                  name="email"
                  placeholder="Ingrese su correo"
                  value={form.email}
                  onChange={handleChange}
                  autoComplete="email"
                  required
                />
              </div>
            </div>
          )}

          {/* Campo contraseña (solo login y registro) */}
          {(tab === "login" || tab === "registro") && (
            <div className="input-group">
              <label>Contraseña</label>
              <div className="input-row">
                <div className="icon-box">
                  <FontAwesomeIcon icon={faLock} />
                </div>
                <input
                  type={showPassword ? "text" : "password"} // mostrar/ocultar
                  name="password"
                  placeholder="Ingrese su contraseña"
                  value={form.password}
                  onChange={handleChange}
                  autoComplete="current-password"
                  required
                />
                {/*  Botón de mostrar/ocultar */}
                <div
                  className="icon-box eye-icon"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ cursor: "pointer" }}
                >
                  <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
                </div>
              </div>
            </div>
          )}
          {error && <p className="login-error">{error}</p>}
          <div className="btn-group">
            {tab === "login" && <button className="btn login-btn" onClick={handleLogin}>Ingresar</button>}
            {tab === "registro" && <button className="btn register-btn" onClick={handleRegister}>Registrar</button>}
            {tab === "reset" && <button className="btn reset-btn" onClick={handleReset}>Enviar Correo</button>}
          </div>
          <div className="small-link" style={{ marginTop: "10px" }}>
            {tab !== "login" && <button className="link-btn" onClick={() => changeTab("login")}>Ir a Login</button>}
            {tab !== "registro" && <button className="link-btn" onClick={() => changeTab("registro")}>Ir a Registro</button>}
            {tab !== "reset" && <button className="link-btn" onClick={() => changeTab("reset")}>Olvidé mi contraseña</button>}
          </div>
        </form>
      </div>
    </div>
  );
}
