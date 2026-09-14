// src/services/api.ts
import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';

// ========================================
// CONFIGURACIÓN BASE
// ========================================
const API_URL = import.meta.env.VITE_API_URL || '/api';

export const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ========================================
// INTERCEPTOR DE REQUEST
// Añade el token JWT a todas las peticiones
// ========================================
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('token');
    
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Log para desarrollo
    if (import.meta.env.DEV) {
      console.log(`🔵 [API Request] ${config.method?.toUpperCase()} ${config.url}`);
    }

    return config;
  },
  (error: AxiosError) => {
    console.error('❌ [API Request Error]', error);
    return Promise.reject(error);
  }
);

// ========================================
// INTERCEPTOR DE RESPONSE
// Maneja errores y refrescado de tokens
// ========================================
api.interceptors.response.use(
  (response) => {
    // Log para desarrollo
    if (import.meta.env.DEV) {
      console.log(`🟢 [API Response] ${response.config.url} - ${response.status}`);
    }
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Log del error
    if (import.meta.env.DEV) {
      console.error(`🔴 [API Error] ${error.response?.status} - ${originalRequest?.url}`);
    }

    // Error 401: Token expirado o inválido
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Intentar refrescar el token
        const refreshResponse = await axios.post(`${API_URL}/auth/refresh`, {}, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        });

        const newToken = refreshResponse.data.token;

        // Guardar nuevo token
        localStorage.setItem('token', newToken);

        // Reintentar la petición original con el nuevo token
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
        }

        return api(originalRequest);
      } catch (refreshError) {
        // Si el refresh falla, limpiar sesión y redirigir
        console.error('Error al refrescar token:', refreshError);
        
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        
        // Redirigir al login
        window.location.href = '/login';
        
        return Promise.reject(refreshError);
      }
    }

    // Error 403: Acceso prohibido
    if (error.response?.status === 403) {
      console.error('Acceso prohibido a este recurso');
    }

    // Error 404: No encontrado
    if (error.response?.status === 404) {
      console.error('Recurso no encontrado');
    }

    // Error 500: Error del servidor
    if (error.response?.status === 500) {
      console.error('Error interno del servidor');
    }

    return Promise.reject(error);
  }
);

// ========================================
// HELPERS DE UTILIDAD
// ========================================

/**
 * Configura el token manualmente (útil después del login)
 */
export const setAuthToken = (token: string) => {
  localStorage.setItem('token', token);
  api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
};

/**
 * Elimina el token (útil en logout)
 */
export const removeAuthToken = () => {
  localStorage.removeItem('token');
  delete api.defaults.headers.common['Authorization'];
};

/**
 * Verifica si hay un token guardado
 */
export const hasToken = (): boolean => {
  return !!localStorage.getItem('token');
};

export default api;
