// src/components/layout/PublicRoute.tsx

import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { Skeleton } from "../../desingSystem/primitives"; // Asegúrate de que la ruta sea correcta

export const PublicRoute = () => {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Skeleton className="h-12 w-48" />
      </div>
    );
  }

  // Si YA está autenticado, lo mandamos a su casa (Dashboard)
  if (isAuthenticated && user) {
    if (user.rol === "docente") return <Navigate to="/docente" replace />;
    if (user.rol === "estudiante") return <Navigate to="/estudiante" replace />;
  }

  // Si NO está autenticado, le dejamos ver el Login/Registro
  return <Outlet />;
};
