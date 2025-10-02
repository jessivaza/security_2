import L from "leaflet";
import "leaflet.heat";
import { useEffect, useMemo } from "react";
import { useMap } from "react-leaflet";

/**
 * props:
 * - points: [[lat, lng, intensity?]]
 * - radius, blur: tamaño y difuminado (en px)
 * - minOpacity: opacidad mínima global de la capa
 * - amplify: multiplica la intensidad de cada punto (para que “se note”)
 * - gradient: opcional (ej: {0.2:'blue',0.5:'lime',0.8:'orange',1:'red'})
 * - fitBounds: si true ajusta vista a los puntos
 */
export default function HeatmapLayerCustom({
    points = [],
    radius = 50,
    blur = 50,
    minOpacity = 0.6,
    amplify = 3,
    gradient,
    fitBounds = true,
}) {
    const map = useMap();

    // Escalamos intensidades y las limitamos a 1
    const scaledPoints = useMemo(
        () => points.map(([lat, lng, w = 1]) => [lat, lng, Math.min(1, w * amplify)]),
        [points, amplify]
    );

    useEffect(() => {
        if (!map) return;

        const heat = L.heatLayer(scaledPoints, {
            radius,
            blur,
            minOpacity,
            ...(gradient ? { gradient } : {}),
        }).addTo(map);

        if (fitBounds && scaledPoints.length > 0) {
            const latlngs = scaledPoints.map(([lat, lng]) => L.latLng(lat, lng));
            const bounds = L.latLngBounds(latlngs);
            map.fitBounds(bounds, { padding: [30, 30] });
        }

        return () => {
            map.removeLayer(heat);
        };
    }, [map, radius, blur, minOpacity, gradient, fitBounds, JSON.stringify(scaledPoints)]);

    return null;
}

