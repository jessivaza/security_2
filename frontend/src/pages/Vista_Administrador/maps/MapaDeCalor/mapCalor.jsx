// src/pages/Vista_Administrador/maps/mapCalor.jsx
import { useMemo } from "react";
import { MapContainer, TileLayer } from "react-leaflet";
import HeatmapLayerCustom from "./components/HeatmapLayerCustom";



const INCIDENTES_EJEMPLO = [
    [-11.9628, -77.0606, 0.9],
    [-11.9494, -77.0602, 0.7],
    [-11.9490, -77.0755, 0.6],
    [-11.9555, -77.0705, 0.8],
    [-11.9610, -77.0700, 0.5],
    [-11.9550, -77.0575, 0.4],
    [-11.9700, -77.0650, 0.6],
    [-11.9655, -77.0555, 0.7],
    [-11.9585, -77.0675, 0.9],
    [-11.9525, -77.0720, 0.6],
];

const centerLosOlivos = [-11.9577, -77.0622];

export default function MapCalor() {
    const puntos = useMemo(() => INCIDENTES_EJEMPLO, []);

    return (
        // 👉 Importante: que el padre (dashboard) controle el alto.
        <div style={{ width: "100%", height: "100%" }}>
            <MapContainer
                center={centerLosOlivos}
                zoom={13}
                scrollWheelZoom
                style={{ width: "100%", height: "100%" }} // ocupa todo el wrapper
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                <HeatmapLayerCustom
                    points={puntos}                 // [lat, lng, intensidad]
                    radius={25}
                    blur={20}
                    minOpacity={0.5}
                    amplify={2.5}
                    fitBounds
                // gradient opcional:
                // gradient={{0.2:'#00f',0.5:'#0f0',0.8:'#ff0',1:'#f00'}}
                />
            </MapContainer>
        </div>
    );
}

