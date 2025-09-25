import api from "./api";
import axios from "axios";

export async function login(username, password) {
  const { data } = await api.post("login", { username, password });
  localStorage.setItem("access", data.access);
  localStorage.setItem("refresh", data.refresh);
  localStorage.setItem("idUsuario", data.idUsuario);  // <-- guardas el id
}


export async function refreshToken() {
  const refresh = localStorage.getItem("refresh");
  if (refresh) {
    const { data } = await axios.post("http://127.0.0.1:8000/api/refresh", { refresh });
    localStorage.setItem("access", data.access);
    return data.access;
  }
  return null;
}

export function logout() {
  localStorage.removeItem("access");
  localStorage.removeItem("refresh");
}

export function isLoggedIn() {
  return !!localStorage.getItem("access");
}
