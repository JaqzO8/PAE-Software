// src/context/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../hooks/useToast';
import * as authService from '../features/auth/services/authServices';

// ========================================
// INTERFACES
// ========================================

interface AuthUser {
  id: string;
  identificador_unico: string;
  email: string;
  nombres: string;
  apellidos: string;
  carrera_interes?: string | null;
  rol: 'estudiante' | 'docente' | 'admin';
  institucion?: string;
  bio?: string;
  avatar?: string;
  fecha_registro: string;
  primer_ingreso: boolean;
  activo: boolean;
}

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (data: Partial<AuthUser>) => void;
  setAuthData: (user: AuthUser, token: string) => void;
  refreshSession: () => Promise<void>;
}

// ========================================
// CONTEXT
// ========================================

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  // ========================================
  // INICIALIZACIÓN: Cargar sesión guardada
  // ========================================
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');

      if (storedToken && storedUser) {
        try {
          // Verificar que el token sigue siendo válido
          const verification = await authService.verifyToken();
          
          if (verification.valid && verification.user) {
            setToken(storedToken);
            setUser(verification.user);
            localStorage.setItem('user', JSON.stringify(verification.user));
            localStorage.setItem('role', verification.user.rol);
          } else {
            // Token inválido, limpiar storage
            clearAuthData();
          }
        } catch (error) {
          console.error('Error al verificar sesión:', error);
          clearAuthData();
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  // ========================================
  // HELPER: Limpiar datos de autenticación
  // ========================================
  const clearAuthData = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('role');
    setUser(null);
    setToken(null);
  };

  // ========================================
  // Establecer datos de autenticación
  // ========================================
  const setAuthData = useCallback((userData: AuthUser, authToken: string) => {
    setUser(userData);
    setToken(authToken);
    localStorage.setItem('token', authToken);
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('role', userData.rol);
  }, []);

  // ========================================
  // LOGIN
  // ========================================
  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    try {
      console.log('🔵 AuthContext: Iniciando login...');
      const response = await authService.login({ email, password });
      
      console.log('✅ AuthContext: Respuesta recibida:', {
        nombres: response.user.nombres,
        apellidos: response.user.apellidos,
        rol: response.user.rol,
        email: response.user.email
      });

      // Guardar en estado y localStorage
      setUser(response.user);
      setToken(response.token);
      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));
      localStorage.setItem('role', response.user.rol);

      console.log('💾 AuthContext: Datos guardados en localStorage');

      // Toast de bienvenida
      toast({
        title: response.user.primer_ingreso 
          ? '¡Bienvenido por primera vez!' 
          : '¡Bienvenido de nuevo!',
        description: `${response.user.nombres} ${response.user.apellidos} - ${response.user.rol}`,
      });

      // Redirigir según rol
      const basePath = response.user.rol === 'docente' ? '/docente' : '/estudiante';
      
      console.log('🚀 AuthContext: Redirigiendo a:', basePath);
      
      setTimeout(() => {
        try {
          navigate(basePath, { replace: true });
          console.log('✅ Navigate ejecutado');
          
          setTimeout(() => {
            if (window.location.pathname !== basePath) {
              console.warn('⚠️ Navigate no funcionó, usando window.location');
              window.location.href = basePath;
            }
          }, 300);
        } catch (error) {
          console.error('❌ Error en navigate, usando window.location:', error);
          window.location.href = basePath;
        }
      }, 100);

    } catch (error: any) {
      console.error('❌ AuthContext: Error en login:', error);
      toast({
        variant: 'destructive',
        title: 'Error de acceso',
        description: error.message || 'No se pudo iniciar sesión',
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [navigate, toast]);

  // ========================================
  // LOGOUT
  // ========================================
  const logout = useCallback(async () => {
    try {
      // Intentar cerrar sesión en el servidor
      await authService.logout();
    } catch (error) {
      console.error('Error al cerrar sesión en servidor:', error);
    } finally {
      // Limpiar siempre localmente, aunque falle el servidor
      clearAuthData();

      toast({
        title: 'Sesión cerrada',
        description: 'Has salido de tu cuenta correctamente',
      });

      navigate('/', { replace: true });
    }
  }, [navigate, toast]);

  // ========================================
  // ACTUALIZAR USUARIO
  // ========================================
  const updateUser = useCallback((data: Partial<AuthUser>) => {
    if (!user) return;

    const updatedUser = { ...user, ...data };
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
    localStorage.setItem('role', updatedUser.rol);
  }, [user]);

  // ========================================
  // REFRESCAR SESIÓN (Renovar Token)
  // ========================================
  const refreshSession = useCallback(async () => {
    try {
      const newToken = await authService.refreshToken();
      setToken(newToken);
      localStorage.setItem('token', newToken);
    } catch (error) {
      console.error('Error al refrescar sesión:', error);
      // Si falla el refresh, cerrar sesión
      await logout();
    }
  }, [logout]);

  // ========================================
  // CONTEXT VALUE
  // ========================================
  const value: AuthContextType = {
    user,
    token,
    isAuthenticated: !!user && !!token,
    isLoading,
    login,
    logout,
    updateUser,
    setAuthData,
    refreshSession,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// ========================================
// HOOK
// ========================================
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
