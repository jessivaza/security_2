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
// Asumiendo que esta es la ruta correcta a tu HomeStyles.js
import { styles, COLORS, TAB_ITEMS } from "../../Styles/homeStyles.js";

// Importaciones existentes
import MapScreen from './Mapa.jsx'; 
import { Ionicons } from "@expo/vector-icons";
import ExcelJS from "exceljs";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";


const { width } = Dimensions.get("window");
const CARD_WIDTH = width * 0.8;
const CHART_HEIGHT = 300;

// Opciones de Incidentes y su escala (Prioridad)
const INCIDENT_TYPES = {
    "Seleccione un incidente...": "No determinado",
    "Robo en tienda": "Alta",
      // 💡 CAMBIO 1: Nueva opción para texto libre
    "Otro (especifique)": "Pendiente", 
};

const INCIDENT_OPTIONS = Object.keys(INCIDENT_TYPES);
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
    const [currentLocation, setCurrentLocation] = useState('Obteniendo ubicación...');
    const [coords, setCoords] = useState(null);
    const [selectedIncident, setSelectedIncident] = useState(INCIDENT_OPTIONS[0]);
    const [description, setDescription] = useState('');
    const [attachments, setAttachments] = useState([]); 
    const [scale, setScale] = useState(INCIDENT_TYPES[INCIDENT_OPTIONS[0]]);
    const [isPickerVisible, setIsPickerVisible] = useState(false); 
    const [previewUri, setPreviewUri] = useState(null); // Estado para la previsualización
    // 💡 CAMBIO 2: Estado para el input de incidente personalizado
    const [customIncident, setCustomIncident] = useState(''); 


    // 💡 EFECTO: Obtener ubicación al abrir el modal (sin cambios)
    useEffect(() => {
        if (!isVisible) {
            setCurrentLocation('Obteniendo ubicación...');
            setCoords(null);
            setPreviewUri(null); // Resetear previsualización
            // 💡 CAMBIO 3: Resetear el input personalizado al cerrar
            setCustomIncident('');
            return;
        }

        // ... (Tu código de solicitud de ubicación aquí)
        (async () => {
            setCurrentLocation('Obteniendo permisos...');
            let { status } = await Location.requestForegroundPermissionsAsync();
            
            if (status !== 'granted') {
                setCurrentLocation('Permiso de ubicación denegado.');
                return;
            }

            try {
                setCurrentLocation('Buscando ubicación actual...');
                let location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
                const { latitude, longitude } = location.coords;

                setCoords({ lat: latitude, lon: longitude });
                
                setCurrentLocation('Traduciendo coordenadas a dirección...');
                const geocoded = await Location.reverseGeocodeAsync({ 
                    latitude, 
                    longitude 
                });
                
                if (geocoded.length > 0) {
                    const address = geocoded[0];
                    const fullAddress = `${address.street || 'Calle Desconocida'} (${address.name || ''}), ${address.city || address.region || 'Región Desconocida'}`;
                    setCurrentLocation(fullAddress.replace(/,\s*,/g, ',').trim());
                } else {
                    setCurrentLocation(`No se encontró dirección. Intente de nuevo.`);
                }
                
            } catch (error) {
                console.error("Error al obtener o geocodificar la ubicación:", error);
                setCurrentLocation('No se pudo obtener la ubicación (Error GPS/Red).');
            }
        })();
    }, [isVisible]); 

    // Función para manejar y guardar adjuntos (sin cambios)
    const saveAttachment = (uri, type) => {
        const newAttachment = {
            name: `${type === 'image' ? 'Foto' : 'Video'} - ${new Date().toLocaleTimeString()}`,
            uri: uri,
            type: type,
        };
        setAttachments(prev => [...prev, newAttachment]);
        setPreviewUri(uri); // Guardamos la URI para previsualizar
        Alert.alert("Éxito", `${newAttachment.name} adjuntado.`);
    };

    const handleCaptureMedia = async () => {
        // ... (código de handleCaptureMedia sin cambios)
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
                            saveAttachment(pickerResult.assets[0].uri, 'image');
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
                            saveAttachment(pickerResult.assets[0].uri, 'video');
                        }
                    }
                },
            ],
            { cancelable: true }
        );
    };

    // 💡 FUNCIÓN: Guardar la incidencia
    const handleSave = () => {
        // 💡 CAMBIO 4: Determinar el nombre final del incidente
        const finalIncidentName = selectedIncident === "Otro (especifique)" 
            ? customIncident.trim() 
            : selectedIncident;

        // 💡 CAMBIO 5: Validaciones actualizadas
        if (finalIncidentName === INCIDENT_OPTIONS[0] || !coords || (selectedIncident === "Otro (especifique)" && !finalIncidentName)) {
            Alert.alert("Campos Requeridos", "Por favor, seleccione o especifique un incidente y asegúrese de tener la ubicación GPS.");
            return;
        }
        
        const attachmentsNames = attachments.map(att => att.name);
        
        const newIncidence = {
            nombre: finalIncidentName, // Usar el nombre final
            descripcion: description || "No determinado",
            prioridad: scale,
            coords: coords, 
            locationName: currentLocation, 
            attachments: attachmentsNames, // Enviamos solo los nombres en este contexto
        };

        onSave(newIncidence);
        // Resetear formulario
        setCurrentLocation('Obteniendo ubicación...');
        setCoords(null);
        setSelectedIncident(INCIDENT_OPTIONS[0]);
        setDescription('');
        setAttachments([]);
        setScale(INCIDENT_TYPES[INCIDENT_OPTIONS[0]]);
        setPreviewUri(null); 
        setCustomIncident(''); // 💡 CAMBIO 6: Resetear campo personalizado
    };

    // 💡 Lógica para manejar la selección del incidente y la escala
    const handleIncidentChange = (incident) => {
        setSelectedIncident(incident);
        // Usar la prioridad predefinida o la prioridad por defecto de "Otro"
        setScale(INCIDENT_TYPES[incident] || INCIDENT_TYPES["Otro (especifique)"]); 
        setIsPickerVisible(false);

        // Si se selecciona otra cosa, limpiamos el campo de texto libre
        if (incident !== "Otro (especifique)") {
            setCustomIncident('');
        }
    };

    const getScaleColor = (currentScale) => {
        if (currentScale === 'Alta') return COLORS.danger;
        if (currentScale === 'Media') return COLORS.secondary;
        return COLORS.primary;
    }

    // 💡 Bandera para mostrar el campo de texto de incidente personalizado
    const showCustomIncidentInput = selectedIncident === "Otro (especifique)";

    if (!isVisible) return null;

    // --- Renderizado del Modal ---
    return (
        <KeyboardAvoidingView 
            style={styles.modalOverlay}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
            <View style={styles.modalContainer}>
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
                    
                    {/* 2. Selector de Incidente */}
                    <TouchableOpacity 
                        style={[styles.dropdownInput, isPickerVisible && styles.dropdownInputActive]} 
                        onPress={() => setIsPickerVisible(prev => !prev)}
                    >
                        <Text style={[styles.dropdownText, selectedIncident === INCIDENT_OPTIONS[0] && { color: COLORS.textLight }]}>
                            {selectedIncident}
                        </Text>
                        <Ionicons 
                            name={isPickerVisible ? "chevron-up" : "chevron-down"} 
                            size={20} 
                            color={COLORS.primary} 
                            style={styles.dropdownIcon} 
                        />
                    </TouchableOpacity>

                    {/* Opciones del selector */}
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

                    {/* 💡 CAMBIO 7: Nuevo Input de Texto Condicional */}
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

                    {/* 3. Descripción (Opcional) */}
                    <TextInput
                        // Ajustar el marginTop si no hay input personalizado
                        style={[styles.textInput, { height: 80, textAlignVertical: 'top', marginTop: showCustomIncidentInput ? 10 : 15 }]}
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
                        <TouchableOpacity
                            style={styles.fileSelectButton}
                            onPress={handleCaptureMedia} 
                        >
                            <Text style={styles.fileSelectButtonText}>Capturar Evidencia</Text>
                        </TouchableOpacity>
                        {/* Display de estado del archivo */}
                        <Text style={styles.fileStatusText}>
                            {attachments.length > 0 ? `${attachments.length} archivo(s) adjuntado(s)` : "Sin archivos seleccionados"}
                        </Text>
                    </View>
                    
                    {/* Previsualización del último adjunto */}
                    {previewUri && (
                        <View style={[styles.attachmentsList, { marginTop: 15 }]}>
                            <Text style={{fontWeight: 'bold', color: COLORS.textDark}}>Última Evidencia Capturada:</Text>
                            <Image 
                                source={{ uri: previewUri }} 
                                style={{ width: '100%', height: 150, borderRadius: 8, marginTop: 10 }}
                                resizeMode="cover"
                            />
                        </View>
                    )}
                    
                </ScrollView>
                
                {/* 7. Botones Guardar y Cancelar */}
                <View style={styles.modalFooterButtons}>
                    <TouchableOpacity 
                        style={[styles.button, styles.cancelButton]}
                        onPress={onClose}
                    >
                        <Text style={styles.cancelButtonText}>Cancelar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                        style={[styles.button, styles.saveButton]}
                        onPress={handleSave}
                    >
                        <Text style={styles.saveButtonText}>Guardar</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </KeyboardAvoidingView>
    );
};


