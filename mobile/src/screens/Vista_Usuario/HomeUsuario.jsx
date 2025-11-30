import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  Platform,
  Dimensions,
  StatusBar,
  Alert,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Image,
} from "react-native";
import * as Location from "expo-location";
import * as ImagePicker from "expo-image-picker";
// ASUMIMOS que styles, COLORS, TAB_ITEMS están definidos correctamente
import { styles, COLORS, TAB_ITEMS } from "../../Styles/homeStyles.js";
import MapScreen from "./Mapa.jsx";
import { Ionicons } from "@expo/vector-icons";
import ExcelJS from "exceljs";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";

// === Importación para la Solución del 401 ===
import AsyncStorage from '@react-native-async-storage/async-storage'; 
// ===========================================

// --- URL de la API ---
const API_BASE_URL = "http://192.168.18.248:8000/api";
const INCIDENT_REGISTER_ENDPOINT = `${API_BASE_URL}/registrar-incidente/`;

// --- Constantes de Incidente ---
const INCIDENT_TYPES = {
  "Seleccione un incidente...": "No determinado",
  "Robo en tienda": "Alta",
  "Accidente vial": "Media", // Añadido para mejor ejemplo
  "Fuga de agua": "Baja", // Añadido para mejor ejemplo
  "Otro (especifique)": "Pendiente",
};
const INCIDENT_OPTIONS = Object.keys(INCIDENT_TYPES);
const { width } = Dimensions.get("window");
const CARD_WIDTH = width * 0.5;

// ---------- Helpers ----------
const priorityToScaleNumber = (priorityText) => {
  switch (priorityText) {
    case "Alta":
      return 3;
    case "Media":
      return 2;
    case "Baja":
      return 1;
    case "Pendiente":
    default:
      return 4;
  }
};

const getMimeType = (uri) => {
  // Función mejorada para obtener MIME type
  try {
    const filename = uri.split("/").pop();
    const extMatch = /\.(\w+)$/.exec(filename);
    const ext = extMatch ? extMatch[1].toLowerCase() : "";
    if (["mp4", "mov", "m4v"].includes(ext)) return "video/mp4";
    if (["jpg", "jpeg"].includes(ext)) return "image/jpeg";
    if (ext === "png") return "image/png";
    if (ext === "gif") return "image/gif";
    return ext ? `image/${ext}` : "application/octet-stream";
  } catch (e) {
    return "application/octet-stream";
  }
};

// helper: convertir ArrayBuffer a Base64 (para ExcelJS)
const arrayBufferToBase64 = (buffer) => {
  let binary = "";
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  if (typeof global.btoa === "function") {
    return global.btoa(binary);
  } else if (typeof btoa === "function") {
    return btoa(binary);
  } else {
    if (typeof Buffer !== "undefined") {
      return Buffer.from(bytes).toString("base64");
    }
    throw new Error("No se pudo convertir a base64: falta btoa/Buffer");
  }
};

// ---------- Header, Cards, etc. (SIN CAMBIOS Mayores) ----------
const Header = ({ userName, onLogout }) => (
  <View style={styles.headerContainer}>
    <View>
      <Text style={styles.greetingText}>Hello,</Text>
      <Text style={styles.userNameText}>{userName}!</Text>
    </View>
    <View style={styles.headerIcons}>
      <TouchableOpacity style={styles.headerIconButton}>
        <Ionicons name="search-outline" size={24} color={COLORS.textDark} />
      </TouchableOpacity>
      <TouchableOpacity style={styles.headerIconButton}>
        <Ionicons name="notifications-outline" size={24} color={COLORS.textDark} />
        <View style={styles.notificationBadge} />
      </TouchableOpacity>
      <TouchableOpacity style={styles.headerIconButton} onPress={onLogout}>
        <Ionicons name="log-out-outline" size={24} color={COLORS.danger} />
      </TouchableOpacity>
    </View>
  </View>
);

