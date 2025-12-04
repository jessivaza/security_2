import React, { useEffect, useState } from "react";
import { StyleSheet, Text, View, ActivityIndicator } from "react-native";
import MapView, { Circle } from "react-native-maps";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";

const BASE_URL = "http://192.168.18.5:8000/api";

const centerLosOlivos = {
  latitude: -11.9577,
  longitude: -77.0622,
};

export default function MapadeAlertas() {
  const [points, setPoints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [byStatus, setByStatus] = useState({});

  const fetchPoints = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem("access");

      const res = await axios.get(`${BASE_URL}/alertas/heatmap/`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      setPoints(res.data.points || []);
      setByStatus(res.data.meta?.by_status || {});
    } catch (error) {
      console.error("Error al cargar incidentes:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPoints();
    const interval = setInterval(fetchPoints, 10000);
    return () => clearInterval(interval);
  }, []);

  const pendientes = points.filter(p => p[3] === "Pendiente");
  const proceso = points.filter(p => p[3] === "En proceso");
  const otros = points.filter(p => p[3] !== "Pendiente" && p[3] !== "En proceso");

  const getRadius = (intensity) => {
    if (!intensity) return 60;
    return 40 + intensity * 120;
  };

  return (
    <View style={{ flex: 1 }}>
      {loading && (
        <ActivityIndicator
          size="large"
          color="#3d7eff"
          style={{ position: "absolute", top: 20, alignSelf: "center", zIndex: 999 }}
        />
      )}

      {/* LEYENDA */}
      <View style={styles.legendContainer}>
        <Text style={styles.legendTitle}>Estados</Text>
        {["Pendiente", "En proceso", "Otros"].map((label) => (
          <View key={label} style={styles.legendItem}>
            <View
              style={[
                styles.colorBox,
                {
                  backgroundColor:
                    label === "Pendiente"
                      ? "#3d7eff"
                      : label === "En proceso"
                      ? "#ff4d4f"
                      : "#999999",
                },
              ]}
            />
            <Text style={styles.legendText}>{label}</Text>
            <Text style={styles.legendCount}>
              {label === "Otros"
                ? points.length - (byStatus["Pendiente"] ?? 0) - (byStatus["En proceso"] ?? 0)
                : byStatus[label] ?? 0}
            </Text>
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
        {pendientes.map((p, idx) => (
          <Circle
            key={"pend-" + idx}
            center={{ latitude: p[0], longitude: p[1] }}
            radius={getRadius(p[2])}
            fillColor="rgba(61, 126, 255, 0.35)"
            strokeColor="transparent"
          />
        ))}

        {proceso.map((p, idx) => (
          <Circle
            key={"proc-" + idx}
            center={{ latitude: p[0], longitude: p[1] }}
            radius={getRadius(p[2])}
            fillColor="rgba(255, 77, 79, 0.35)"
            strokeColor="transparent"
          />
        ))}

        {otros.map((p, idx) => (
          <Circle
            key={"otros-" + idx}
            center={{ latitude: p[0], longitude: p[1] }}
            radius={getRadius(p[2])}
            fillColor="rgba(153, 153, 153, 0.35)"
            strokeColor="transparent"
          />
        ))}
      </MapView>
    </View>
  );
}


const styles = StyleSheet.create({
  legendContainer: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "rgba(255,255,255,0.95)",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 15,
    zIndex: 999,
    elevation: 6,
    width: 135, // ancho suficiente para mostrar nombres completos
  },
  legendTitle: { fontSize: 14, fontWeight: "bold", marginBottom: 6 },
  legendItem: { flexDirection: "row", alignItems: "center", marginBottom: 4 },
  colorBox: { width: 12, height: 12, borderRadius: 2, marginRight: 6 },
  legendText: { flex: 1, fontSize: 13 },
  legendCount: { opacity: 0.7, fontSize: 13, marginLeft: 4 },
});