import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Modal,
  TextInput,
  TouchableOpacity,
  FlatList,
  Alert,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";

// Tus componentes
import Header from "../../components/ComponentsUser/Header";
import StatCard from "../../components/ComponentsUser/StatCard";
import PendingIncidenceCard from "../../components/ComponentsUser/PendingIncidenceCard";
import ResolvedIncidenceCard from "../../components/ComponentsUser/ResolvedIncidenceCard";
import CurvedBottomBar from "../../components/ComponentsUser/CurvedBottomBar";
import MapScreen from "./Mapa";

export default function HomeUsuario() {
  const [data, setData] = useState([]);
  const [activeTab, setActiveTab] = useState("principal");
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [userName, setUserName] = useState("Usuario");

  // Campos del modal
  const [title, setTitle] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [location, setLocation] = useState("Ubicación automática activada");
  const [prioridad, setPrioridad] = useState("Alta");
  const [attachments, setAttachments] = useState([]);

  // Obtener usuario
  useEffect(() => {
    const loadUser = async () => {
      const name = await AsyncStorage.getItem("username");
      if (name) setUserName(name);
    };
    loadUser();
  }, []);

  // Agregar adjunto (simulado)
  const handleAddAttachment = () => {
    const newAttachment = {
      id: Date.now(),
      name: "Archivo adjuntado",
    };
    setAttachments((prev) => [...prev, newAttachment]);
  };

  // Guardar incidencia
  const handleSaveIncidence = () => {
    if (!title || !descripcion) {
      Alert.alert("Campos requeridos", "Complete título y descripción.");
      return;
    }

    const date = new Date();

    const newInc = {
      id: Date.now(),
      nombre: title,
      descripcion,
      location,
      fecha: date.toISOString().split("T")[0],
      hora: date.toTimeString().slice(0, 5),
      estado: "Pendiente",
      prioridad,
      attachments,
      usuario: { name: userName, initials: userName.charAt(0) },
    };

    setData((prev) => [newInc, ...prev]);

    closeModal();
  };

  // Cerrar modal y reiniciar campos
  const closeModal = () => {
    setIsModalVisible(false);
    setTitle("");
    setDescripcion("");
    setLocation("Ubicación automática activada");
    setPrioridad("Alta");
    setAttachments([]);
  };

  // Estadísticas
  const stats = useMemo(() => {
    return [
      { label: "Pendientes", value: data.filter((i) => i.estado === "Pendiente").length, color: "#ff5252" },
      { label: "En Proceso", value: data.filter((i) => i.estado === "En Proceso").length, color: "#ffa726" },
      { label: "Resueltas", value: data.filter((i) => i.estado === "Resuelto").length, color: "#66bb6a" },
    ];
  }, [data]);

  // Renderizar pantallas por tab
  const renderScreen = () => {
    switch (activeTab) {
      case "principal":
        return (
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Estadísticas */}
            <Text className="text-xl font-bold mt-4">Estadísticas</Text>
            <View className="flex-row justify-between mt-3">
              {stats.map((s, i) => (
                <StatCard key={i} label={s.label} value={s.value} color={s.color} />
              ))}
            </View>

            {/* Pendientes */}
            <Text className="text-xl font-bold mt-6">Incidencias Pendientes</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mt-2">
              {data
                .filter((i) => i.estado === "Pendiente")
                .map((item) => (
                  <PendingIncidenceCard key={item.id} item={item} />
                ))}
            </ScrollView>

            {/* Resueltas */}
            <Text className="text-xl font-bold mt-6">Incidencias Resueltas</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mt-2">
              {data
                .filter((i) => i.estado === "Resuelto")
                .map((item) => (
                  <ResolvedIncidenceCard key={item.id} item={item} />
                ))}
            </ScrollView>
          </ScrollView>
        );

      case "mapa":
        return <MapScreen />;

      default:
        return null;
    }
  };

  return (
    <SafeAreaView className="flex-1 p-4">
      <StatusBar barStyle="dark-content" />

      {/* HEADER */}
      <Header userName={userName} />

      {/* CONTENIDO PRINCIPAL */}
      <View className="flex-1">{renderScreen()}</View>

      {/* BOTÓN Y BARRA */}
      <CurvedBottomBar
        activeTab={activeTab}
        onTabChange={(tab) => {
          if (tab === "crear") {
            setIsModalVisible(true);
          } else {
            setActiveTab(tab);
          }
        }}
      />

      {/* MODAL PARA CREAR INCIDENCIA */}
      <Modal visible={isModalVisible} animationType="slide" transparent>
        <View className="flex-1 bg-black/40 justify-center p-5">
          <View className="bg-white p-5 rounded-2xl">
            <Text className="text-xl font-bold mb-3">Nueva Incidencia</Text>

            {/* Título */}
            <Text className="font-semibold">Título *</Text>
            <TextInput
              className="border p-2 mt-1 rounded-lg"
              placeholder="Escribe un título..."
              value={title}
              onChangeText={setTitle}
            />

            {/* Descripción */}
            <Text className="font-semibold mt-3">Descripción *</Text>
            <TextInput
              className="border p-2 mt-1 rounded-lg h-20"
              placeholder="Describe la incidencia..."
              value={descripcion}
              onChangeText={setDescripcion}
              multiline
            />

            {/* Prioridad */}
            <Text className="font-semibold mt-3">Prioridad</Text>
            <View className="flex-row gap-2 mt-2">
              {["Alta", "Media", "Baja"].map((p) => (
                <TouchableOpacity
                  key={p}
                  className={`px-3 py-1 rounded-xl border ${
                    prioridad === p ? "bg-blue-600 border-blue-600" : "border-gray-400"
                  }`}
                  onPress={() => setPrioridad(p)}
                >
                  <Text className={prioridad === p ? "text-white" : "text-gray-700"}>{p}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Adjuntos */}
            <View className="flex-row justify-between items-center mt-5">
              <Text className="font-semibold">Adjuntos</Text>
              <TouchableOpacity onPress={handleAddAttachment}>
                <Ionicons name="attach" size={24} color="black" />
              </TouchableOpacity>
            </View>

            <FlatList
              data={attachments}
              style={{ maxHeight: 100 }}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => <Text>• {item.name}</Text>}
            />

            {/* BOTONES */}
            <View className="flex-row justify-end mt-5 gap-5">
              <TouchableOpacity onPress={closeModal}>
                <Text className="text-red-600 font-semibold">Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={handleSaveIncidence}>
                <Text className="text-blue-600 font-semibold">Crear</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
