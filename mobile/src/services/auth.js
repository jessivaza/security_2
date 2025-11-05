// mobile/services/auth.js
// CONEXIÓN A LA API
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from "axios";

const BASE_URL = "http://192.168.18.5:8000/api"; // 👈 usa tu IP local, no 127.0.0.1

export async function login(username, password) {
  const { data } = await axios.post(`${BASE_URL}/login`, { username, password });

  await AsyncStorage.setItem("access", data.access);
  await AsyncStorage.setItem("refresh", data.refresh);
  await AsyncStorage.setItem("idUsuario", String(data.idUsuario));
  await AsyncStorage.setItem("role", data.role);
  await AsyncStorage.setItem("username", data.username || "");
  await AsyncStorage.setItem("email", data.email || "");
}

export async function refreshToken() {
  const refresh = await AsyncStorage.getItem("refresh");
  if (!refresh) return null;
  const { data } = await axios.post(`${BASE_URL}/refresh`, { refresh });
  await AsyncStorage.setItem("access", data.access);
  return data.access;
}

export async function logout() {
  await AsyncStorage.multiRemove([
    "access",
    "refresh",
    "idUsuario",
    "role",
    "username",
    "email",
  ]);
}

export async function isLoggedIn() {
  const access = await AsyncStorage.getItem("access");
  return !!access;
}

export async function getRole() {
  return (await AsyncStorage.getItem("role")) || "user";
}
