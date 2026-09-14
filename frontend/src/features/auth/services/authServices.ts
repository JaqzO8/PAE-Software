// src/features/auth/services/authServices.ts
import { api } from "../../../services/api";

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
    
    console.log('📤 Registro: Enviando datos al backend...', payload);
    
    const response = await api.post<AuthResponse>("/auth/register", payload);

    console.log('📥 Registro: Respuesta recibida:', {
      hasUser: !!response.data?.user,
      hasToken: !!response.data?.token,
      rol: response.data?.user?.rol
    });

    if (!response.data || !response.data.token) {
      throw new Error("Respuesta inválida del servidor");
    }

    return response.data;
  } catch (error: any) {
    console.error('❌ Error en registro:', {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    });
    
    if (error.response?.status === 409) {
      throw new Error("Este correo ya está registrado");
    }
    if (error.response?.status === 400) {
      const errorMsg = error.response.data?.errors 
        ? error.response.data.errors.map((e: any) => e.message).join(', ')
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
    console.log('📤 Login: Enviando credenciales al backend...');
    
    const response = await api.post<AuthResponse>("/auth/login", {
      email: credentials.email.toLowerCase(),
      password: credentials.password,
    });

    console.log('📥 Login: Respuesta del servidor:', {
      success: !!response.data,
      hasUser: !!response.data?.user,
      hasToken: !!response.data?.token,
      userEmail: response.data?.user?.email,
      userRole: response.data?.user?.rol,
      userName: `${response.data?.user?.nombres} ${response.data?.user?.apellidos}`
    });

    if (!response.data || !response.data.token || !response.data.user) {
      console.error('❌ Respuesta inválida del servidor:', response.data);
      throw new Error("Respuesta inválida del servidor");
    }

    if (!['estudiante', 'docente', 'admin'].includes(response.data.user.rol)) {
      console.error('❌ Rol inválido recibido:', response.data.user.rol);
      throw new Error("Rol de usuario inválido");
    }

    console.log('✅ Login exitoso para:', response.data.user.email, 'con rol:', response.data.user.rol);

    return response.data;
  } catch (error: any) {
    console.error('❌ Error en login:', error.response?.data || error.message);
    
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
    console.log('📤 Actualizando perfil...');
    
    const response = await api.put<{ user: AuthUser }>("/auth/profile", data);

    console.log('✅ Perfil actualizado:', response.data.user);
    
    return response.data.user;
  } catch (error: any) {
    console.error('❌ Error actualizando perfil:', error);
    throw new Error("No se pudo actualizar el perfil");
  }
};

/**
 * Cambia la contraseña del usuario
 * PUT /api/auth/password
 */
export const updatePassword = async (data: UpdatePasswordData): Promise<{ shouldLogout: boolean }> => {
  try {
    console.log('📤 Cambiando contraseña...');
    
    const response = await api.put<{ shouldLogout: boolean }>("/auth/password", data);

    console.log('✅ Contraseña actualizada');
    
    return response.data;
  } catch (error: any) {
    console.error('❌ Error cambiando contraseña:', error);
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
    console.log('✅ Logout exitoso en el servidor');
  } catch (error) {
    console.error("Error al cerrar sesión en el servidor:", error);
  }
};

/**
 * Verifica si el token es válido
 * GET /api/auth/verify
 */
export const verifyToken = async (): Promise<{ valid: boolean; user?: AuthUser }> => {
  try {
    const response = await api.get<{ valid: boolean; user: AuthUser }>("/auth/verify");
    console.log('✅ Token verificado:', response.data.valid);
    return response.data;
  } catch (error) {
    console.error("Error al verificar token:", error);
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
    console.log('✅ Token refrescado exitosamente');
    return response.data.token;
  } catch (error) {
    console.error("Error al refrescar token:", error);
    throw new Error("Sesión expirada. Por favor inicia sesión nuevamente.");
  }
};
