import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Platform,
  Dimensions,
  StatusBar,
  Alert,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Image, 
}
from "react-native";

// Importaciones requeridas para las nuevas funcionalidades
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker'; 

// Importaciones existentes
import MapScreen from './Mapa.jsx'; 
import { Ionicons } from "@expo/vector-icons";
import ExcelJS from "exceljs";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";

const { width } = Dimensions.get("window");
const CARD_WIDTH = width * 0.4;
const CHART_HEIGHT = 200;

// ===================================================================
// 💡 CONSTANTES Y OPCIONES CENTRALES
const COLORS = {
  primary: "#1a237e", // Azul Noche (Principal)
  secondary: "#ff9f43", // Naranja (para prioridad MEDIA)
  success: "#4caf50", // Verde (para estado Resuelta)
  warning: "#f0ad4e", // Amarillo/Naranja (para estado En Proceso)
  danger: "#ff6b6b", // Rojo (para estado Pendiente y prioridad ALTA)
  inactive: "#999",
  background: "#f5f5f5",
  white: "#ffffff",
  border: "#E0E0E0",
  shadow: "#00000020",
  textDark: "#333",
  textLight: "#666",
  // Nuevo color para fondo oscuro de tarjetas (Azul Noche Oscuro)
  darkPrimary: "#0d124b", 
};

// Opciones de Incidentes y su escala (Prioridad)
const INCIDENT_TYPES = {
    'Seleccione un incidente...': 'No determinado',
    'Robo en tienda': 'Alta',
    'Asalto a persona': 'Alta',
    'Vandalismo': 'Media',
    'Fuga de agua': 'Baja',
    'Incendio': 'Alta',
};
const INCIDENT_OPTIONS = Object.keys(INCIDENT_TYPES);

const TAB_ITEMS = [
  { id: "principal", icon: "home-outline", activeIcon: "home", label: "Inicio", iconType: Ionicons },
  { id: "mapa", icon: "map-outline", activeIcon: "map", label: "Mapa", iconType: Ionicons }, 
  { id: "crear", icon: "add-circle-outline", activeIcon: "add-circle", label: "Crear", iconType: Ionicons },
  { id: "alertas", icon: "alert-circle-outline", activeIcon: "alert-circle", label: "Alertas", iconType: Ionicons },
  { id: "perfil", icon: "person-outline", activeIcon: "person", label: "Perfil", iconType: Ionicons },
];
// ===================================================================

const ScreenPlaceholder = ({ title, children }) => (
  <View style={styles.placeholder}>
    <Text style={styles.placeholderTitle}>{title}</Text>
    {children}
  </View>
);

// 💡 COMPONENTE HEADER CON BOTÓN DE CERRAR SESIÓN AÑADIDO
const Header = ({ userName, onLogout }) => ( // 👈 onLogout ACEPTADO COMO PROP
// ... (código de Header sin cambios)
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
      {/* 👈 BOTÓN DE CERRAR SESIÓN EN LA ESQUINA */}
      <TouchableOpacity style={styles.headerIconButton} onPress={onLogout}> 
        <Ionicons name="log-out-outline" size={24} color={COLORS.danger} />
      </TouchableOpacity>
    </View>
  </View>
);

// --- Componente de Tarjeta de Incidencia Pendiente (Usado en Home) ---
const PendingIncidenceCard = ({ item }) => {
// ... (código de PendingIncidenceCard sin cambios)
    const iconName = item.icono || "alert-circle";
    const title = item.nombre;
    const priority = item.prioridad;
    const daysLeft = Math.floor(Math.random() * 5 + 1);
    const priorityColor = priority === 'Alta' ? COLORS.danger : COLORS.secondary;
    
    return (
        <View style={[styles.pendingCard, { backgroundColor: COLORS.darkPrimary }]}>
            <View style={styles.pendingIconBg}>
                <Ionicons name={iconName} size={24} color={COLORS.primary} />
            </View>
            <Text style={styles.pendingTitle} numberOfLines={1}>{title}</Text>
            <Text style={[styles.pendingPriority, { color: priorityColor }]}>
                {priority} • {daysLeft} días activo
            </Text>
            <TouchableOpacity style={styles.pendingOptions}>
                <Ionicons name="ellipsis-vertical" size={18} color={COLORS.white} />
            </TouchableOpacity>
        </View>
    );
};

