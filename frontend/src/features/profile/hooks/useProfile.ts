// src/features/profile/hooks/useProfile.ts
import { useState, useEffect } from "react";
import {
  getProfile,
  getStats,
  getSessions,
  updateProfile as updateProfileService,
  updatePassword as updatePasswordService,
  logoutAllSessions as logoutAllSessionsService,
  type UserProfile,
  type ProfileStats,
  type SessionInfo,
} from "../services/profileService";
import type { ProfileFormData, PasswordFormData } from "../schemas";
import { useToast } from "../../../hooks/useToast";

export const useProfile = () => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<ProfileStats | null>(null);
  const [sessions, setSessions] = useState<SessionInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadProfileData();
  }, []);

  const loadProfileData = async () => {
    setIsLoading(true);
    try {
      const [profileData, statsData, sessionsData] = await Promise.all([
        getProfile(),
        getStats(),
        getSessions(),
      ]);
      
      setUser(profileData);
      setStats(statsData);
      setSessions(sessionsData);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudieron cargar los datos del perfil.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateProfile = async (data: ProfileFormData) => {
    setIsUpdating(true);
    try {
      const updatedProfile = await updateProfileService(data);
      setUser(updatedProfile);
      
      // Actualizar localStorage si existe
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        const userData = JSON.parse(storedUser);
        userData.nombres = data.firstName;
        userData.apellidos = data.lastName;
        userData.institucion = data.institution;
        userData.bio = data.bio;
        localStorage.setItem("user", JSON.stringify(userData));
      }
      
      toast({
        title: "Perfil actualizado",
        description: "Tus cambios han sido guardados exitosamente.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo actualizar el perfil.",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const updatePassword = async (data: PasswordFormData): Promise<boolean> => {
    setIsUpdating(true);
    try {
      await updatePasswordService(data);
      
      toast({
        title: "Contraseña actualizada",
        description: "Tu contraseña ha sido cambiada. Cerrando sesión...",
      });
      
      return true;
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo cambiar la contraseña.",
      });
      return false;
    } finally {
      setIsUpdating(false);
    }
  };

  const logoutAllSessions = async () => {
    try {
      await logoutAllSessionsService();
      toast({
        title: "Sesiones cerradas",
        description: "Se han cerrado todas las sesiones excepto la actual.",
      });
      // Recargar sesiones
      const newSessions = await getSessions();
      setSessions(newSessions);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudieron cerrar las sesiones.",
      });
    }
  };

  return {
    user,
    stats,
    sessions,
    isLoading,
    isUpdating,
    updateProfile,
    updatePassword,
    logoutAllSessions,
    refresh: loadProfileData,
  };
};