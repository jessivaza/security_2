import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  ScrollView,
} from 'react-native';

// Importa tus pantallas aquí
import Alertas from './DetalleAlerta';
import Personal from './Personal';
import MapadeAlertas from './MapadeAlertas';
import Historial from './Historial';
import Gestion from './Gestion';
import { useTheme } from '../../theme/ThemeContext';
import ThemeToggle from '../../components/ThemeToggle';

const { width } = Dimensions.get('window');

const DashboardAdmin = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [currentScreen, setCurrentScreen] = useState('Dashboard');
  const [slideAnim] = useState(new Animated.Value(-width * 0.75));
  const { theme } = useTheme();

  const toggleMenu = () => {
    const toValue = menuOpen ? -width * 0.75 : 0;
    
    Animated.timing(slideAnim, {
      toValue,
      duration: 300,
      useNativeDriver: true,
    }).start();
    
    setMenuOpen(!menuOpen);
  };

  const navigateTo = (screen) => {
    setCurrentScreen(screen);
    toggleMenu();
  };

  const handleLogout = () => {
    // Implementa tu lógica de cierre de sesión aquí
    console.log('Cerrar sesión');
    toggleMenu();
  };

  const menuItems = [
    { name: 'Dashboard', screen: 'Dashboard' },
    { name: 'Alertas', screen: 'Alertas' },
    { name: 'Personal', screen: 'Personal' },
    { name: 'Mapa de Alertas', screen: 'MapadeAlertas' },
    { name: 'Historial', screen: 'Historial' },
    { name: 'Gestión', screen: 'Gestion' },
  ];

  // Componente de icono de hamburguesa
  const HamburgerIcon = () => (
    <View style={styles.hamburgerIcon}>
      <View style={[styles.hamburgerLine, { backgroundColor: theme.headerText }]} />
      <View style={[styles.hamburgerLine, { backgroundColor: theme.headerText }]} />
      <View style={[styles.hamburgerLine, { backgroundColor: theme.headerText }]} />
    </View>
  );

  // Componente de icono X
  const CloseIcon = () => (
    <View style={styles.closeIcon}>
      <View style={[styles.closeLine1, { backgroundColor: theme.headerText }]} />
      <View style={[styles.closeLine2, { backgroundColor: theme.headerText }]} />
    </View>
  );

  // Renderiza el contenido según la pantalla actual
  const renderContent = () => {
    switch (currentScreen) {
      case 'Dashboard':
        return (
          <View style={styles.contentContainer}>
            <Text style={styles.contentTitle}>Dashboard</Text>
            <Text style={styles.contentText}>
              Bienvenido al panel de administración
            </Text>
          </View>
        );
      case 'Alertas':
        return <Alertas />;
      case 'Personal':
        return <Personal />;
      case 'MapadeAlertas':
        return <MapadeAlertas />;
      case 'Historial':
        return <Historial />;
      case 'Gestion':
        return <Gestion />;
      default:
        return null;
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.headerBg }]}>
        <TouchableOpacity
          style={styles.menuButton}
          onPress={toggleMenu}
          activeOpacity={0.7}
        >
          {menuOpen ? <CloseIcon /> : <HamburgerIcon />}
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.headerText }]}>SEGURIDAD</Text>
        <ThemeToggle />
      </View>

      {/* Contenido principal */}
      <View style={[styles.mainContent, { backgroundColor: theme.background }]}>
        {renderContent()}
      </View>

      {/* Overlay oscuro cuando el menú está abierto */}
      {menuOpen && (
        <TouchableOpacity
          style={[styles.overlay, { backgroundColor: theme.overlay }]}
          activeOpacity={1}
          onPress={toggleMenu}
        />
      )}

      {/* Menú lateral */}
      <Animated.View
        style={[
          styles.sideMenu,
          {
            transform: [{ translateX: slideAnim }],
            backgroundColor: theme.surface,
          },
        ]}
      >
        <View style={[styles.menuHeader, { backgroundColor: theme.headerBg }]}>
          <Text style={[styles.menuLogo, { color: theme.headerText }]}>SEGURIDAD</Text>
        </View>

        <ScrollView style={styles.menuContent}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.menuItem}
              onPress={() => navigateTo(item.screen)}
              activeOpacity={0.7}
            >
              <Text style={[styles.menuItemText, { color: theme.textPrimary }]}>{item.name}</Text>
              <Text style={[styles.menuItemArrow, { color: theme.textSecondary }]}>→</Text>
            </TouchableOpacity>
          ))}

          <TouchableOpacity
            style={[styles.menuItem, styles.logoutItem]}
            onPress={handleLogout}
            activeOpacity={0.7}
          >
            <Text style={[styles.menuItemText, { color: theme.textPrimary }]}>Cerrar sesión</Text>
            <Text style={[styles.menuItemArrow, { color: theme.textSecondary }]}>→</Text>
          </TouchableOpacity>
        </ScrollView>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  menuButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  hamburgerIcon: {
    width: 24,
    height: 18,
    justifyContent: 'space-between',
  },
  hamburgerLine: {
    width: 24,
    height: 3,
    backgroundColor: '#ffffff',
    borderRadius: 2,
  },
  closeIcon: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeLine1: {
    position: 'absolute',
    width: 24,
    height: 3,
    backgroundColor: '#ffffff',
    transform: [{ rotate: '45deg' }],
    borderRadius: 2,
  },
  closeLine2: {
    position: 'absolute',
    width: 24,
    height: 3,
    backgroundColor: '#ffffff',
    transform: [{ rotate: '-45deg' }],
    borderRadius: 2,
  },
  mainContent: {
    flex: 1,
  },
  contentContainer: {
    flex: 1,
    padding: 20,
  },
  contentTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  contentText: {
    fontSize: 16,
    color: '#666',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  sideMenu: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: width * 0.75,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  menuHeader: {
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuLogo: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  menuContent: {
    flex: 1,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
  },
  menuItemText: {
    fontSize: 16,
    fontWeight: '500',
  },
  menuItemArrow: {
    fontSize: 20,
  },
  logoutItem: {
    marginTop: 10,
  },
});

export default DashboardAdmin;