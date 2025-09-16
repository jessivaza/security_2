import React from "react";

export default function Dashboard() {
  const logout = () => {
    localStorage.removeItem("token");
    window.location.href = "/login";
  };

  return (
    <div style={{ textAlign: "center", marginTop: "50px" }}>
      <h2>Bienvenido al Dashboard 🎉</h2>
      <button onClick={logout}>Cerrar sesión</button>
    </div>
  );
}
