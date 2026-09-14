// src/components/layout/ProtectedRoute.tsx

import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Skeleton } from '../../desingSystem/primitives';

interface ProtectedRouteProps {
  allowedRoles: Array<'docente' | 'estudiante' | 'admin'>;
}

export const ProtectedRoute = ({ allowedRoles }: ProtectedRouteProps) => {
  const { user, isAuthenticated, isLoading } = useAuth();

  // Mostrar loading mientras se verifica autenticación
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-neutral-50">
        <div className="space-y-4 w-full max-w-md p-8">
          <Skeleton className="h-12 w-full rounded-xl" />
          <Skeleton className="h-64 w-full rounded-xl" />
          <Skeleton className="h-12 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  // Si no está autenticado, redirigir al login
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  // Si el rol no está permitido, redirigir al dashboard correspondiente
  if (!allowedRoles.includes(user.rol)) {
    const redirectPath = user.rol === 'docente' 
      ? '/docente' 
      : user.rol === 'estudiante'
      ? '/estudiante/explorar'
      : '/';
    
    return <Navigate to={redirectPath} replace />;
  }

  // Usuario autenticado y autorizado
  return <Outlet />;
};