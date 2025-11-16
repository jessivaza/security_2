import React from "react";
import { Heatmap } from "react-native-maps";

export default function HeatmapLayerCustom({ points = [], radius = 35, opacity = 0.7 }) {
    const heatPoints = points.map(([lat, lng, w = 1]) => ({
        latitude: lat,
        longitude: lng,
        weight: w,
    }));

    return <Heatmap points={heatPoints} radius={radius} opacity={opacity} />;
}
