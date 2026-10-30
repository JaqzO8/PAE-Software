// src/features/auth/services/authServices.ts
import { api } from "../../../services/api";
import { isAxiosError } from "axios";

type AuthErrorResponse = { message?: string; errors?: { message: string }[] };

// ========================================
// INTERFACES ACTUALIZADAS
// ========================================

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  nombres: string;
  apellidos: string;
  email: string;
  password: string;
  isTeacher: boolean;
}

export interface AuthUser {
  id: string;
  identificador_unico: string;
  email: string;
  nombres: string;
  apellidos: string;
  carrera_interes?: string | null;
  rol: "estudiante" | "docente" | "admin";
  institucion?: string;
  bio?: string;
  avatar?: string;
  fecha_registro: string;
  primer_ingreso: boolean;
  activo: boolean;
}

export interface AuthResponse {
  user: AuthUser;
  token: string;
}

export interface UpdateProfileData {
  nombres: string;
  apellidos: string;
  institucion?: string;
  bio?: string;
}

export interface UpdatePasswordData {
  currentPassword: string;
  newPassword: string;
}

export interface SessionInfoResponse {
  id: string;
  device: string;
  location: string;
  lastActive: string;
  startedAt: string;
  isCurrent: boolean;
}

// ========================================
// FUNCIONES DE API REAL
// ========================================

/**
 * Registra un nuevo usuario
 * POST /api/auth/register
 */
export const register = async (data: RegisterData): Promise<AuthResponse> => {
  try {
    const payload = {
      nombres: data.nombres,
      apellidos: data.apellidos,
      email: data.email.toLowerCase(),
      password: data.password,
      isTeacher: data.isTeacher,
    };



    const response = await api.post<AuthResponse>("/auth/register", payload);



    if (!response.data || !response.data.token) {
      throw new Error("Respuesta inválida del servidor");
    }

    return response.data;
  } catch (error) {
    if (!isAxiosError<AuthErrorResponse>(error)) throw error;

    if (error.response?.status === 409) {
      throw new Error("Este correo ya está registrado");
    }
    if (error.response?.status === 400) {
      const errorMsg = error.response.data?.errors
        ? error.response.data.errors.map(e => e.message).join(', ')
        : error.response.data?.message || "Datos de registro inválidos";
      throw new Error(errorMsg);
    }

    throw new Error("No se pudo crear la cuenta. Por favor intenta nuevamente.");
  }
};

/**
 * Inicia sesión de un usuario
 * POST /api/auth/login
 */
export const login = async (credentials: LoginCredentials): Promise<AuthResponse> => {
  try {

    const response = await api.post<AuthResponse>("/auth/login", {
      email: credentials.email.toLowerCase(),
      password: credentials.password,
    });



    if (!response.data || !response.data.token || !response.data.user) {

      throw new Error("Respuesta inválida del servidor");
    }

    if (!['estudiante', 'docente', 'admin'].includes(response.data.user.rol)) {

      throw new Error("Rol de usuario inválido");
    }



    return response.data;
  } catch (error) {
    if (!isAxiosError<AuthErrorResponse>(error)) throw error;

    if (error.response?.status === 401) {
      throw new Error("Credenciales incorrectas");
    }
    if (error.response?.status === 404) {
      throw new Error("Usuario no encontrado");
    }
    if (error.response?.status === 403) {
      throw new Error("Cuenta desactivada. Contacta al administrador.");
    }

    throw new Error("Error al iniciar sesión. Verifica tus credenciales.");
  }
};

export const quickLogin = async (email: string): Promise<AuthResponse> => {
  const response = await api.post<AuthResponse>("/auth/quick-login", {
    email,
    provider: "google",
    nombres: email.split("@")[0] || "Usuario",
    apellidos: "PAE",
  });
  return response.data;
};

/**
 * Actualiza el perfil del usuario
 * PUT /api/auth/profile
 */
export const updateProfile = async (data: UpdateProfileData): Promise<AuthUser> => {
  try {

    const response = await api.put<{ user: AuthUser }>("/auth/profile", data);


    return response.data.user;
  } catch {
    throw new Error("No se pudo actualizar el perfil");
  }
};

/**
 * Cambia la contraseña del usuario
 * PUT /api/auth/password
 */
export const updatePassword = async (data: UpdatePasswordData): Promise<{ shouldLogout: boolean }> => {
  try {

    const response = await api.put<{ shouldLogout: boolean }>("/auth/password", data);


    return response.data;
  } catch {
    throw new Error("No se pudo cambiar la contraseña");
  }
};

export const requestPasswordReset = async (email: string) => {
  const response = await api.post<{ message: string; resetToken?: string }>("/auth/forgot-password", { email });
  return response.data;
};

export const resetPassword = async (token: string, newPassword: string) => {
  const response = await api.post<{ message: string }>("/auth/reset-password", { token, newPassword });
  return response.data;
};

export const getSessions = async () => {
  const response = await api.get<{ sessions: SessionInfoResponse[] }>("/auth/sessions");
  return response.data.sessions;
};

export const logoutAllSessions = async () => {
  await api.post("/auth/logout-all");
};

export const requestTwoFactor = async () => {
  const response = await api.post<{ code?: string; message: string }>("/auth/2fa/request");
  return response.data;
};

export const verifyTwoFactor = async (code: string) => {
  const response = await api.post<{ message: string }>("/auth/2fa/verify", { code });
  return response.data;
};

/**
 * Cierra la sesión actual
 * POST /api/auth/logout
 */
export const logout = async (): Promise<void> => {
  try {
    await api.post("/auth/logout");

  } catch {
    // The caller clears local state even if the remote session service is unavailable.
  }
};

/**
 * Verifica si el token es válido
 * GET /api/auth/verify
 */
export const verifyToken = async (): Promise<{ valid: boolean; user?: AuthUser }> => {
  try {
    const response = await api.get<{ valid: boolean; user: AuthUser }>("/auth/verify");

    return response.data;
  } catch {
    return { valid: false };
  }
};

/**
 * Refresca el token JWT
 * POST /api/auth/refresh
 */
export const refreshToken = async (): Promise<string> => {
  try {
    const response = await api.post<{ token: string }>("/auth/refresh");

    return response.data.token;
  } catch {
    throw new Error("Sesión expirada. Por favor inicia sesión nuevamente.");
  }
};
