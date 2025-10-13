// src/pages/Vista_Administrador/maps/components/HeatmapLayerCustom.jsx
import L from "leaflet";
import "leaflet.heat";
import { useEffect, useMemo, useRef } from "react";
import { useMap } from "react-leaflet";

/**
 * props:
 * - points: [[lat, lng, intensity?]]
 * - radius, blur, minOpacity
 * - amplify: multiplica intensidad (default 1)
 * - gradient: colores opcionales
 * - fitBounds: ajusta vista al primer set de puntos
 */
export default function HeatmapLayerCustom({
    points = [],
    radius = 50,
    blur = 50,
    minOpacity = 0.6,
    amplify = 1,
    gradient,
    fitBounds = true,
}) {
    const map = useMap();
    const layerRef = useRef(null);
    const hasFitted = useRef(false);

    // Escalamos intensidades si se usa amplify
    const scaledPoints = useMemo(
        () => points.map(([lat, lng, w = 1]) => [lat, lng, Math.min(1, w * amplify)]),
        [points, amplify]
    );

    // Crear la capa una sola vez
    useEffect(() => {
        if (!map || layerRef.current) return;
        const heat = L.heatLayer([], {
            radius,
            blur,
            minOpacity,
            ...(gradient ? { gradient } : {}),
        }).addTo(map);
        layerRef.current = heat;

        return () => {
            if (layerRef.current) {
                map.removeLayer(layerRef.current);
                layerRef.current = null;
            }
        };
    }, [map, radius, blur, minOpacity, gradient]);

    // Actualizar puntos cuando cambien
    useEffect(() => {
        if (!layerRef.current) return;
        layerRef.current.setLatLngs(scaledPoints);

        if (fitBounds && !hasFitted.current && scaledPoints.length > 0) {
            const latlngs = scaledPoints.map(([lat, lng]) => L.latLng(lat, lng));
            const bounds = L.latLngBounds(latlngs);
            map.fitBounds(bounds, { padding: [30, 30] });
            hasFitted.current = true;
        }
    }, [scaledPoints, fitBounds, map]);

    return null;
}