export default function UserHome() {
// ... (código de UserHome sin cambios)
  const [activeTab, setActiveTab] = useState("principal"); 
  const [data, setData] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [activeFilter, setActiveFilter] = useState("Todos");
  const [userName, setUserName] = useState("Jessica "); 
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

    // --- Función de Guardado de Incidencia (Simulada) ---
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
            location: newIncidence.locationName || "Ubicación desconocida",
            descripcion: newIncidence.descripcion,
            attachments: newIncidence.attachments,
            coords: newIncidence.coords || { lat: -12.049, lon: -77.045 }, 
        };

        setData(prevData => [incidenceWithMetadata, ...prevData]); 
        setIsModalVisible(false); 
        Alert.alert("Éxito", `Incidencia (${newIncidence.nombre}) creada en: ${incidenceWithMetadata.location}`);
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

            {/* 2. Incidencias Pendientes */}
            <View style={styles.sectionContainer}>
                <Text style={styles.sectionTitle}>Incidencias Pendientes ({pendientes.length})</Text>
                <TouchableOpacity onPress={() => setActiveTab('mapa')}>
                    <Text style={styles.seeAllText}>Ver Mapa</Text>
                </TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pendingScroll}>
                {pendientes.length > 0 ? (
                    pendientes.map((inc) => <PendingIncidenceCard key={inc.id} item={inc} />)
                ) : (
                    <Text style={styles.noDataText}>🎉 ¡No hay incidencias pendientes!</Text>
                )}
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
                
                {/* OPCIÓN DE CERRAR SESIÓN (Botón en Perfil, adicional al Header) */}
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
  }, [activeTab, data, userName, handleLogout]);

    // --- FUNCIÓN DE MANEJO DE TABS (ABRE EL MODAL O CAMBIA LA PESTAÑA) ---
    const handleTabPress = (tabId) => {
        if (tabId === 'crear') {
            setIsModalVisible(true);
        } else {
            setActiveTab(tabId);
        }
    };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />

      {/* 👈 LLAMADA AL HEADER CON LA FUNCIÓN CERRAR SESIÓN */}
      <Header userName={userName} onLogout={handleLogout} /> 

      <View style={styles.contentContainer}>
        {renderActiveScreen()}
      </View>

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


const CurvedBottomBar = ({ activeTab, onTabPress }) => {
// ... (código de CurvedBottomBar sin cambios)
    return (
        <View style={styles.tabBarContainerNew}>
            <View style={styles.tabRowNew}>
                {TAB_ITEMS.map((tab) => {
                    const Icon = tab.iconType;
                    const isActive = tab.id === activeTab;
                    const isCenter = tab.id === 'crear';

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

                    return (
                        <TouchableOpacity
                            key={tab.id}
                            onPress={() => onTabPress(tab.id)}
                            style={styles.tabButtonNew} 
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