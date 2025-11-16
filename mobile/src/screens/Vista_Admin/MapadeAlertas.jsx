import React from "react";
import { StyleSheet, Text, View } from "react-native";
import MapView from "react-native-maps";

import useHeatmapPolling from "../../hooks/HooksAdmin/MapaAlerta/useHeatmapPolling";
import HeatmapLayerCustom from "../../components/ComponentsAdmin/MapaAlertas/HeatmapLayerCustom";

const BASE_URL = "http://192.168.18.5:8000/api";

const centerLosOlivos = {
    latitude: -11.9577,
    longitude: -77.0622,
};

export default function MapadeAlertas() {
    const bbox = "-12.1,-77.2,-11.8,-76.9";

    const { points, loading, byStatus } = useHeatmapPolling({
        baseUrl: BASE_URL,
        intervalMs: 10000,
        daysWindow: 14,
        params: { escala_min: 1, escala_max: 3, bbox },
    });

    const legend = [
        { label: "Pendiente", color: "#ff4d4f" },
        { label: "En proceso", color: "#3d7eff" },
    ];

    return (
        <View style={{ flex: 1 }}>
            {/* LEYENDA */}
            <View style={styles.legendContainer}>
                <Text style={styles.legendTitle}>Estados</Text>
                {legend.map((i) => (
                    <View key={i.label} style={styles.legendItem}>
                        <View style={[styles.colorBox, { backgroundColor: i.color }]} />
                        <Text style={styles.legendText}>{i.label}</Text>
                        <Text style={styles.legendCount}>{byStatus[i.label] ?? 0}</Text>
                    </View>
                ))}
            </View>

            {/* MAPA */}
            <MapView
                style={{ flex: 1 }}
                initialRegion={{
                    ...centerLosOlivos,
                    latitudeDelta: 0.04,
                    longitudeDelta: 0.04,
                }}
            >
                {!loading && points.length > 0 && <HeatmapLayerCustom points={points} />}
            </MapView>
        </View>
    );
}

const styles = StyleSheet.create({
    legendContainer: {
        position: "absolute",
        top: 10,
        right: 10,
        backgroundColor: "rgba(255,255,255,0.9)",
        borderRadius: 10,
        padding: 10,
        zIndex: 999,
        elevation: 6,
    },
    legendTitle: { fontSize: 14, fontWeight: "bold", marginBottom: 6 },
    legendItem: { flexDirection: "row", alignItems: "center", marginBottom: 4 },
    colorBox: { width: 12, height: 12, borderRadius: 2, marginRight: 6 },
    legendText: { flex: 1, fontSize: 13 },
    legendCount: { opacity: 0.7, fontSize: 13 },
});
