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
}
from "react-native";
// Importamos el componente de Mapa
import MapScreen from './Mapa.jsx'; 
import { Ionicons } from "@expo/vector-icons";
import ExcelJS from "exceljs";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";

const { width } = Dimensions.get("window");
const CARD_WIDTH = width * 0.4;
const CHART_HEIGHT = 200;

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

const TAB_ITEMS = [
  { id: "principal", icon: "home-outline", activeIcon: "home", label: "Inicio", iconType: Ionicons },
  { id: "mapa", icon: "map-outline", activeIcon: "map", label: "Mapa", iconType: Ionicons }, 
  { id: "crear", icon: "add-circle-outline", activeIcon: "add-circle", label: "Crear", iconType: Ionicons },
  { id: "alertas", icon: "alert-circle-outline", activeIcon: "alert-circle", label: "Alertas", iconType: Ionicons },
  { id: "perfil", icon: "person-outline", activeIcon: "person", label: "Perfil", iconType: Ionicons },
];

const ScreenPlaceholder = ({ title, children }) => (
  <View style={styles.placeholder}>
    <Text style={styles.placeholderTitle}>{title}</Text>
    {children}
  </View>
);

const Header = ({ userName }) => (
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
    </View>
  </View>
);

// --- Componente de Tarjeta de Incidencia Pendiente (Usado en Home) ---
const PendingIncidenceCard = ({ item }) => {
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
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <Ionicons name={icon} size={24} color={color} />
      <Text style={styles.statTitle}>{title}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
);


// --- COMPONENTE MODAL PARA CREAR INCIDENCIA ---
const CreateIncidenceModal = ({ isVisible, onClose, onSave }) => {
	const [title, setTitle] = useState('');
	const [description, setDescription] = useState('');
	const [priority, setPriority] = useState('Alta'); 
	const [location, setLocation] = useState(''); 
    const [attachments, setAttachments] = useState([]); 

	if (!isVisible) return null;

	const handleSave = () => {
		if (!title || !description || !location) {
			Alert.alert("Campos Requeridos", "Por favor, complete el título, la descripción y la ubicación.");
			return;
		}
		
		const newIncidence = {
			nombre: title,
			descripcion: description,
			prioridad: priority,
			location: location,
            attachments: attachments,
		};

		onSave(newIncidence);
		// Resetear formulario
		setTitle('');
		setDescription('');
		setPriority('Alta');
		setLocation('');
        setAttachments([]);
	};

    // Lógica simulada para añadir archivos adjuntos (Foto/Video en tiempo real)
    const handleAddAttachment = (type) => {
        let actionDescription = "";
        if (type === 'Foto') {
            actionDescription = "Captura de Foto simulada";
        } else if (type === 'Video') {
            actionDescription = "Grabación de Video simulada";
        }

        const newAttachment = `${type} - ${new Date().toLocaleTimeString('es-ES', {hour: '2-digit', minute:'2-digit', second:'2-digit'})}`;
        setAttachments(prev => [...prev, newAttachment]);
        Alert.alert("Simulación de Captura", `${actionDescription} completada. Archivo adjuntado: ${newAttachment}`);
    };


	return (
		<KeyboardAvoidingView 
			style={styles.modalOverlay}
			behavior={Platform.OS === "ios" ? "padding" : "height"}
		>
			<View style={styles.modalContainer}>
				<View style={styles.modalHeader}>
					<Text style={styles.modalTitle}>Reportar Nueva Incidencia</Text>
					<TouchableOpacity onPress={onClose} style={styles.modalCloseButton}>
						<Ionicons name="close-circle-outline" size={30} color={COLORS.inactive} />
					</TouchableOpacity>
				</View>

				<ScrollView style={styles.modalBody}>
					<Text style={styles.formLabel}>Título (Resumen)</Text>
					<TextInput
						style={styles.textInput}
						value={title}
						onChangeText={setTitle}
						placeholder="Ej: Cableado caído en calle 5"
						placeholderTextColor={COLORS.textLight}
					/>

					<Text style={styles.formLabel}>Descripción Detallada</Text>
					<TextInput
						style={[styles.textInput, { height: 100, textAlignVertical: 'top' }]}
						value={description}
						onChangeText={setDescription}
						placeholder="Describa el problema, impacto y posibles riesgos."
						multiline
						placeholderTextColor={COLORS.textLight}
					/>

					<Text style={styles.formLabel}>Ubicación / Referencia</Text>
					<TextInput
						style={styles.textInput}
						value={location}
						onChangeText={setLocation}
						placeholder="Coordenadas, dirección o punto de referencia"
						placeholderTextColor={COLORS.textLight}
					/>

					<Text style={[styles.formLabel, { marginBottom: 10, color: COLORS.danger }]}>
                        Prioridad Establecida: Alta (Reporte Rápido)
                    </Text> 
					
                    {/* Sección para adjuntar foto/video - Simulación de captura en tiempo real */}
					<Text style={styles.formLabel}>Adjuntar Evidencia (Cámara en Tiempo Real)</Text>
                    <View style={styles.attachmentRow}>
                        <TouchableOpacity 
                            style={styles.mediaButton}
                            onPress={() => handleAddAttachment('Foto')}
                        >
                            <Ionicons name="camera-outline" size={24} color={COLORS.primary} />
                            <Text style={styles.mediaButtonText}>Tomar Foto</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                            style={[styles.mediaButton, { marginLeft: 10 }]}
                            onPress={() => handleAddAttachment('Video')}
                        >
                            <Ionicons name="videocam-outline" size={24} color={COLORS.primary} />
                            <Text style={styles.mediaButtonText}>Grabar Video</Text>
                        </TouchableOpacity>
                    </View>
                    <Text style={{ fontSize: 12, color: COLORS.textLight, marginTop: 5 }}>
                        *En producción, esto abriría la cámara del dispositivo para captura inmediata.
                    </Text>

                    {attachments.length > 0 && (
                        <View style={styles.attachmentsList}>
                            <Text style={[styles.formLabel, { marginTop: 0, marginBottom: 5 }]}>Adjuntos ({attachments.length}):</Text>
                            {attachments.map((att, index) => (
                                <Text key={index} style={styles.attachmentItem} numberOfLines={1}>
                                    <Ionicons name="checkmark-circle" size={12} color={COLORS.success} /> 
                                    <Text> {att}</Text> 
                                </Text>
                            ))}
                        </View>
                    )}

				</ScrollView>
				
				<TouchableOpacity 
					style={[styles.button, { backgroundColor: COLORS.primary, marginTop: 10 }]}
					onPress={handleSave}
				>
					<Text style={styles.buttonText}>Crear Incidencia (Prioridad Alta)</Text>
				</TouchableOpacity>
			</View>
		</KeyboardAvoidingView>
	);
};