const PendingIncidenceCard = ({ item }) => {
  const iconName = item.icono || "alert-circle";
  const title = item.nombre;
  const priority = item.prioridad;
  const daysLeft = Math.floor(Math.random() * 5 + 1);
  const priorityColor = priority === "Alta" ? COLORS.danger : COLORS.secondary;

  return (
    <View style={[styles.pendingCard, { backgroundColor: COLORS.darkPrimary }]}>
      <View style={styles.pendingIconBg}>
        <Ionicons name={iconName} size={24} color={COLORS.primary} />
      </View>
      <Text style={styles.pendingTitle} numberOfLines={1}>
        {title}
      </Text>
      <Text style={[styles.pendingPriority, { color: priorityColor }]}>
        {priority} • {daysLeft} días activo
      </Text>
      <TouchableOpacity style={styles.pendingOptions}>
        <Ionicons name="ellipsis-vertical" size={18} color={COLORS.white} />
      </TouchableOpacity>
    </View>
  );
};

const ResolvedIncidenceCard = ({ item }) => {
  const iconName = item.icono || "checkmark-circle";
  const date = item.fecha;
  const time = item.hora;
  const userInitials = item.usuario.initials || "";
  const status = item.estado === "Resuelta" ? "Finalizada" : "En Proceso";
  const isResolved = item.estado === "Resuelta";
  const impactColor = isResolved ? COLORS.success : COLORS.warning;

  return (
    <View style={styles.resolvedCard}>
      <View style={[styles.resolvedIconBg, { backgroundColor: isResolved ? "#e8f5e9" : "#fffde7" }]}>
        <Ionicons name={iconName} size={22} color={COLORS.primary} />
      </View>

      <View style={styles.resolvedDetails}>
        <Text style={styles.resolvedTitle}>{item.nombre}</Text>
        <Text style={styles.resolvedDate}>
          {date}, {time}
        </Text>
      </View>

      <View style={styles.resolvedValueContainer}>
        <Text style={[styles.resolvedValue, { color: impactColor }]}>{status}</Text>
        <Text style={styles.resolvedUser}>{userInitials}</Text>
      </View>
    </View>
  );
};

// ... StatCard ...

