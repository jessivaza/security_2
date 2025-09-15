import React, { useEffect, useState } from "react";
import api from "../api";
import { logout } from "../auth";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const [me, setMe] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    api.get("me")
      .then((res) => setMe(res.data))
      .catch(() => navigate("/login"));
  }, [navigate]);

  return (
    <div style={{ maxWidth: 600, margin: "40px auto" }}>
      <h2>Dashboard</h2>
      {me ? (
        <p>Hola, {me.username} ({me.email})</p>
      ) : (
        <p>Cargando...</p>
      )}
      <button
        onClick={() => {
          logout();
          navigate("/login");
        }}
      >
        Salir
      </button>
    </div>
  );
}
