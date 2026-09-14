// src/features/profile/services/profileService.ts
import { api } from "../../../services/api";
import * as authServices from "../../auth/services/authServices";

// ========== INTERFACES ==========
export interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: "docente" | "estudiante" | "admin";
  institution: string;
  bio?: string;
  avatar?: string;
  createdAt: string;
}

export interface ProfileStats {
  coursesCount: number;
  achievementsCount: number;
  connectionsCount: number;
}

export interface SessionInfo {
  device: string;
  location: string;
  lastActive: string;
  isCurrent: boolean;
}

export interface UpdateProfileData {
  firstName: string;
  lastName: string;
  institution: string;
  bio?: string;
}

export interface UpdatePasswordData {
  currentPassword?: string;
  newPassword: string;
  confirmPassword: string;
}

// ========== MOCK DATA ==========
const MOCK_STATS: ProfileStats = {
  coursesCount: 8,
  achievementsCount: 24,
  connectionsCount: 156,
};

const MOCK_SESSIONS: SessionInfo[] = [
  {
    device: "Chrome en Windows",
    location: "Lima, Perú",
    lastActive: "Hace 5 minutos (Sesión actual)",
    isCurrent: true,
  },
  {
    device: "Safari en iPhone",
    location: "Lima, Perú",
    lastActive: "Hace 2 días",
    isCurrent: false,
  },
];

