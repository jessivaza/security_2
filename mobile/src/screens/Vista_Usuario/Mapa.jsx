import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";

const { width } = Dimensions.get("window");
const mapHeight = 350;

const COLORS = {
  mapBackground: "#a2d2ff",
  mapRoads: "#f5f5f5",
  danger: "#ff6b6b",
  secondary: "#ff9f43",
  primary: "#1a237e",
  white: "#fff",
};

const MapScreen = ({ data }) => {
  const activeIncidences = data.filter(i => i.estado !== "Resuelta");

  const getMarkerStyle = (lat, lon, index) => ({
    position: "absolute",
    top: Math.random() * (mapHeight - 50),
    left: Math.random() * (width - 50),
    zIndex: 10,
  });

  return (
    <View style={[styles.mapContainer, { height: mapHeight }]}>
      <Text style={styles.mapTextOverlay}>Google Maps (Simulado)</Text>

      {activeIncidences.map((inc, index) => (
        <TouchableOpacity
          key={inc.id}
          style={getMarkerStyle(inc.coords.lat, inc.coords.lon, index)}
          onPress={() => Alert.alert("Incidencia Activa", `${inc.nombre} - Prioridad ${inc.prioridad}`)}
        >
          <Ionicons
            name="pin"
            size={30}
            color={inc.prioridad === "Alta" ? COLORS.danger : COLORS.secondary}
          />
          <Text style={styles.markerLabel}>{inc.usuario.initials}</Text>
        </TouchableOpacity>
      ))}

      {/* Simulación de carreteras */}
      <View style={styles.mapRoad1} />
      <View style={styles.mapRoad2} />
    </View>
  );
};

const styles = StyleSheet.create({
  mapContainer: {
    backgroundColor: COLORS.mapBackground,
    borderRadius: 12,
    margin: 20,
    overflow: "hidden",
    position: "relative",
    borderWidth: 1,
    borderColor: "#E0E0E0",
    justifyContent: "center",
    alignItems: "center",
  },
  mapTextOverlay: {
    position: "absolute",
    top: 10,
    left: 10,
    fontSize: 12,
    color: COLORS.primary,
    opacity: 0.6,
    fontWeight: "bold",
  },
  mapRoad1: {
    position: "absolute",
    height: 8,
    width: "80%",
    backgroundColor: COLORS.mapRoads,
    borderRadius: 4,
    transform: [{ rotate: "10deg" }],
    top: "30%",
  },
  mapRoad2: {
    position: "absolute",
    height: 8,
    width: "50%",
    backgroundColor: COLORS.mapRoads,
    borderRadius: 4,
    transform: [{ rotate: "-45deg" }],
    left: "10%",
    top: "65%",
  },
  markerLabel: {
    backgroundColor: COLORS.white,
    borderRadius: 5,
    paddingHorizontal: 5,
    paddingVertical: 2,
    fontSize: 10,
    fontWeight: "bold",
    color: "#333",
    marginTop: -10,
    maxWidth: 50,
    textAlign: "center",
  },
});

export default MapScreen;
