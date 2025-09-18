import { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap, CircleMarker } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-routing-machine/dist/leaflet-routing-machine.css";
import "leaflet-routing-machine";

import "../css/dashUsuario.css";

// ======= Ruteo =======
function Routing({ origin, destination }) {
  const map = useMap();

  useEffect(() => {
    if (!origin || !destination) return;

    const routingControl = L.Routing.control({
      waypoints: [
        L.latLng(origin.lat, origin.lng),
        L.latLng(destination.lat, destination.lng),
      ],
      lineOptions: {
        styles: [{ color: "blue", weight: 5 }],
      },
      addWaypoints: false,
      draggableWaypoints: false,
      routeWhileDragging: false,
      show: false,
    }).addTo(map);

    return () => map.removeControl(routingControl);
  }, [map, origin, destination]);

  return null;
}

export default function DasUsuario() {
  const [origin, setOrigin] = useState(null);
  const [destination, setDestination] = useState(null);
  const [search, setSearch] = useState("");

  // Ejemplo de incidentes
  const incidentes = [
    { id: 1, lat: -11.949, lng: -77.07, tipo: "Robo", desc: "Robo en Av. Central" },
    { id: 2, lat: -11.955, lng: -77.065, tipo: "Asalto", desc: "Asalto a transeúnte" },
    { id: 3, lat: -11.960, lng: -77.072, tipo: "Emergencia", desc: "Emergencia médica reportada" },
  ];

  // Obtener ubicación actual
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        setOrigin({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      });
    }
  }, []);

  // Buscar destino
  const handleSearch = async (e) => {
    e.preventDefault();
    if (!search) return;

    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${search}`
      );
      const data = await res.json();

      if (data.length > 0) {
        setDestination({
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon),
        });
      } else {
        alert("No se encontró la ubicación ❌");
      }
    } catch (error) {
      console.error("Error al buscar destino:", error);
    }
  };

  return (
    <div className="dashboard">
      {/* ===== Sidebar ===== */}
      <aside className="sidebar">
        <div className="user-profile">
          <img
            src="https://cdn-icons-png.flaticon.com/512/149/149071.png"
            alt="Usuario"
            className="sidebar-avatar"
          />
          <h3>Juan Pérez</h3>
          <p>Los Olivos</p>
        </div>

        <ul>
          <li>📊 Resumen</li>
          <li>🗺️ Mapa</li>
          <li>📝 Mis Reportes</li>
          <li>🔔 Alertas</li>
          <li>📚 Prevención</li>
          <li>👤 Mi Perfil</li>
          <li>⚙️ Configuración</li>
        </ul>

        <div className="logout-container">
          <button className="logout-btn">🚪 Cerrar Sesión</button>
        </div>
      </aside>

      {/* ===== Panel principal ===== */}
      <main className="main-panel">
        <header className="header">
          <h1>🛡️ Seguridad Ciudadana – Los Olivos</h1>
        </header>

        {/* Tarjetas de resumen */}
        <section className="cards">
          <div className="card">📊 Incidentes hoy: 12</div>
          <div className="card">⏱️ Respuesta promedio: 5 min</div>
          <div className="card">✅ Zonas seguras: 82%</div>
        </section>

        {/* Mapa */}
        <section className="map-section">
          <h2>🗺️ Buscar ruta</h2>

          {/* Buscador */}
          <form className="route-form" onSubmit={handleSearch}>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Ingresa tu destino (ej: UTP, Mall, Comisaría)"
              className="route-input"
            />
            <button type="submit" className="route-btn">🔍 Buscar</button>
          </form>

          <div style={{ height: "500px", width: "100%", marginTop: "10px" }}>
            {origin && (
              <MapContainer
                center={[origin.lat, origin.lng]}
                zoom={14}
                style={{ height: "100%", width: "100%", borderRadius: "12px" }}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; OpenStreetMap contributors'
                />

                {/* Ubicación actual */}
                <Marker position={[origin.lat, origin.lng]}>
                  <Popup>📍 Mi ubicación actual</Popup>
                </Marker>

                {/* Incidentes como puntos rojos */}
                {incidentes.map((inc) => (
                  <CircleMarker
                    key={inc.id}
                    center={[inc.lat, inc.lng]}
                    radius={10}
                    color="red"
                    fillColor="red"
                    fillOpacity={0.8}
                  >
                    <Popup>
                      🚨 <strong>{inc.tipo}</strong> <br />
                      {inc.desc}
                    </Popup>
                  </CircleMarker>
                ))}

                {/* Ruta */}
                {destination && (
                  <>
                    <Marker position={[destination.lat, destination.lng]}>
                      <Popup>🎯 Destino</Popup>
                    </Marker>
                    <Routing origin={origin} destination={destination} />
                  </>
                )}
              </MapContainer>
            )}
          </div>
        </section>

        {/* Reportes */}
        <section className="reports">
          <h2>📝 Mis Reportes</h2>
          <button className="report-btn">➕ Nuevo Reporte</button>
          <ul>
            <li>
              🚨 Robo en Av. Central – <span className="pending">Pendiente</span>
            </li>
            <li>
              📢 Bulla vecinal – <span className="in-progress">En atención</span>
            </li>
            <li>
              🚑 Emergencia médica – <span className="resolved">Resuelto</span>
            </li>
          </ul>
        </section>

        {/* Perfil */}
        <section className="profile">
          <h2>👤 Mi Información</h2>
          <p><strong>Nombre:</strong> Juan Pérez</p>
          <p><strong>Zona:</strong> Los Olivos - Sector A</p>
          <p><strong>Historial:</strong> 5 reportes enviados</p>
          <p><strong>Privacidad:</strong> Anónimo activado ✅</p>
        </section>
      </main>
    </div>
  );
}
