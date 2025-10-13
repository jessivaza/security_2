// src/pages/Vista_Administrador/maps/mapCalor.jsx
import { useMemo } from "react";
import { MapContainer, TileLayer } from "react-leaflet";
import HeatmapLayerCustom from "./components/HeatmapLayerCustom";
import useHeatmapPolling from "./hooks/useHeatmapPolling";

const BASE_URL = "http://127.0.0.1:8000/api";
const centerLosOlivos = [-11.9577, -77.0622];

export default function MapCalor() {
    // Opcional: limitar por zona (south,west,north,east)
    const bbox = "-12.1,-77.2,-11.8,-76.9";

    const { points, loading } = useHeatmapPolling({
        baseUrl: BASE_URL,
        intervalMs: 10000,     // refresca cada 10s
        daysWindow: 14,
        params: { escala_min: 1, escala_max: 3, bbox },
    });

    const gradient = useMemo(
        () => ({ 0.2: "#00f", 0.5: "#0f0", 0.8: "#ff0", 1: "#f00" }),
        []
    );

    return (
        <div style={{ width: "100%", height: "100%" }}>
            <MapContainer
                center={centerLosOlivos}
                zoom={13}
                scrollWheelZoom
                preferCanvas
                style={{ width: "100%", height: "100%" }}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {!loading && (
                    <HeatmapLayerCustom
                        points={points}
                        radius={25}
                        blur={20}
                        minOpacity={0.5}
                        amplify={1}
                        gradient={gradient}
                        fitBounds
                    />
                )}
            </MapContainer>
        </div>
    );
}