// ========== CONVERSIÓN DE DATOS ==========
const convertAuthUserToProfile = (authUser: authServices.AuthUser): UserProfile => {
  return {
    id: authUser.id,
    firstName: authUser.nombres,
    lastName: authUser.apellidos,
    email: authUser.email,
    role: authUser.rol,
    institution: authUser.institucion || "Sin institución asignada",
    bio: authUser.bio,
    avatar: authUser.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${authUser.email}`,
    createdAt: authUser.fecha_registro,
  };
};

// ========== SERVICIOS MOCK MEJORADOS ==========
const getProfileMock = async (): Promise<UserProfile> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const storedUser = localStorage.getItem("user");
      
      if (storedUser) {
        try {
          const userData: authServices.AuthUser = JSON.parse(storedUser);
          resolve(convertAuthUserToProfile(userData));
        } catch (error) {
          console.error("Error al parsear usuario del localStorage:", error);
          resolve({
            id: "error",
            firstName: "Usuario",
            lastName: "Desconocido",
            email: "usuario@pae.edu",
            role: "estudiante",
            institution: "Sin institución",
            createdAt: new Date().toISOString(),
          });
        }
      } else {
        resolve({
          id: "no-user",
          firstName: "Invitado",
          lastName: "",
          email: "invitado@pae.edu",
          role: "estudiante",
          institution: "Sin institución",
          createdAt: new Date().toISOString(),
        });
      }
    }, 500);
  });
};

const getStatsMock = async (): Promise<ProfileStats> => {
  return new Promise((resolve) => setTimeout(() => resolve(MOCK_STATS), 400));
};

const getSessionsMock = async (): Promise<SessionInfo[]> => {
  return new Promise((resolve) => setTimeout(() => resolve(MOCK_SESSIONS), 400));
};

const updateProfileMock = async (data: UpdateProfileData): Promise<UserProfile> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        const userData: authServices.AuthUser = JSON.parse(storedUser);
        
        // Actualizar usuario en localStorage
        userData.nombres = data.firstName;
        userData.apellidos = data.lastName;
        userData.institucion = data.institution;
        userData.bio = data.bio;
        
        localStorage.setItem("user", JSON.stringify(userData));
        
        resolve(convertAuthUserToProfile(userData));
      }
    }, 800);
  });
};

const updatePasswordMock = async (data: UpdatePasswordData): Promise<void> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (data.currentPassword === "wrongpassword") {
        reject(new Error("Contraseña actual incorrecta"));
      } else {
        resolve();
      }
    }, 800);
  });
};

const logoutAllSessionsMock = async (): Promise<void> => {
  return new Promise((resolve) => setTimeout(() => resolve(), 600));
};

// ========== SERVICIOS API ==========
const getProfileApi = async (): Promise<UserProfile> => {
  const response = await api.get<{ user: authServices.AuthUser }>("/auth/verify");
  return convertAuthUserToProfile(response.data.user);
};

const updateProfileApi = async (data: UpdateProfileData): Promise<UserProfile> => {
  const response = await authServices.updateProfile({
    nombres: data.firstName,
    apellidos: data.lastName,
    institucion: data.institution,
    bio: data.bio,
  });
  return convertAuthUserToProfile(response);
};

const updatePasswordApi = async (data: UpdatePasswordData): Promise<void> => {
  await authServices.updatePassword({
    currentPassword: data.currentPassword || "",
    newPassword: data.newPassword,
  });
};

const getStatsApi = async (): Promise<ProfileStats> => {
  const achievements = await api.get<{ data: unknown[] }>("/learning/achievements");
  return {
    ...MOCK_STATS,
    achievementsCount: achievements.data.data.length,
  };
};

// ========== EXPORTACIONES CON FALLBACK ==========
export const getProfile = async (): Promise<UserProfile> => {
  if (import.meta.env.VITE_USE_MOCKS === "true") {
    console.log("🟦 Modo Mock: Profile (usando datos del localStorage)");
    return getProfileMock();
  }

  try {
    return await getProfileApi();
  } catch (error) {
    console.warn("🔴 API Error (Profile), usando datos del localStorage", error);
    return getProfileMock();
  }
};

export const getStats = async (): Promise<ProfileStats> => {
  if (import.meta.env.VITE_USE_MOCKS === "true") {
    console.log("🟦 Modo Mock: Profile Stats");
    return getStatsMock();
  }

  try {
    return await getStatsApi();
  } catch (error) {
    console.warn("🔴 API Error (Profile Stats), usando mock", error);
    return getStatsMock();
  }
};

export const getSessions = async (): Promise<SessionInfo[]> => {
  if (import.meta.env.VITE_USE_MOCKS === "true") {
    console.log("🟦 Modo Mock: Sessions");
    return getSessionsMock();
  }

  try {
    const sessions = await authServices.getSessions();
    return sessions.map((session) => ({
      device: session.device,
      location: session.location,
      lastActive: new Intl.DateTimeFormat("es-PE", {
        dateStyle: "short",
        timeStyle: "short",
      }).format(new Date(session.lastActive)),
      isCurrent: session.isCurrent,
    }));
  } catch (error) {
    console.warn("🔴 API Error (Sessions), usando mock", error);
    return getSessionsMock();
  }
};

export const updateProfile = async (data: UpdateProfileData): Promise<UserProfile> => {
  if (import.meta.env.VITE_USE_MOCKS === "true") {
    return updateProfileMock(data);
  }

  try {
    const updatedUser = await updateProfileApi(data);
    
    // Actualizar localStorage
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const userData: authServices.AuthUser = JSON.parse(storedUser);
      userData.nombres = data.firstName;
      userData.apellidos = data.lastName;
      userData.institucion = data.institution;
      userData.bio = data.bio;
      localStorage.setItem("user", JSON.stringify(userData));
    }
    
    return updatedUser;
  } catch (error) {
    console.warn("🔴 API Error (Update Profile), usando mock", error);
    return updateProfileMock(data);
  }
};

export const updatePassword = async (data: UpdatePasswordData): Promise<void> => {
  if (import.meta.env.VITE_USE_MOCKS === "true") {
    return updatePasswordMock(data);
  }

  try {
    await updatePasswordApi(data);
  } catch (error) {
    console.warn("🔴 API Error (Update Password), usando mock", error);
    throw error;
  }
};

export const logoutAllSessions = async (): Promise<void> => {
  if (import.meta.env.VITE_USE_MOCKS === "true") {
    return logoutAllSessionsMock();
  }

  try {
    await authServices.logoutAllSessions();
  } catch (error) {
    console.warn("🔴 API Error (Logout All), usando mock", error);
    return logoutAllSessionsMock();
  }
};