// ---------- CreateIncidenceModal (SIN CAMBIOS Mayores) ----------
const CreateIncidenceModal = ({ isVisible, onClose, onSave }) => {
  const [currentLocation, setCurrentLocation] = useState("Obteniendo ubicación...");
  const [coords, setCoords] = useState(null);
  const [selectedIncident, setSelectedIncident] = useState(INCIDENT_OPTIONS[0]);
  const [description, setDescription] = useState("");
  const [attachments, setAttachments] = useState([]); // { uri, name, type }
  const [scale, setScale] = useState(INCIDENT_TYPES[INCIDENT_OPTIONS[0]]);
  const [isPickerVisible, setIsPickerVisible] = useState(false);
  const [previewUri, setPreviewUri] = useState(null);
  const [customIncident, setCustomIncident] = useState("");

  useEffect(() => {
    // ... Lógica de obtención de ubicación (sin cambios)
    if (!isVisible) {
      // reset local state al cerrar modal
      setCurrentLocation("Obteniendo ubicación...");
      setCoords(null);
      setPreviewUri(null);
      setCustomIncident("");
      setAttachments([]);
      setDescription("");
      setSelectedIncident(INCIDENT_OPTIONS[0]);
      setScale(INCIDENT_TYPES[INCIDENT_OPTIONS[0]]);
      return;
    }

    (async () => {
      // Pedir permisos y obtener ubicación
      // ... (Lógica de ubicación omitida por longitud)
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setCurrentLocation("Permiso de ubicación denegado.");
        return;
      }
      try {
        let location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
        const { latitude, longitude } = location.coords;
        setCoords({ lat: latitude, lon: longitude });

        const geocoded = await Location.reverseGeocodeAsync({ latitude, longitude });

        if (geocoded.length > 0) {
          const address = geocoded[0];
          const fullAddress = `${address.street || "Calle Desconocida"} ${address.name || ""}, ${
            address.city || address.region || "Región Desconocida"
          }`;
          setCurrentLocation(fullAddress.replace(/,\s*,/g, ",").trim());
        } else {
          setCurrentLocation(`Ubicación: Lat ${latitude.toFixed(4)}, Lon ${longitude.toFixed(4)}`);
        }
      } catch (error) {
        setCurrentLocation("No se pudo obtener la ubicación (Error GPS/Red).");
      }
    })();
  }, [isVisible]);

  // ... saveAttachment, handleCaptureMedia (sin cambios)
  const saveAttachment = (uri, type) => {
    const filename = uri.split("/").pop();
    const newAttachment = {
      name: `${type === "image" ? "Foto" : "Video"} - ${new Date().toLocaleTimeString()}`,
      uri,
      type,
      filename,
    };
    setAttachments([newAttachment]);
    setPreviewUri(uri);
    Alert.alert("Éxito", `${newAttachment.name} adjuntado.`);
  };

  const handleCaptureMedia = async () => {
    const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
    if (cameraPermission.status !== "granted") {
      Alert.alert("Error", "Necesitas permiso de cámara para capturar evidencia.");
      return;
    }

    Alert.alert("Capturar Evidencia", "¿Deseas capturar una foto o un video?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Tomar Foto",
        onPress: async () => {
          const pickerResult = await ImagePicker.launchCameraAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: false,
            quality: 0.6,
          });
          if (!pickerResult.canceled && pickerResult.assets && pickerResult.assets.length > 0) {
            saveAttachment(pickerResult.assets[0].uri, "image");
          }
        },
      },
      {
        text: "Grabar Video",
        onPress: async () => {
          const pickerResult = await ImagePicker.launchCameraAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Videos,
            allowsEditing: false,
            quality: 0.6,
            maxDuration: 15,
          });
          if (!pickerResult.canceled && pickerResult.assets && pickerResult.assets.length > 0) {
            saveAttachment(pickerResult.assets[0].uri, "video");
          }
        },
      },
    ]);
  };

  const handleSave = () => {
    const finalIncidentName =
      selectedIncident === "Otro (especifique)" ? customIncident.trim() : selectedIncident;

    if (finalIncidentName === INCIDENT_OPTIONS[0] || !coords || (selectedIncident === "Otro (especifique)" && !finalIncidentName)) {
      Alert.alert("Campos Requeridos", "Selecciona/especifica el incidente y asegúrate de tener ubicación GPS.");
      return;
    }

    const newIncidence = {
      nombre: finalIncidentName,
      descripcion: description || "No determinado",
      prioridad: scale,
      coords,
      locationName: currentLocation,
      attachments,
    };

    onSave(newIncidence);
  };

  const handleIncidentChange = (incident) => {
    setSelectedIncident(incident);
    setScale(INCIDENT_TYPES[incident] || INCIDENT_TYPES["Otro (especifique)"]);
    setIsPickerVisible(false);
    if (incident !== "Otro (especifique)") setCustomIncident("");
  };

  const getScaleColor = (currentScale) => {
    if (currentScale === "Alta") return COLORS.danger;
    if (currentScale === "Media") return COLORS.secondary;
    return COLORS.primary;
  };

  const showCustomIncidentInput = selectedIncident === "Otro (especifique)";

  if (!isVisible) return null;

  return (
    <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <View style={styles.modalContainer}>
        <View style={styles.modalHeaderSimplified}>
          <Text style={styles.modalTitleSimplified}>Registrar Incidente</Text>
        </View>

        <ScrollView style={styles.modalBody}>
          <TextInput
            style={[styles.textInput, styles.locationInput, { fontWeight: "600" }]}
            value={currentLocation}
            editable={false}
            placeholderTextColor={COLORS.textDark}
            multiline
            numberOfLines={2}
          />

          <TouchableOpacity style={[styles.dropdownInput, isPickerVisible && styles.dropdownInputActive]} onPress={() => setIsPickerVisible((p) => !p)}>
            <Text style={[styles.dropdownText, selectedIncident === INCIDENT_OPTIONS[0] && { color: COLORS.textLight }]}>{selectedIncident}</Text>
            <Ionicons name={isPickerVisible ? "chevron-up" : "chevron-down"} size={20} color={COLORS.primary} style={styles.dropdownIcon} />
          </TouchableOpacity>

          {isPickerVisible && (
            <View style={styles.pickerOptionsContainer}>
              {INCIDENT_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option}
                  style={[styles.pickerOption, selectedIncident === option && styles.pickerOptionSelected]}
                  onPress={() => handleIncidentChange(option)}
                >
                  <Text style={styles.pickerOptionText}>{option}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {showCustomIncidentInput && (
            <TextInput
              style={[styles.textInput, { marginTop: 10 }]}
              value={customIncident}
              onChangeText={setCustomIncident}
              placeholder="Especifique el tipo de incidente aquí..."
              placeholderTextColor={COLORS.textLight}
              autoCapitalize="sentences"
            />
          )}

          <TextInput
            style={[styles.textInput, { height: 80, textAlignVertical: "top", marginTop: showCustomIncidentInput ? 10 : 15 }]}
            value={description}
            onChangeText={setDescription}
            placeholder="Descripción (opcional)"
            placeholderTextColor={COLORS.textLight}
            autoCapitalize="none"
            multiline
          />
          <Text style={styles.descriptionHint}>Si no escribes una descripción, se guardará como "No determinado"</Text>

          <Text style={[styles.scaleText, { color: getScaleColor(scale) }]}>Escala: {scale}</Text>

          <View style={styles.fileSelectorContainer}>
            <TouchableOpacity style={styles.fileSelectButton} onPress={handleCaptureMedia}>
              <Text style={styles.fileSelectButtonText}>Capturar Evidencia</Text>
            </TouchableOpacity>
            <Text style={styles.fileStatusText}>{attachments.length > 0 ? `Última evidencia: ${attachments[0].name}` : "Sin archivos seleccionados"}</Text>
          </View>

          {previewUri && (
            <View style={[styles.attachmentsList, { marginTop: 15 }]}>
              <Text style={{ fontWeight: "bold", color: COLORS.textDark }}>Última Evidencia Capturada:</Text>
              {attachments[0].type === 'image' ? (
                <Image source={{ uri: previewUri }} style={{ width: "100%", height: 150, borderRadius: 8, marginTop: 10 }} resizeMode="cover" />
              ) : (
                <View style={{ height: 150, backgroundColor: COLORS.inactive, borderRadius: 8, marginTop: 10, justifyContent: 'center', alignItems: 'center' }}>
                  <Ionicons name="videocam-outline" size={50} color={COLORS.white} />
                  <Text style={{ color: COLORS.white }}>Vista previa de video no disponible</Text>
                </View>
              )}
            </View>
          )}
        </ScrollView>

        <View style={styles.modalFooterButtons}>
          <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={onClose}>
            <Text style={styles.cancelButtonText}>Cancelar</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.button, styles.saveButton]} onPress={handleSave}>
            <Text style={styles.saveButtonText}>Guardar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

// ---------- Main Component ----------
export default function UserHome() {
  const [activeTab, setActiveTab] = useState("principal");
  const [data, setData] = useState([]);
  const [userName, setUserName] = useState("Jessica Vazallo");
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [authToken, setAuthToken] = useState(null); // Corregido: Inicializado como null
  
  // Agregamos lógica para cargar el token al inicio
  useEffect(() => {
    const loadToken = async () => {
      try {
        const token = await AsyncStorage.getItem('access');
        if (token) {
          setAuthToken(`Bearer ${token}`); // Formato JWT Bearer
        } else {
          setAuthToken(null);
          // Opcional: Redirigir al Login si no hay token al cargar el home
          // onLogout(); 
        }
      } catch (e) {
        console.error("Error al cargar token:", e);
      }
    };

    loadToken();
    
    // Datos de ejemplo para la UI
    setData([
      { id: 1, nombre: "Robo en tienda", fecha: "2025-11-18", hora: "11:03", estado: "Pendiente", prioridad: "Alta", usuario: { name: "Juan Pérez", initials: "JP" }, icono: "storefront-outline", coords: { lat: -12.046, lon: -77.043 } },
      { id: 2, nombre: "Accidente vial", fecha: "2025-11-17", hora: "09:15", estado: "Resuelta", prioridad: "Media", usuario: { name: "María García", initials: "MG" }, icono: "car-outline", coords: { lat: -12.080, lon: -77.060 } },
      { id: 3, nombre: "Incendio en edificio", fecha: "2025-11-16", hora: "22:48", estado: "En proceso", prioridad: "Alta", usuario: { name: "Carlos Ruiz", initials: "CR" }, icono: "flame-outline", coords: { lat: -12.050, lon: -77.025 } },
      { id: 4, nombre: "Fuga de agua", fecha: "2025-11-15", hora: "14:30", estado: "Resuelta", prioridad: "Baja", usuario: { name: "Luis Gómez", initials: "LG" }, icono: "water-outline", coords: { lat: -12.072, lon: -77.051 } },
      { id: 5, nombre: "Vandalismo", fecha: "2025-11-18", hora: "01:10", estado: "Pendiente", prioridad: "Media", usuario: { name: "Ana López", initials: "AL" }, icono: "trash-outline", coords: { lat: -12.060, lon: -77.040 } },
    ]);
  }, []);

  const handleLogout = useCallback(async () => {
    Alert.alert("Cerrar Sesión", "¿Estás segura de que quieres cerrar tu sesión actual?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Sí, Cerrar Sesión",
        onPress: async () => {
          try {
             // 1. Limpiar los tokens de AsyncStorage (para forzar el logout)
             await AsyncStorage.multiRemove(['access', 'refresh', 'idUsuario', 'role', 'username', 'email']);
             
             // 2. Resetear el estado de la aplicación (esto debe redirigir al Login)
             // Nota: Si usas context, llama a la función de logout del context aquí.
             setAuthToken(null); 
             Alert.alert("Sesión Cerrada", "Tokens eliminados. Redirigiendo al inicio.");
             // Si estás usando `setUserType(null)` desde App.js, necesitas pasar esa función. 
             // Aquí, la simulación depende de cómo `UserHome` maneja la navegación.
             
          } catch (e) {
             Alert.alert("Error de Logout", "Hubo un problema al limpiar los datos locales.");
          }
        },
        style: "destructive",
      },
    ]);
  }, []);
  
  // ============== FUNCIÓN PARA PRUEBA ESTÁTICA ==================
  const handleSaveStaticTest = useCallback(
    async () => {
      const STATIC_INCIDENCE_DATA = {
        nombre: "PRUEBA ESTATICA: Falla de Servidor",
        descripcion: "Test para verificar conexión y autenticación (401). Prioridad Baja.",
        prioridad: "Baja",
        coords: { lat: -12.0463, lon: -77.0428 }, // Coordenadas estáticas (p. ej., Lima, Perú)
        locationName: "Dirección de Prueba: Av. Garcilaso de la Vega 1234, Lima",
        attachments: [], // Sin archivos adjuntos para simplificar la prueba
      };
      
      // Reusa la lógica principal de guardado para la prueba
      await handleSaveIncidence(STATIC_INCIDENCE_DATA);

    },
    [handleSaveIncidence]
  );
 
