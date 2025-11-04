//IMPORTACIONES 
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import Inicio from './src/pages/inicio.jsx';




//DEFINE LAS URLS DE LAS PÁGINAS CREADAS :D
export default function App() {
  return (
    <View style={styles.container}>
      <Inicio />
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