export default function UserHome() {
  const [activeTab, setActiveTab] = useState("mapa"); 
  const [data, setData] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [activeFilter, setActiveFilter] = useState("Todos");
  const [userName, setUserName] = useState("Jessica "); 
  // --- Estado para la visibilidad del Modal ---
	const [isModalVisible, setIsModalVisible] = useState(false);

  useEffect(() => {
    setData([
      // DATOS DE INCIDENCIA CON COORDENADAS SIMULADAS (Importante para MapScreen)
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
			// Coordenadas simuladas para el nuevo reporte
			coords: { lat: -12.049, lon: -77.045 }, 
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
              <Text style={styles.summaryTitle}>Incidencias Totales</Text>
              <Text style={styles.summaryValue}>{totalIncidencias}</Text>
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
        return <ScreenPlaceholder title="👤 Configuración de Perfil" />;
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
  const centerItem = TAB_ITEMS.find(item => item.id === 'crear');

  return (
    <View style={styles.tabBarContainer}>
        <View style={styles.tabBarBackground} />
        
        <View style={styles.tabRow}>
            {TAB_ITEMS.map((tab, index) => {
                const Icon = tab.iconType;
                const isActive = tab.id === activeTab;
                const isCenter = tab.id === 'crear';

                if (isCenter) {
                    return (
                        <View key={tab.id} style={styles.centerButtonWrapper}>
                            <TouchableOpacity
                                onPress={() => onTabPress(tab.id)} // Llama a onTabPress (que abrirá el modal)
                                style={styles.centerButton}
                            >
                                <Ionicons name={"add-sharp"} size={35} color={COLORS.white} />
                            </TouchableOpacity>
                        </View>
                    );
                }

                return (
                    <TouchableOpacity
                        key={tab.id}
                        onPress={() => onTabPress(tab.id)}
                        style={styles.tabButton}
                    >
                        <Icon
                            name={isActive ? tab.activeIcon : tab.icon}
                            size={26}
                            color={isActive ? COLORS.primary : COLORS.inactive}
                        />
                       <Text style={[styles.tabLabel, isActive ? { color: COLORS.primary } : { color: COLORS.inactive }]}>
                            {tab.label}
                        </Text>
                    </TouchableOpacity>
                );
            })}
        </View>
    </View>
  );
};

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
    backgroundColor: COLORS.success, padding: 15, borderRadius: 12, marginTop: 20, alignItems: "center",
  },
  buttonText: { color: "#fff", fontSize: 18, fontWeight: "bold" },
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
  },
  summaryTitle: { fontSize: 16, color: COLORS.white, opacity: 0.8 },
  summaryValue: { fontSize: 40, fontWeight: 'bold', color: COLORS.white, marginTop: 5 },
  summaryAddButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
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
  
  // ▫ Tab Bar
  tabBarContainer: { position: "absolute", bottom: 0, left: 0, right: 0, height: 90, paddingHorizontal: 10 },
  tabBarBackground: {
    position: 'absolute', left: 0, right: 0, bottom: 0, height: 60, backgroundColor: COLORS.white,
    shadowColor: COLORS.shadow, shadowOffset: { width: 0, height: -5 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 8,
    borderTopLeftRadius: 20, borderTopRightRadius: 20,
  },
  tabRow: { flexDirection: "row", justifyContent: "space-around", alignItems: 'center', height: 60, position: 'absolute', bottom: 0, width: width, paddingHorizontal: 10 },
  tabButton: { flex: 1, alignItems: "center", paddingVertical: 5, justifyContent: 'center', minWidth: 50 },
  centerButtonWrapper: { width: 60, height: 60, justifyContent: 'center', alignItems: 'center', marginBottom: 40 },
  centerButton: {
    width: 55, height: 55, borderRadius: 27.5, backgroundColor: COLORS.primary,
    justifyContent: 'center', alignItems: 'center', shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.4, shadowRadius: 10, elevation: 10,
  },
  tabLabel: { fontSize: 10, fontWeight: '600', marginTop: 2 },

	// --- ESTILOS DEL MODAL ---
	modalOverlay: {
		position: 'absolute',
		top: 0,
		left: 0,
		right: 0,
		bottom: 0,
		backgroundColor: 'rgba(0, 0, 0, 0.5)',
		justifyContent: 'flex-end',
		alignItems: 'center',
	},
	modalContainer: {
		width: '100%',
		maxHeight: '90%',
		backgroundColor: COLORS.background,
		borderTopLeftRadius: 25,
		borderTopRightRadius: 25,
		padding: 20,
		paddingBottom: 40,
		alignItems: 'center',
	},
	modalHeader: {
		width: '100%',
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginBottom: 15,
	},
	modalTitle: {
		fontSize: 22,
		fontWeight: 'bold',
		color: COLORS.primary,
	},
	modalCloseButton: {
		padding: 5,
	},
	modalBody: {
		width: '100%',
		flexGrow: 0,
		marginBottom: 10,
	},
	formLabel: {
		fontSize: 14,
		fontWeight: '600',
		color: COLORS.textDark,
		marginTop: 15,
		marginBottom: 5,
	},
	textInput: {
		width: '100%',
		backgroundColor: COLORS.white,
		padding: 15,
		borderRadius: 10,
		fontSize: 16,
		color: COLORS.textDark,
		borderWidth: 1,
		borderColor: COLORS.border,
		shadowColor: COLORS.shadow,
		shadowOffset: { width: 0, height: 1 },
		shadowOpacity: 0.05,
		shadowRadius: 1,
		elevation: 1,
	},
    // --- ESTILOS PARA FOTO/VIDEO ---
    attachmentRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		marginTop: 10,
	},
	mediaButton: {
		flex: 1,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: COLORS.white,
		padding: 12,
		borderRadius: 10,
		borderWidth: 1,
		borderColor: COLORS.primary,
        // El marginHorizontal asegura que no se peguen a los bordes y entre ellos
		marginHorizontal: 0, 
	},
	mediaButtonText: {
		marginLeft: 8,
		color: COLORS.primary,
		fontWeight: '600',
		fontSize: 13,
	},
    attachmentsList: {
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