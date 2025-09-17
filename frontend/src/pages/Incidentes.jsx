import React, { useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import "../css/incidentes.css";

export default function Incidentes() {
  const [formData, setFormData] = useState({
    tipoIncidente: "",
    ubicacion: "",
    horaReporte: "",
    descripcion: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Ajusta los nombres de los campos para que coincidan con el backend
      const payload = {
        NombreIncidente: formData.tipoIncidente,
        Ubicacion: formData.ubicacion,
        FechaHora: formData.horaReporte,
        Descripcion: formData.descripcion,
      };
  const response = await axios.post("/api/registrar-incidente/", payload);
      alert(response.data.message || "Incidente registrado correctamente");
      setFormData({ tipoIncidente: "", ubicacion: "", horaReporte: "", descripcion: "" });
    } catch (error) {
      alert("Error al registrar incidente: " + (error.response?.data?.message || error.message));
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    window.location.href = "/login";
  };

  return (
    <div className="dashboard-container">
      {/* Sidebar */}
      <div className="sidebar">
        <h2>Seguridad</h2>
        <ul>
          <li>Dashboard</li>
          <li>
            <Link to="/incidentes" className="sidebar-link">Incidentes</Link>
          </li>
          <li>Historial</li>
          <li>Mapa</li>
        </ul>
      </div>

      {/* Main content */}
      <div className="main-content">
        <div className="header">
          <h3>Reporte de Incidentes</h3>
          <div className="user-info">
            <p>Hola, emerson (emontenegro1234@gmail.com)</p>
            <button className="profile-btn">Profile</button>
          </div>
        </div>

        <form className="incidentes-form" onSubmit={handleSubmit}>
          <h4>Información del Incidente</h4>
          <p>Completa todos los campos para registrar el incidente</p>
          
          <div className="form-group">
            <label>Tipo de Incidente *</label>
            <select
              name="tipoIncidente"
              value={formData.tipoIncidente}
              onChange={handleChange}
              required
            >
              <option value="">Selecciona el tipo de incidente</option>
              <option value="robo">Robo</option>
              <option value="accidente">Accidente</option>
              <option value="incendio">Incendio</option>
            </select>
          </div>

          <div className="form-group">
            <label>Ubicación *</label>
            <input
              type="text"
              name="ubicacion"
              value={formData.ubicacion}
              onChange={handleChange}
              placeholder="Ingresa la dirección o referencia"
              required
            />
          </div>

          <div className="form-group">
            <label>Hora del Reporte</label>
            <input
              type="datetime-local"
              name="horaReporte"
              value={formData.horaReporte}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label>Descripción Breve del Asunto *</label>
            <textarea
              name="descripcion"
              value={formData.descripcion}
              onChange={handleChange}
              placeholder="Describe brevemente lo ocurrido"
              required
            ></textarea>
          </div>

          <button type="submit" className="btn-submit">Registrar Incidente</button>
        </form>
      </div>

      {/* Logout Button */}
      <div className="logout-btn">
        <button onClick={logout}>Cerrar sesión</button>
      </div>
    </div>
  );
}