const handleSaveIncidence = useCallback(
    async (newIncidence) => {
      if (!authToken) {
        Alert.alert("Error de Sesión", "No estás autenticado. Por favor, inicia sesión de nuevo.");
        setIsModalVisible(false);
        return;
      }

      const { nombre, descripcion, prioridad, coords, locationName, attachments } = newIncidence;
      const scaleNumber = priorityToScaleNumber(prioridad);
      const attachment = attachments.length > 0 ? attachments[0] : null;

      const formData = new FormData();
      formData.append("NombreIncidente", nombre); 
      formData.append("Descripcion", descripcion || "No determinado"); 
      formData.append("Ubicacion", locationName || "Ubicación desconocida"); 
      formData.append("escala", scaleNumber.toString()); 
      
      if (coords && coords.lat && coords.lon) {
        formData.append("Latitud", coords.lat.toString()); 
        formData.append("Longitud", coords.lon.toString()); 
      }
      
      if (attachment && attachment.uri) {
        formData.append("archivo", { 
          uri: attachment.uri,
          name: attachment.filename || "evidence.jpg",
          type: getMimeType(attachment.uri),
        });
      }

      try {
        setIsModalVisible(false);

        const headers = {
          "Authorization": authToken,
        };

        const response = await fetch(INCIDENT_REGISTER_ENDPOINT, {
          method: "POST",
          headers,
          body: formData,
        });
 
        let responseData = null;
        try {
          const text = await response.text();
          if (text) {
             responseData = JSON.parse(text);
          }
        } catch (e) {
          console.log("No se pudo parsear JSON:", e);
        }

        if (response.ok) {
          Alert.alert("Éxito 🎉", `Incidente (${nombre}) registrado. Tu reporte está siendo procesado.`);
                           
          // ===============================================
          // === CAMBIO PRINCIPAL: Agregar incidencia a la lista local ===
          // ===============================================
          
          // Obtener fecha y hora actuales en formato local
          const now = new Date();
          const dateString = now.toISOString().slice(0, 10); // YYYY-MM-DD
          const timeString = now.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', second: '2-digit' }); // HH:MM:SS
          
          // Crear el objeto de incidencia local (simulando la estructura del backend)
          // Asumimos un ID temporal (negativo para evitar colisiones con IDs existentes)
          const newLocalIncidence = {
            id: Date.now() * -1, // ID temporal negativo
            nombre: nombre,
            fecha: dateString,
            hora: timeString,
            estado: "Pendiente", // La nueva incidencia siempre comienza como Pendiente/En Proceso
            prioridad: prioridad, 
            usuario: { name: userName, initials: userName.split(' ').map(n => n[0]).join('') || 'US' }, // Usar el userName del estado
            icono: "alert-circle-outline", // Icono por defecto
            coords: coords,
          };
          
          // Añadir la nueva incidencia al inicio del array `data`
          setData(currentData => [newLocalIncidence, ...currentData]);
          
          // ===============================================
          // === FIN DE CAMBIO PRINCIPAL ===
          // ===============================================
          
        } else if (response.status === 401 || response.status === 403) {
           Alert.alert("Error de Sesión 🛑", "Tu sesión ha expirado o no tienes permisos. Por favor, inicia sesión de nuevo.");
           await AsyncStorage.multiRemove(['access', 'refresh']);
           setAuthToken(null); 
           
        } else {
          const errorMessage = (responseData && (responseData.detail || responseData.message || responseData.error || JSON.stringify(responseData))) || `Código ${response.status}`;
          Alert.alert("Error de API 🚨", `No se pudo registrar. Mensaje del servidor: ${errorMessage}`);
        }
      } catch (error) {
        console.error("Error de conexión:", error);
        Alert.alert("Error de Conexión ❌", "No se pudo conectar con el servidor. Revisa la URL o la red.");
      }
    },
    [userName, authToken]
);

  const filteredData = data; 
  const exportToExcel = async () => { /* ... */ };

  const renderActiveScreen = useCallback(() => {
   
    const totalIncidencias = data.length;
    const pendientes = data.filter((i) => i.estado === "Pendiente" || i.estado === "En proceso");

    switch (activeTab) {
      case "principal":
        return (
          <ScrollView contentContainerStyle={{ paddingBottom: 150 }}>
            <View style={styles.summaryCard}>
              <View>
                <Text style={styles.summaryTitle}>Incidencias Totales</Text>
                <Text style={styles.summaryValue}>{totalIncidencias}</Text>
              </View>
              <TouchableOpacity style={styles.summaryAddButton} onPress={() => setIsModalVisible(true)}>
                <Ionicons name="add" size={24} color={COLORS.darkPrimary} />
              </TouchableOpacity>
            </View>

            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>Incidencias Pendientes ({pendientes.length})</Text>
              <TouchableOpacity onPress={() => setActiveTab("mapa")}>
                <Text style={styles.seeAllText}>Ver Mapa</Text>
              </TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pendingScroll}>
              {pendientes.length > 0 ? pendientes.map((inc) => <PendingIncidenceCard key={inc.id} item={inc} />) : <Text style={styles.noDataText}>🎉 ¡No hay incidencias pendientes!</Text>}
            </ScrollView>

            <View style={[styles.sectionContainer, { marginTop: 25 }]}>
              <Text style={styles.sectionTitle}>Incidencias Recientes</Text>
              <TouchableOpacity onPress={() => setActiveTab("mapa")}>
                <Text style={styles.seeAllText}>Ver todas</Text>
              </TouchableOpacity>
            </View>
            <View style={{ marginBottom: 10 }}>
              {data.slice(0, 5).map((inc) => ( // Cambiado a slice(0, 5) para mostrar las más recientes
                <ResolvedIncidenceCard key={inc.id} item={inc} />
              ))}
            </View>
          </ScrollView>
        );
      case "mapa":
        return <MapScreen data={data} />;
      case "crear":
        return <View />;
      case "alertas":
        return <View />;
      case "perfil":
        return (
          <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
            <View style={styles.profileContainer}>
              <Text style={styles.profileTitle}>👤 Perfil de Usuario</Text>
              <Text style={styles.profileText}>Nombre: {userName}</Text>
              <Text style={styles.profileText}>ID: 123456</Text>
              <Text style={styles.profileText}>Rol: Supervisor/Reportero</Text>
            </View>

            
            <TouchableOpacity style={[styles.button, styles.logoutButton]} onPress={handleLogout}>
              <Ionicons name="log-out-outline" size={20} color={COLORS.white} />
              <Text style={[styles.buttonText, { marginLeft: 10 }]}>Cerrar Sesión</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.button, styles.exportButton]} onPress={exportToExcel}>
              <Ionicons name="download-outline" size={20} color={COLORS.textDark} />
              <Text style={[styles.buttonText, { marginLeft: 10, color: COLORS.textDark }]}>Exportar Reporte (Excel)</Text>
            </TouchableOpacity>
          </ScrollView>
        );
      default:
        return null;
    }
  }, [activeTab, data, userName, handleLogout]); // Eliminamos handleSaveStaticTest de las dependencias si no se usa

  const handleTabPress = (tabId) => {
    if (tabId === "crear") {
      setIsModalVisible(true);
    } else {
      setActiveTab(tabId);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
      <Header userName={userName} onLogout={handleLogout} />
      <View style={styles.contentContainer}>{renderActiveScreen()}</View>

      <CurvedBottomBar activeTab={activeTab} onTabPress={handleTabPress} />

      <CreateIncidenceModal isVisible={isModalVisible} onClose={() => setIsModalVisible(false)} onSave={handleSaveIncidence} />
    </SafeAreaView>
  );
}

// ... CurvedBottomBar (sin cambios)
const CurvedBottomBar = ({ activeTab, onTabPress }) => {
    return (
      <View style={styles.tabBarContainerNew}>
        <View style={styles.tabRowNew}>
          {TAB_ITEMS.map((tab) => {
            const IconComp = tab.iconType || Ionicons; 
            const isActive = tab.id === activeTab;
            const isCenter = tab.id === "crear";

            if (isCenter) {
              return (
                <View key={tab.id} style={styles.centerButtonWrapperNew}>
                  <TouchableOpacity onPress={() => onTabPress(tab.id)} style={styles.centerButtonNew}>
                    <Ionicons name={"add-sharp"} size={32} color={COLORS.white} />
                  </TouchableOpacity>
                </View>
              );
            }

            return (
              <TouchableOpacity key={tab.id} onPress={() => onTabPress(tab.id)} style={styles.tabButtonNew}>
                <IconComp name={isActive ? tab.activeIcon : tab.icon} size={24} color={isActive ? COLORS.primary : COLORS.inactive} />
                <Text style={[styles.tabLabelNew, isActive ? { color: COLORS.primary } : { color: COLORS.inactive }]}>{tab.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  };