// mobile/src/services/api.js

import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const BASE_URL = "http://192.168.18.9:8000/api";

// Crear instancia de axios con configuración base
const api = axios.create({
    baseURL: BASE_URL,
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    }
});

// Interceptor para agregar el token automáticamente
api.interceptors.request.use(
    async (config) => {
        const token = await AsyncStorage.getItem('access');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Interceptor para manejar errores de autenticación
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // Si el error es 401 y no hemos intentado refrescar el token
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                const refresh = await AsyncStorage.getItem('refresh');
                if (refresh) {
                    const { data } = await axios.post(`${BASE_URL}/refresh`, { refresh });
                    await AsyncStorage.setItem('access', data.access);

                    // Reintentar la petición original con el nuevo token
                    originalRequest.headers.Authorization = `Bearer ${data.access}`;
                    return api(originalRequest);
                }
            } catch (refreshError) {
                // Si falla el refresh, cerrar sesión
                await AsyncStorage.multiRemove(['access', 'refresh', 'idUsuario', 'role', 'username', 'email']);
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);

//=======================================FUNCIONES==================================================================

// Funciones del API para DetalleAlerta
// ==============MOSTRAR TODAS LAS ALERTAS DE LA TABLA DetalleAlerta====================
export const alertasAPI = {
    // Obtener todas las alertas desde /todas_alertas/  <===== esto está definido en urls.py
    getAlertas: async () => {
        const response = await api.get('/todas_alertas/');
        return response.data;
    },
};




export default api;