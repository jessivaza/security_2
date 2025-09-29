// Mapa.jsx
import React, { useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Configurar los íconos de Leaflet sin usar require
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

export default function Mapa() {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [markerPosition, setMarkerPosition] = useState(null);
  const [debounceTimeout, setDebounceTimeout] = useState(null);

  const searchAddress = async (value) => {
    if (!value || value.length < 3) {
      setSuggestions([]);
      return;
    }
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&q=${value}&countrycodes=PE&limit=5`
      );
      const data = await response.json();
      setSuggestions(data);
    } catch (err) {
      console.error("Error buscando dirección:", err);
    }
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setQuery(value);

    if (debounceTimeout) clearTimeout(debounceTimeout);

    const timeout = setTimeout(() => {
      searchAddress(value);
    }, 300); // espera 300ms antes de hacer la búsqueda

    setDebounceTimeout(timeout);
  };

  const handleSelect = (place) => {
    setQuery(place.display_name);
    setSuggestions([]);
    setMarkerPosition([place.lat, place.lon]);
  };

  return (
    <div className="map-container" style={{ width: "100%", height: "500px" }}>
      <div style={{ marginBottom: "10px", position: "relative" }}>
        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          placeholder="Ingresa dirección en Perú..."
          style={{ width: "100%", padding: "8px" }}
        />
        {suggestions.length > 0 && (
          <ul
            style={{
              position: "absolute",
              top: "36px",
              left: 0,
              right: 0,
              background: "white",
              border: "1px solid #ccc",
              maxHeight: "150px",
              overflowY: "auto",
              zIndex: 1000,
              listStyle: "none",
              padding: 0,
              margin: 0,
            }}
          >
            {suggestions.map((s) => (
              <li
                key={s.place_id}
                onClick={() => handleSelect(s)}
                style={{
                  padding: "5px 10px",
                  cursor: "pointer",
                  borderBottom: "1px solid #eee",
                }}
              >
                {s.display_name}
              </li>
            ))}
          </ul>
        )}
      </div>

      <MapContainer
        center={markerPosition || [-11.95, -77.07]}
        zoom={13}
        style={{ width: "100%", height: "100%" }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; OpenStreetMap contributors"
        />
        {markerPosition && (
          <Marker position={markerPosition}>
            <Popup>{query}</Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  );
}