// --- Componente de Transacción Reciente (Incidencia Resuelta/En Proceso - Usado en Home) ---
const ResolvedIncidenceCard = ({ item }) => {
// ... (código de ResolvedIncidenceCard sin cambios)
    const iconName = item.icono || "checkmark-circle";
    const date = item.fecha;
    const time = item.hora;
    const userInitials = item.usuario.initials;
    const status = item.estado === 'Resuelta' ? 'Finalizada' : 'En Proceso';
    const isResolved = item.estado === 'Resuelta';
    const impactColor = isResolved ? COLORS.success : COLORS.warning;

    return (
        <View style={styles.resolvedCard}>
            <View style={[styles.resolvedIconBg, { backgroundColor: isResolved ? '#e8f5e9' : '#fffde7' }]}>
                <Ionicons name={iconName} size={22} color={COLORS.primary} />
            </View>
            
            <View style={styles.resolvedDetails}>
                <Text style={styles.resolvedTitle}>{item.nombre}</Text>
                <Text style={styles.resolvedDate}>{date}, {time}</Text>
            </View>

            <View style={styles.resolvedValueContainer}>
                <Text style={[styles.resolvedValue, { color: impactColor }]}>{status}</Text>
                <Text style={styles.resolvedUser}>{userInitials}</Text>
            </View>
        </View>
    );
};

// --- Componente StatCard (Usado en Home y Mapa) ---
const StatCard = ({ title, value, icon, color }) => (
// ... (código de StatCard sin cambios)
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <Ionicons name={icon} size={24} color={color} />
      <Text style={styles.statTitle}>{title}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
);


