import React, { useState, useContext } from "react";
import { View, Text, TouchableOpacity, Image, StyleSheet } from "react-native";
import { UserContext } from "../../theme/UserContext.js"; // Ajusta la ruta si es necesario

export default function HomeUsuario({ navigation, onLogout }) {
  const { userData } = useContext(UserContext); // datos del usuario
  const [menuOpen, setMenuOpen] = useState(false);

  const goToEditProfile = () => {
    setMenuOpen(false);
    navigation.navigate("EditarPerfil");
  };

  const goToHome = () => {
    setMenuOpen(false);
    navigation.replace("HomeUsuario"); // evita duplicar pantallas
  };

  return (
    <View style={{ flex: 1 }}>
      {/* BOTÓN MENU */}
      <TouchableOpacity 
        style={styles.menuBtn} 
        onPress={() => setMenuOpen(!menuOpen)}
      >
        <Text style={{ fontSize: 28 }}>☰</Text>
      </TouchableOpacity>

      {/* MENÚ LATERAL */}
      {menuOpen && (
        <View style={styles.sideMenu}>
          <TouchableOpacity onPress={goToHome}>
            <Text style={styles.menuItem}>Inicio</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={goToEditProfile}>
            <Text style={styles.menuItem}>Editar Perfil</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              setMenuOpen(false);
              onLogout();
            }}
          >
            <Text style={[styles.menuItem, { color: "red" }]}>Cerrar Sesión</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* CONTENIDO PRINCIPAL */}
      <View style={styles.content}>
        {/* Foto de perfil */}
        <Image
          source={{
            uri: userData?.imagen || "https://cdn-icons-png.flaticon.com/512/149/149071.png",
          }}
          style={styles.avatar}
        />

        <Text style={styles.title}>
          Bienvenido {userData?.nombre || userData?.username || "Usuario"} 👮
        </Text>
        <Text style={styles.subtitle}>
          Correo: {userData?.correo || userData?.email || "No registrado"}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  menuBtn: {
    position: "absolute",
    top: 40,
    left: 20,
    zIndex: 10,
  },
  sideMenu: {
    position: "absolute",
    top: 0,
    left: 0,
    width: 200,
    height: "100%",
    backgroundColor: "#eee",
    paddingTop: 80,
    paddingLeft: 15,
    zIndex: 5,
  },
  menuItem: {
    fontSize: 18,
    paddingVertical: 15,
    fontWeight: "600",
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 15,
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 18,
    marginTop: 10,
    textAlign: "center",
  },
});
