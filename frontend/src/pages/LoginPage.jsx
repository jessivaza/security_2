import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function Login() {
  const [tab, setTab] = useState("login");
  const [form, setForm] = useState({ username: "", email: "", password: "" });
  const navigate = useNavigate();

  // 🔹 Manejar cambios en inputs
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // 🔹 Login
  const handleLogin = async () => {
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
        alert("No se recibió token ❌");
      }
    } catch (err) {
      console.error("Error al iniciar sesión:", err.response?.data || err.message);
      alert("Error al iniciar sesión ❌ " + (err.response?.data?.error || err.message));
    }
  };

  // 🔹 Registro
  const handleRegister = async () => {
    try {
      const res = await axios.post("http://localhost:8000/api/registro", {
        username: form.username,
        email: form.email,
        password: form.password,
      });

      console.log("Respuesta del backend:", res.data);
      alert("Usuario registrado ✅");
      setTab("login");
    } catch (err) {
      console.error("Error al registrar:", err.response?.data || err.message);
      alert(
        "Error al registrar ❌ " +
          (err.response?.data?.error || err.response?.data?.detail || err.message)
      );
    }
  };

  // 🔹 Restablecer contraseña
  const handleReset = async () => {
    try {
      const res = await axios.post("http://localhost:8000/api/enviar-correo", {
        email: form.email,
      });

      console.log("Respuesta del backend:", res.data);
      alert("Correo de recuperación enviado ✅");
      setTab("login");
    } catch (err) {
      console.error("Error en reset:", err.response?.data || err.message);
      alert(
        "Error al enviar correo ❌ " +
          (err.response?.data?.error || err.response?.data?.detail || err.message)
      );
    }
  };

  return (
    <div style={{ width: "300px", margin: "50px auto", textAlign: "center" }}>
      <h2>
        {tab === "login"
          ? "Iniciar Sesión"
          : tab === "registro"
          ? "Registrar"
          : "Restablecer Contraseña"}
      </h2>

      {/* Usuario (solo en login y registro) */}
      {tab !== "reset" && (
        <input
          type="text"
          name="username"
          placeholder="Usuario"
          value={form.username}
          onChange={handleChange}
        />
      )}

      {/* Email (solo en registro y reset) */}
      {tab !== "login" && (
        <input
          type="email"
          name="email"
          placeholder="Correo"
          value={form.email}
          onChange={handleChange}
        />
      )}

      {/* Password (solo en login y registro) */}
      {tab !== "reset" && (
        <input
          type="password"
          name="password"
          placeholder="Contraseña"
          value={form.password}
          onChange={handleChange}
        />
      )}

      {/* Botones de acción */}
      {tab === "login" && <button onClick={handleLogin}>Login</button>}
      {tab === "registro" && <button onClick={handleRegister}>Registrar</button>}
      {tab === "reset" && <button onClick={handleReset}>Enviar Correo</button>}

      {/* Navegación entre tabs */}
      <div style={{ marginTop: "10px" }}>
        {tab !== "login" && <button onClick={() => setTab("login")}>Ir a Login</button>}
        {tab !== "registro" && <button onClick={() => setTab("registro")}>Ir a Registro</button>}
        {tab !== "reset" && (
          <button onClick={() => setTab("reset")}>Olvidé mi contraseña</button>
        )}
      </div>
    </div>
  );
}
