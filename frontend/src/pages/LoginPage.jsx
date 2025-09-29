import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "bootstrap-icons/font/bootstrap-icons.css";
import axios from "axios";
import "../css/index.css";
import logo from "../img/logo.jpg";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser, faLock, faEye, faEyeSlash, faEnvelope } from "@fortawesome/free-solid-svg-icons";

export default function LoginPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState("login");
  const [form, setForm] = useState({ username: "", email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const changeTab = (newTab) => {
    setTab(newTab);
    setForm({ username: "", email: "", password: "" });
    setError("");
    setShowPassword(false);
  };

  const handleLogin = async () => {
    setError("");
    try {
      const res = await axios.post("http://localhost:8000/api/login/", {
        username: form.username,
        password: form.password,
      });

      const access = res.data.access;
      const idUsuario = res.data.idUsuario;

      if (access) {
        localStorage.setItem("access", access);
        if (idUsuario) localStorage.setItem("idUsuario", idUsuario);
        alert("Login exitoso ✅");
        navigate("/dashUsuario");
      } else {
        setError("No se recibió el token de acceso.");
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || "Error al iniciar sesión");
    }
  };

  const handleRegister = async () => {
    setError("");
    try {
      await axios.post("http://localhost:8000/api/registro", {
        username: form.username,
        email: form.email,
        password: form.password,
      });
      alert("Usuario registrado ✅");
      changeTab("login");
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || "Error al registrar");
    }
  };

  const handleReset = async () => {
    setError("");
    try {
      await axios.post("http://localhost:8000/api/enviar-correo", {
        email: form.email,
      });
      alert("Correo de recuperación enviado ✅");
      changeTab("login");
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || "Error al enviar correo");
    }
  };

  return (
    <div className="login-background">
      <div className="login-card">
        <div className="card-hero">
          <img src={logo} alt="Logo" className="hero-img" />
        </div>

        <div className="card-form">
          <div className="logo-wrap">
            <div className="icon-container">
              <i className="bi bi-person-fill icon-user"></i>
            </div>
          </div>

          <div className="tab-header">
            <button
              className={`tab-btn ${tab === "login" ? "active" : ""}`}
              onClick={() => changeTab("login")}
            >
              Iniciar Sesión
            </button>
            <button
              className={`tab-btn ${tab === "registro" ? "active" : ""}`}
              onClick={() => changeTab("registro")}
            >
              Regístrate
            </button>
          </div>

          <form onSubmit={(e) => e.preventDefault()}>
            {(tab === "login" || tab === "registro") && (
              <div className="input-group">
                <label>Usuario</label>
                <div className="input-row">
                  <div className="icon-box"><FontAwesomeIcon icon={faUser} /></div>
                  <input
                    type="text"
                    name="username"
                    placeholder="Ingrese su usuario"
                    value={form.username}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
            )}

            {(tab === "registro" || tab === "reset") && (
              <div className="input-group">
                <label>Email</label>
                <div className="input-row">
                  <div className="icon-box"><FontAwesomeIcon icon={faEnvelope} /></div>
                  <input
                    type="email"
                    name="email"
                    placeholder="Ingrese su correo"
                    value={form.email}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
            )}

            {(tab === "login" || tab === "registro") && (
              <div className="input-group">
                <label>Contraseña</label>
                <div className="input-row">
                  <div className="icon-box"><FontAwesomeIcon icon={faLock} /></div>
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    placeholder="Ingrese su contraseña"
                    value={form.password}
                    onChange={handleChange}
                    required
                  />
                  <div
                    className="icon-box eye-icon"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
                  </div>
                </div>
              </div>
            )}

            {error && <p className="login-error">{error}</p>}

            <div className="small-options">
              <label className="remember-me">
                <input type="checkbox" /> Recordar sesión
              </label>
              <button className="link-btn" onClick={() => changeTab("reset")}>
                ¿Olvidaste tu contraseña?
              </button>
            </div>

            <div className="btn-group">
              {tab === "login" && (
                <button className="btn login-btn" onClick={handleLogin}>Ingresar</button>
              )}
              {tab === "registro" && (
                <button className="btn register-btn" onClick={handleRegister}>Registrar</button>
              )}
              {tab === "reset" && (
                <button className="btn reset-btn" onClick={handleReset}>Enviar Correo</button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