// --- COMPONENTE MODAL PARA CREAR INCIDENCIA ---
const CreateIncidenceModal = ({ isVisible, onClose, onSave }) => {
    // ⚠️ ATENCIÓN: TODOS LOS HOOKS DEBEN ESTAR AL INICIO E INCONDICIONALMENTE
    const [currentLocation, setCurrentLocation] = useState('Obteniendo ubicación...');
    const [coords, setCoords] = useState(null);
    const [selectedIncident, setSelectedIncident] = useState(INCIDENT_OPTIONS[0]);
    const [description, setDescription] = useState('');
    const [attachments, setAttachments] = useState([]); 
    const [scale, setScale] = useState(INCIDENT_TYPES[INCIDENT_OPTIONS[0]]);
    const [isPickerVisible, setIsPickerVisible] = useState(false); 

    // 💡 EFECTO: Obtener ubicación al abrir el modal (Corregido)
    useEffect(() => {
        // Ejecutamos la lógica SÓLO si el modal está visible.
        if (!isVisible) return; 

        (async () => {
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                setCurrentLocation('Permiso de ubicación denegado.');
                return;
            }

            try {
                let location = await Location.getCurrentPositionAsync({});
                setCoords({ lat: location.coords.latitude, lon: location.coords.longitude });
                
                // Simulación de geocodificación inversa
                const address = `Lat: ${location.coords.latitude.toFixed(4)}, Lon: ${location.coords.longitude.toFixed(4)} (Ubicación Actual)`;
                setCurrentLocation(address);
                
            } catch (error) {
                setCurrentLocation('No se pudo obtener la ubicación.');
            }
        })();
    }, [isVisible]); // El efecto se dispara cuando isVisible cambia.

    // 💡 FUNCIÓN: Abrir cámara y guardar foto/video
    const handleCaptureMedia = async () => {
        let cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
        if (cameraPermission.status !== 'granted') {
            Alert.alert('Error', 'Necesitas otorgar permiso de cámara para capturar evidencia.');
            return;
        }

        Alert.alert(
            "Capturar Evidencia",
            "¿Deseas capturar una foto o un video?",
            [
                { text: "Cancelar", style: "cancel" },
                { 
                    text: "Tomar Foto", 
                    onPress: async () => {
                        let pickerResult = await ImagePicker.launchCameraAsync({
                            mediaTypes: ImagePicker.MediaTypeOptions.Images,
                            allowsEditing: false,
                            quality: 0.5,
                        });
                        if (!pickerResult.canceled) {
                            const newAttachment = `Foto - ${new Date().toLocaleTimeString()}`;
                            setAttachments(prev => [...prev, newAttachment]);
                            Alert.alert("Éxito", "Foto adjuntada.");
                        }
                    }
                },
                { 
                    text: "Grabar Video", 
                    onPress: async () => {
                        let pickerResult = await ImagePicker.launchCameraAsync({
                            mediaTypes: ImagePicker.MediaTypeOptions.Videos,
                            allowsEditing: false,
                            quality: 0.5,
                            maxDuration: 15, 
                        });
                        if (!pickerResult.canceled) {
                            const newAttachment = `Video - ${new Date().toLocaleTimeString()}`;
                            setAttachments(prev => [...prev, newAttachment]);
                            Alert.alert("Éxito", "Video adjuntado.");
                        }
                    }
                },
            ],
            { cancelable: true }
        );
    };

    // 💡 FUNCIÓN: Guardar la incidencia
    const handleSave = () => {
        if (selectedIncident === INCIDENT_OPTIONS[0] || !coords) {
            Alert.alert("Campos Requeridos", "Por favor, seleccione un incidente y asegúrese de tener la ubicación GPS.");
            return;
        }
        
        const newIncidence = {
            nombre: selectedIncident,
            descripcion: description || "No determinado",
            prioridad: scale,
            coords: coords, 
            attachments: attachments,
        };

        onSave(newIncidence);
        // Resetear formulario
        setCurrentLocation('Obteniendo ubicación...');
        setCoords(null);
        setSelectedIncident(INCIDENT_OPTIONS[0]);
        setDescription('');
        setAttachments([]);
        setScale(INCIDENT_TYPES[INCIDENT_OPTIONS[0]]);
    };

    // 💡 Lógica para manejar la selección del incidente y la escala
    const handleIncidentChange = (incident) => {
        setSelectedIncident(incident);
        setScale(INCIDENT_TYPES[incident] || 'No determinado');
        setIsPickerVisible(false);
    };

    const getScaleColor = (currentScale) => {
        if (currentScale === 'Alta') return COLORS.danger;
        if (currentScale === 'Media') return COLORS.secondary;
        return COLORS.primary;
    }


    // ⚠️ Cierre Condicional SEGURO después de todos los Hooks
    if (!isVisible) return null;

    // --- Renderizado del Modal ---
    return (
        <KeyboardAvoidingView 
            style={styles.modalOverlay}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
            <View style={styles.modalContainer}>
                {/* Título en el centro */}
                <View style={styles.modalHeaderSimplified}>
                    <Text style={styles.modalTitleSimplified}>Registrar Incidente</Text>
                </View>

                <ScrollView style={styles.modalBody}>
                    
                    {/* 1. Ubicación (Output de GPS) */}
                    <TextInput
                        style={[styles.textInput, styles.locationInput, { fontWeight: '600' }]}
                        value={currentLocation}
                        editable={false} 
                        placeholderTextColor={COLORS.textDark}
                        multiline
                        numberOfLines={2}
                    />
                    
                    {/* 2. Selector de Incidente (Touchable que simula dropdown) */}
                    <TouchableOpacity 
                        style={styles.dropdownInput} 
                        onPress={() => setIsPickerVisible(prev => !prev)}
                    >
                        <Text style={styles.dropdownText}>
                            {selectedIncident}
                        </Text>
                        <Ionicons 
                            name={isPickerVisible ? "chevron-up" : "chevron-down"} 
                            size={20} 
                            color={COLORS.textDark} 
                            style={styles.dropdownIcon} 
                        />
                    </TouchableOpacity>

                    {/* Opciones del selector (Picker Simulado en un View) */}
                    {isPickerVisible && (
                        <View style={styles.pickerOptionsContainer}>
                            {INCIDENT_OPTIONS.map((option) => (
                                <TouchableOpacity 
                                    key={option} 
                                    style={[
                                        styles.pickerOption, 
                                        selectedIncident === option && styles.pickerOptionSelected
                                    ]}
                                    onPress={() => handleIncidentChange(option)}
                                >
                                    <Text style={styles.pickerOptionText}>{option}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    )}

                    {/* 3. Descripción (Opcional) */}
                    <TextInput
                        // Si el picker está visible, el margin-top es 0
                        style={[styles.textInput, { height: 80, textAlignVertical: 'top', marginTop: isPickerVisible ? 0 : 15 }]}
                        value={description}
                        onChangeText={setDescription}
                        placeholder="Descripción (opcional)"
                        placeholderTextColor={COLORS.textLight}
                        autoCapitalize="none"
                        multiline
                    />
                    <Text style={styles.descriptionHint}>
                        Si no escribes una descripción, se guardará como "No determinado"
                    </Text>

                    {/* 4. Escala (Texto dinámico) */}
                    <Text style={[styles.scaleText, { color: getScaleColor(scale) }]}>
                        Escala: **{scale}**
                    </Text>
                    
                    {/* 5. Selector de Archivo (Botón para abrir Cámara) */}
                    <View style={styles.fileSelectorContainer}>
                        {/* Botón principal para abrir cámara y capturar */}
                        <TouchableOpacity
                            style={styles.fileSelectButton}
                            onPress={handleCaptureMedia} 
                        >
                            <Text style={styles.fileSelectButtonText}>Seleccionar archivo</Text>
                        </TouchableOpacity>
                        <Text style={styles.fileStatusText}>
                            {attachments.length > 0 ? `${attachments.length} archivo(s) adjuntado(s)` : "Sin archivos seleccionados"}
                        </Text>
                    </View>
                    
                    {/* Lista de Adjuntos (Opcional) */}
                    {attachments.length > 0 && (
                        <View style={styles.attachmentsList}>
                            {attachments.map((att, index) => (
                                <Text key={index} style={styles.attachmentItem} numberOfLines={1}>
                                    <Ionicons name="checkmark-circle" size={12} color={COLORS.success} /> 
                                    <Text> {att}</Text> 
                                </Text>
                            ))}
                        </View>
                    )}

                </ScrollView>
                
                {/* 7. Botones Guardar y Cancelar */}
                <View style={styles.modalFooterButtons}>
                    <TouchableOpacity 
                        style={[styles.button, styles.saveButton]}
                        onPress={handleSave}
                    >
                        <Text style={styles.saveButtonText}>Guardar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                        style={[styles.button, styles.cancelButton]}
                        onPress={onClose}
                    >
                        <Text style={styles.cancelButtonText}>Cancelar</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </KeyboardAvoidingView>
    );
};


export default function UserHome() {
  const [activeTab, setActiveTab] = useState("principal"); // Cambiado a 'principal' para iniciar en Home
  const [data, setData] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [activeFilter, setActiveFilter] = useState("Todos");
  const [userName, setUserName] = useState("Jessica "); 
  // --- Estado para la visibilidad del Modal ---
    const [isModalVisible, setIsModalVisible] = useState(false);

    // 💡 FUNCIÓN CERRAR SESIÓN
    const handleLogout = useCallback(() => {
        Alert.alert(
            "Cerrar Sesión",
            "¿Estás segura de que quieres cerrar tu sesión actual? (Esta acción te dirigiría a la pantalla de Login)",
            [
                {
                    text: "Cancelar",
                    style: "cancel"
                },
                { 
                    text: "Sí, Cerrar Sesión", 
                    onPress: () => {
                        // Aquí iría la lógica para limpiar tokens y navegación:
                        // Ejemplo: navigation.replace('LoginScreen'); 
                        Alert.alert("Sesión Cerrada", "Has cerrado sesión exitosamente. (Simulación de Logout/Redirección)");
                    },
                    style: 'destructive',
                }
            ]
        );
    }, []);

  useEffect(() => {
    setData([
      { id: 1, nombre: "Robo en tienda", fecha: "2025-11-18", hora: "11:03", estado: "Pendiente", prioridad: "Alta", usuario: { name: "Juan Pérez", initials: "JP" }, icono: "storefront-outline", coords: { lat: -12.046, lon: -77.043 } }, 
      { id: 2, nombre: "Accidente vial", fecha: "2025-11-17", hora: "09:15", estado: "Resuelta", prioridad: "Media", usuario: { name: "María García", initials: "MG" }, icono: "car-outline", coords: { lat: -12.080, lon: -77.060 } },
      { id: 3, nombre: "Incendio en edificio", fecha: "2025-11-16", hora: "22:48", estado: "En proceso", prioridad: "Alta", usuario: { name: "Carlos Ruiz", initials: "CR" }, icono: "flame-outline", coords: { lat: -12.050, lon: -77.025 } },
      { id: 4, nombre: "Fuga de agua", fecha: "2025-11-15", hora: "14:30", estado: "Resuelta", prioridad: "Baja", usuario: { name: "Luis Gómez", initials: "LG" }, icono: "water-outline", coords: { lat: -12.072, lon: -77.051 } },
      { id: 5, nombre: "Vandalismo", fecha: "2025-11-18", hora: "01:10", estado: "Pendiente", prioridad: "Media", usuario: { name: "Ana López", initials: "AL" }, icono: "trash-outline", coords: { lat: -12.060, lon: -77.040 } },
    ]);
  }, []);

    // --- Función de Guardado de Incidencia (Estabilizada con useCallback) ---
    const handleSaveIncidence = useCallback((newIncidence) => {
        const currentDate = new Date();
        const newId = Date.now(); 
        
        const incidenceWithMetadata = {
            id: newId,
            nombre: newIncidence.nombre,
            fecha: currentDate.toISOString().split('T')[0],
            hora: currentDate.toTimeString().split(' ')[0].substring(0, 5),
            estado: "Pendiente", 
            prioridad: newIncidence.prioridad,
            usuario: { name: userName, initials: userName.charAt(0) + ' ' },
            icono: "alert-circle-outline",
            location: newIncidence.location,
            descripcion: newIncidence.descripcion,
            attachments: newIncidence.attachments,
            // Coordenadas simuladas para el nuevo reporte (usar las coordenadas reales capturadas)
            coords: newIncidence.coords || { lat: -12.049, lon: -77.045 }, 
        };

        setData(prevData => [incidenceWithMetadata, ...prevData]); 
        setIsModalVisible(false); 
        Alert.alert("Éxito", `Incidencia (${newIncidence.nombre}) creada y marcada como Pendiente.`);
        setActiveTab("principal"); 
    }, [userName]);

  const filteredData = useMemo(() => {
    let result = data;
    if (activeFilter !== "Todos") {
      result = result.filter((item) => item.estado === activeFilter);
    }
    if (searchText) {
      const lowerCaseSearch = searchText.toLowerCase();
      result = result.filter((item) => item.nombre.toLowerCase().includes(lowerCaseSearch));
    }
    return result;
  }, [data, activeFilter, searchText]);

  const exportToExcel = async () => {
    // Lógica de exportación de Excel
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Reporte");
      worksheet.columns = [
        { header: "ID", key: "id", width: 10 }, { header: "Nombre", key: "nombre", width: 25 }, 
        { header: "Fecha", key: "fecha", width: 20 }, { header: "Estado", key: "estado", width: 15 }, 
        { header: "Prioridad", key: "prioridad", width: 12 },
      ];
      data.forEach((item) => worksheet.addRow(item));
      const fileUri = FileSystem.cacheDirectory + "reporte.xlsx";
      const buffer = await workbook.xlsx.writeBuffer();
      await FileSystem.writeAsStringAsync(fileUri, buffer.toString("base64"), { encoding: FileSystem.EncodingType.Base64 });
      if (!(await Sharing.isAvailableAsync())) {
        Alert.alert("Error", "No se puede compartir este archivo en tu dispositivo");
        return;
      }
      await Sharing.shareAsync(fileUri);
      Alert.alert("Éxito", "Archivo Excel generado correctamente");
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Hubo un problema al generar el Excel");
    }
  };

  const renderActiveScreen = useCallback(() => {
    const totalIncidencias = data.length;
    const pendientes = data.filter(i => i.estado === 'Pendiente');

    switch (activeTab) {
      case "principal":
        return (
          <ScrollView contentContainerStyle={{ paddingBottom: 150 }}>
            
            {/* 1. Resumen de Incidencias */}
            <View style={styles.summaryCard}>
              <View>
                  <Text style={styles.summaryTitle}>Incidencias Totales</Text>
                  <Text style={styles.summaryValue}>{totalIncidencias}</Text>
              </View>
              {/* BOTÓN PARA ABRIR MODAL DESDE EL RESUMEN */}
              <TouchableOpacity 
                style={styles.summaryAddButton}
                onPress={() => setIsModalVisible(true)} // Abrir modal
              >
                <Ionicons name="add" size={24} color={COLORS.darkPrimary} />
              </TouchableOpacity>
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

            {/* 3. Incidencias Recientes (Resueltas/Proceso) */}
            <View style={[styles.sectionContainer, { marginTop: 25 }]}>
                <Text style={styles.sectionTitle}>Incidencias Recientes</Text>
                <TouchableOpacity onPress={() => setActiveTab('mapa')}>
                    <Text style={styles.seeAllText}>Ver todas</Text>
                </TouchableOpacity>
            </View>
            <View style={{ marginBottom: 10 }}>
                {data.slice(0, 3).map((inc) => (
                    <ResolvedIncidenceCard key={inc.id} item={inc} />
                ))}
            </View>
          </ScrollView>
        );
      case "mapa":
        return <MapScreen data={data} />;
      case "crear":
        return <ScreenPlaceholder title="➕ Modal Activado" />;
      case "alertas":
        return <ScreenPlaceholder title="⚠️ Alertas y Notificaciones" />;
      case "perfil":
        return (
            <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
                <View style={styles.profileContainer}>
                    <Text style={styles.profileTitle}>👤 Perfil de Usuario</Text>
                    <Text style={styles.profileText}>Nombre: {userName}</Text>
                    <Text style={styles.profileText}>ID: 123456</Text>
                    <Text style={styles.profileText}>Rol: Supervisor/Reportero</Text>
                </View>
                
                {/* OPCIÓN DE CERRAR SESIÓN */}
                <TouchableOpacity 
                    style={[styles.button, styles.logoutButton]} 
                    onPress={handleLogout}
                >
                    <Ionicons name="log-out-outline" size={20} color={COLORS.white} />
                    <Text style={[styles.buttonText, { marginLeft: 10 }]}>Cerrar Sesión</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                    style={[styles.button, styles.exportButton]} 
                    onPress={exportToExcel}
                >
                    <Ionicons name="download-outline" size={20} color={COLORS.textDark} />
                    <Text style={[styles.buttonText, { marginLeft: 10, color: COLORS.textDark }]}>Exportar Reporte (Excel)</Text>
                </TouchableOpacity>
            </ScrollView>
        );
      default:
        return null;
    }
  }, [activeTab, data]);

	// --- FUNCIÓN DE MANEJO DE TABS (ABRE EL MODAL O CAMBIA LA PESTAÑA) ---
	const handleTabPress = (tabId) => {
		if (tabId === 'crear') {
			setIsModalVisible(true);
		} else {
			setActiveTab(tabId);
		}
	};

  return (
    <SafeAreaView className="flex-1 p-4">
      <StatusBar barStyle="dark-content" />

      <Header userName={userName} /> 

      {/* CONTENIDO PRINCIPAL */}
      <View className="flex-1">{renderScreen()}</View>

      {/* Usa la nueva función de manejo */}
      <CurvedBottomBar activeTab={activeTab} onTabPress={handleTabPress} />

      {/* RENDERIZADO DEL MODAL */}
      <CreateIncidenceModal 
      	isVisible={isModalVisible} 
      	onClose={() => setIsModalVisible(false)} 
      	onSave={handleSaveIncidence}
      />
    </SafeAreaView>
  );
}

// --- COMPONENTE DE BARRA DE NAVEGACIÓN INFERIOR (Estilo mejorado) ---
const CurvedBottomBar = ({ activeTab, onTabPress }) => {
    return (
        // tabBarContainerNew es el contenedor principal, le ponemos el color de fondo y sombra
        <View style={styles.tabBarContainerNew}>
            <View style={styles.tabRowNew}>
                {TAB_ITEMS.map((tab) => {
                    const Icon = tab.iconType;
                    const isActive = tab.id === activeTab;
                    const isCenter = tab.id === 'crear';

                    // Si es el botón central 'Crear', usamos el estilo flotante
                    if (isCenter) {
                        return (
                            <View key={tab.id} style={styles.centerButtonWrapperNew}>
                                <TouchableOpacity
                                    onPress={() => onTabPress(tab.id)}
                                    style={styles.centerButtonNew}
                                >
                                    <Ionicons name={"add-sharp"} size={32} color={COLORS.white} />
                                </TouchableOpacity>
                            </View>
                        );
                    }

                    // Botones laterales
                    return (
                        <TouchableOpacity
                            key={tab.id}
                            onPress={() => onTabPress(tab.id)}
                            style={styles.tabButtonNew} // Estilo más simple para el botón
                        >
                            <Icon
                                name={isActive ? tab.activeIcon : tab.icon}
                                size={24}
                                color={isActive ? COLORS.primary : COLORS.inactive}
                            />
                            <Text 
                                style={[
                                    styles.tabLabelNew, 
                                    isActive ? { color: COLORS.primary } : { color: COLORS.inactive }
                                ]}
                            >
                                {tab.label}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </View>
        </View>
    );
};
// ----------------------------------------------------------------------

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  contentContainer: { flex: 1, paddingHorizontal: 20, paddingTop: 10 },
  placeholder: {
    flex: 1, justifyContent: "center", alignItems: "center", borderRadius: 20,
    backgroundColor: COLORS.white, padding: 20, shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 5,
  },
  placeholderTitle: { fontSize: 22, fontWeight: "bold", color: COLORS.primary, marginBottom: 15 },
  button: {
    // Estilo base para botones grandes
    padding: 15, borderRadius: 12, marginTop: 20, 
    flexDirection: 'row', 
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: { color: "#fff", fontSize: 18, fontWeight: "bold" },
  // 💡 NUEVOS ESTILOS PARA PERFIL
  profileContainer: {
    backgroundColor: COLORS.white,
    padding: 20,
    borderRadius: 15,
    marginBottom: 20,
    marginTop: 5,
    shadowColor: COLORS.shadow,
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  profileTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 15,
  },
  profileText: {
    fontSize: 16,
    color: COLORS.textDark,
    marginBottom: 5,
  },
  logoutButton: {
    backgroundColor: COLORS.danger, // Rojo para la acción de logout
  },
  exportButton: {
    backgroundColor: COLORS.warning, // Amarillo/Naranja para exportar
  },
  noResultsText: { textAlign: 'center', color: COLORS.textLight, marginTop: 20 },
  noDataText: { color: COLORS.textLight, marginTop: 5, marginLeft: 5 },

  // ▫ Header
  headerContainer: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingHorizontal: 20, paddingTop: Platform.OS === "ios" ? 50 : StatusBar.currentHeight + 10,
    paddingBottom: 15, backgroundColor: COLORS.white,
  },
  greetingText: { fontSize: 20, color: COLORS.textDark, fontWeight: 'normal' },
  userNameText: { fontSize: 26, fontWeight: "bold", color: COLORS.textDark, marginTop: 2 }, 
  headerIcons: { flexDirection: "row", alignItems: "center" },
  headerIconButton: {
    width: 45, height: 45, borderRadius: 22.5, backgroundColor: COLORS.white,
    justifyContent: 'center', alignItems: 'center', marginLeft: 10,
    shadowColor: COLORS.shadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3,
  },
  notificationBadge: {
    position: 'absolute', top: 5, right: 5, width: 8, height: 8,
    borderRadius: 4, backgroundColor: COLORS.danger, borderWidth: 1.5, borderColor: COLORS.white,
  },
  
  // --- ESTILOS PANTALLA PRINCIPAL ---
  summaryCard: {
    backgroundColor: COLORS.primary,
    padding: 25,
    borderRadius: 20,
    marginBottom: 20,
    marginTop: 5,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start', // Alinear al inicio para que el botón + esté arriba
  },
  summaryTitle: { fontSize: 16, color: COLORS.white, opacity: 0.8 },
  summaryValue: { fontSize: 40, fontWeight: 'bold', color: COLORS.white, marginTop: 5 },
  summaryAddButton: {
    // Botón de acción rápida
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute', // Permite que se posicione sobre el fondo azul
    right: 20,
    top: 20,
  },
  sectionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.textDark },
  seeAllText: { fontSize: 14, color: COLORS.primary, fontWeight: '600' },
  pendingScroll: { paddingVertical: 5 },
  pendingCard: {
    width: width * 0.45,
    height: 140,
    padding: 15,
    borderRadius: 15,
    marginRight: 15,
    justifyContent: 'space-between',
  },
  pendingIconBg: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pendingTitle: { fontSize: 16, fontWeight: 'bold', color: COLORS.white, marginTop: 10 },
  pendingPriority: { fontSize: 12, fontWeight: '600' },
  pendingOptions: { position: 'absolute', top: 15, right: 15 },
  resolvedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    paddingVertical: 15,
    paddingHorizontal: 10,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  resolvedIconBg: {
    width: 45,
    height: 45,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  resolvedDetails: { flex: 1 },
  resolvedTitle: { fontSize: 15, fontWeight: '600', color: COLORS.textDark },
  resolvedDate: { fontSize: 12, color: COLORS.textLight, marginTop: 2 },
  resolvedValueContainer: { alignItems: 'flex-end' },
  resolvedValue: { fontSize: 15, fontWeight: 'bold' },
  resolvedUser: { fontSize: 12, color: COLORS.textLight, marginTop: 2 },
  
  // --- Estilos de Historial/Mapa (Solo contenedores genéricos) ---
  containerHistorial: { flex: 1, backgroundColor: COLORS.background },
  scrollContent: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 20 },
  pageTitle: { fontSize: 24, fontWeight: "bold", color: COLORS.textDark, marginBottom: 15 },
  sectionHeader: { fontSize: 18, fontWeight: "600", color: COLORS.textDark, marginTop: 15, marginBottom: 5 },
  textLight: { fontSize: 14, color: COLORS.textLight, marginBottom: 15 },
  
  statRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  statCard: {
    width: CARD_WIDTH, backgroundColor: COLORS.white, padding: 15, borderRadius: 12, borderLeftWidth: 5,
    shadowColor: COLORS.shadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3,
  },
  statTitle: { fontSize: 12, color: COLORS.textLight, marginTop: 5 },
  statValue: { fontSize: 20, fontWeight: 'bold', marginTop: 5 },
  
  // ----------------------------------------------------------------------
  // ▫ Tab Bar MEJORADOS (ACTUALIZADOS)
  tabBarContainerNew: { 
    position: "absolute", 
    bottom: 0, 
    left: 0, 
    right: 0, 
    height: 75, // Altura general de la barra
  },
  tabRowNew: { 
    flexDirection: "row", 
    justifyContent: "space-around", 
    alignItems: 'flex-start', // Alinea los botones laterales arriba
    height: 75, 
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 20, 
    borderTopRightRadius: 20,
    paddingHorizontal: 5,
    paddingTop: 10, // Un poco de padding arriba
    // Sombra para dar efecto de elevación a la barra
    shadowColor: COLORS.shadow, 
    shadowOffset: { width: 0, height: -3 }, 
    shadowOpacity: 0.15, 
    shadowRadius: 8, 
    elevation: 10,
  },
  tabButtonNew: { 
    flex: 1, 
    alignItems: "center", 
    paddingVertical: 5, 
    justifyContent: 'flex-start', // Asegura que los iconos estén arriba
    minWidth: 50,
  },
  // Espacio invisible para el botón central
  centerButtonWrapperNew: { 
    width: 70, // Espacio reservado para el botón central
    height: 75, 
    justifyContent: 'center', 
    alignItems: 'center',
  },
  centerButtonNew: {
    width: 65, 
    height: 65, 
    borderRadius: 32.5, 
    backgroundColor: COLORS.primary,
    justifyContent: 'center', 
    alignItems: 'center', 
    marginBottom: 40, 
    shadowColor: COLORS.primary, 
    shadowOffset: { width: 0, height: 5 }, 
    shadowOpacity: 0.5, 
    shadowRadius: 10, 
    elevation: 15,
    borderWidth: 4, 
    borderColor: COLORS.background, 
  },
  tabLabelNew: { 
    fontSize: 11, 
    fontWeight: '600', 
    marginTop: 4 
  },
  // ----------------------------------------------------------------------


    // --- ESTILOS DEL MODAL (ACTUALIZADO) ---
    modalOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center', 
        alignItems: 'center',
    },
    modalContainer: {
        width: '90%', 
        maxHeight: '90%',
        backgroundColor: COLORS.white, 
        borderRadius: 8,
        padding: 20,
        alignItems: 'center',
    },
    modalHeaderSimplified: {
        width: '100%',
        alignItems: 'center',
        marginBottom: 15,
    },
    modalTitleSimplified: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.textDark,
    },
    modalBody: {
        width: '100%',
        flexGrow: 0,
        marginBottom: 10,
    },
    locationInput: {
        fontSize: 14,
        color: COLORS.textDark,
        paddingVertical: 10,
        backgroundColor: COLORS.white, 
        borderWidth: 1, 
        borderColor: COLORS.border,
        paddingHorizontal: 10,
    },
    // Selector de Incidente (Simulación de Dropdown)
    dropdownInput: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 4,
        marginTop: 15,
        backgroundColor: COLORS.white,
        justifyContent: 'space-between',
        paddingRight: 10,
    },
    dropdownText: {
        fontSize: 16,
        padding: 10,
        color: COLORS.textDark,
    },
    dropdownIcon: {
        paddingRight: 5,
    },
    // Opciones del Picker
    pickerOptionsContainer: {
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 4,
        marginTop: 0,
        width: '100%',
        maxHeight: 180,
        overflow: 'hidden',
    },
    pickerOption: {
        padding: 10,
    },
    pickerOptionSelected: {
        backgroundColor: COLORS.background, // Resaltar la selección
    },
    pickerOptionText: {
        color: COLORS.textDark,
    },
    // Fin Selector
    textInput: {
        width: '100%',
        backgroundColor: COLORS.white,
        padding: 10,
        borderRadius: 4,
        fontSize: 16,
        color: COLORS.textDark,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    descriptionHint: {
        fontSize: 12,
        color: COLORS.textLight,
        marginTop: 8,
        textAlign: 'left',
        width: '100%',
    },
    scaleText: {
        fontSize: 16,
        // Usamos el color dinámico en el componente
        fontWeight: 'bold',
        marginTop: 15,
        marginBottom: 10,
        textAlign: 'center',
        width: '100%',
    },
    
    // Contenedor de Archivos (Nuevo diseño)
    fileSelectorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 20,
        width: '100%',
    },
    fileSelectButton: {
        backgroundColor: COLORS.background,
        borderWidth: 1,
        borderColor: COLORS.inactive,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 4,
    },
    fileSelectButtonText: {
        color: COLORS.textDark,
        fontSize: 14,
        fontWeight: '500',
    },
    fileStatusText: {
        marginLeft: 15,
        fontSize: 14,
        color: COLORS.textLight,
    },

    // Footer con botones Guardar/Cancelar
    modalFooterButtons: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        width: '100%',
        paddingTop: 20,
    },
    saveButton: {
        backgroundColor: COLORS.primary,
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 4,
        marginRight: 10,
        marginTop: 0,
        width: 100, // Fijar ancho
    },
    saveButtonText: {
        color: COLORS.white,
        fontWeight: 'bold',
        fontSize: 16,
    },
    cancelButton: {
        backgroundColor: COLORS.inactive, // Gris para cancelar
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 4,
        marginTop: 0,
        width: 100, // Fijar ancho
    },
    cancelButtonText: {
        color: COLORS.white,
        fontWeight: 'bold',
        fontSize: 16,
    },
    
    attachmentsList: {
        width: '100%',
        marginTop: 15,
        padding: 15,
        backgroundColor: COLORS.white,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    attachmentItem: {
        fontSize: 14,
        color: COLORS.textLight,
        marginTop: 5,
        flexDirection: 'row',
        alignItems: 'center',
    },
});