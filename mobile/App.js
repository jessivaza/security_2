// IMPORTACIONES
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet } from 'react-native';

// IMPORTACIONES
import DetalleAlerta from './src/screens/Vista_Admin/DetalleAlerta.jsx';

// Crea el Stack Navigator
const Stack = createNativeStackNavigator();

//================ DEFINE LAS URLS DE LAS PÁGINAS (SCREENS) CREADAS :D ========================
export default function App() {
  return (
    <NavigationContainer>
      <StatusBar style="auto" />
      <Stack.Navigator
        initialRouteName="DetalleAlerta"  // 👈 Esta será la pantalla inicial
      >
        {/* ======= PANTALLA PRINCIPAL ======= */}
        <Stack.Screen
          name="DetalleAlerta"
          component={DetalleAlerta}
          options={{ title: 'ALERTAS' }} //TITULO QUE VA EN LA PÁGINA
        />

        {/* ======= EJEMPLOS DE OTRAS PÁGINAS SECUNDARIAS ======= */}
        {/* 
        <Stack.Screen
          name="Usuarios"
          component={Usuarios}
          options={{ title: 'Gestión de Usuarios' }}
        />
        <Stack.Screen
          name="Reportes"
          component={Reportes}
          options={{ title: 'Reportes Generales' }}
        />
        */}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

// ======= ESTILOS =======
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
