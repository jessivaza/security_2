import React, { useState, useContext } from "react";
import { View, Text, TextInput, TouchableOpacity, Image, StyleSheet } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { UserContext } from "../../theme/UserContext";
import * as ImagePicker from "expo-image-picker";

const BASE_URL = "http://192.168.1.9:8000/api";

export default function EditarPerfil({ navigation }) {
  const { userData, setUserData } = useContext(UserContext);

  const [username, setUsername] = useState(userData?.nombre || "");
  const [correo, setCorreo] = useState(userData?.correo || userData?.email || "");
  const [imagen, setImagen] = useState(userData?.imagen || null);
  const [newPassword, setNewPassword] = useState("");
  const [errors, setErrors] = useState({});

  const token = userData?.access;

  // Selección de imagen
  const cambiarImagen = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images, // CORREGIDO
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setImagen(result.assets[0].uri);
    }
  };

  const guardarCambios = async () => {
    const newErrors = {};
    if (!username.trim()) newErrors.username = "Nombre obligatorio";
    if (!correo.trim()) newErrors.correo = "Correo obligatorio";
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    try {
      await axios.patch(
        `${BASE_URL}/perfil-usuario/`,
        { nombre: username, correo, imagen },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (newPassword.length >= 6) {
        await axios.post(
          `${BASE_URL}/cambiar-password/`,
          { nueva: newPassword },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }

      const actualizado = { ...userData, nombre: username, correo, email: correo, imagen };
      setUserData(actualizado);
      await AsyncStorage.setItem("user", JSON.stringify(actualizado));

      // Redirige automáticamente al Home
      navigation.replace("HomeUsuario");
    } catch (error) {
      setErrors({ general: "No se pudo actualizar el perfil" });
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => navigation.goBack()}>
        <Text style={styles.backText}>← Volver</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={cambiarImagen}>
        <Image
          source={{
            uri: imagen || "https://cdn-icons-png.flaticon.com/512/149/149071.png",
          }}
          style={styles.avatar}
        />
      </TouchableOpacity>

      <TextInput
        style={[styles.input, errors.username && styles.inputError]}
        placeholder="Nombre"
        value={username}
        onChangeText={setUsername}
        onFocus={() => setErrors(prev => ({ ...prev, username: null }))}
      />
      {errors.username && <Text style={styles.errorText}>{errors.username}</Text>}

      <TextInput
        style={[styles.input, errors.correo && styles.inputError]}
        placeholder="Correo"
        value={correo}
        onChangeText={setCorreo}
        autoCapitalize="none"
        onFocus={() => setErrors(prev => ({ ...prev, correo: null }))}
      />
      {errors.correo && <Text style={styles.errorText}>{errors.correo}</Text>}

      <TextInput
        style={styles.input}
        placeholder="Nueva contraseña"
        secureTextEntry
        value={newPassword}
        onChangeText={setNewPassword}
      />

      {errors.general && <Text style={styles.errorText}>{errors.general}</Text>}

      <TouchableOpacity style={styles.btn} onPress={guardarCambios}>
        <Text style={styles.btnText}>Guardar Cambios</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  backText: { fontSize: 18, color: "#1E90FF", marginBottom: 20 },
  avatar: { width: 140, height: 140, borderRadius: 80, alignSelf: "center", marginBottom: 10 },
  input: { borderWidth: 1, padding: 10, marginBottom: 15, borderRadius: 5 },
  inputError: { borderColor: 'red', borderWidth: 2 },
  errorText: { color: 'red', fontSize: 13, marginBottom: 10, marginLeft: 5 },
  btn: { backgroundColor: "#007bff", padding: 15, borderRadius: 5, marginTop: 10 },
  btnText: { color: "#fff", textAlign: "center", fontWeight: "bold" },
});
