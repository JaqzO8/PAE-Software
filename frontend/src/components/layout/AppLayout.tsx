import { Toaster } from "../ui/Toaster";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";

interface AppLayoutProps {
  children: React.ReactNode;
}

export const AppLayout = ({ children }: AppLayoutProps) => {
  return (
    <div className="flex min-h-screen w-full bg-neutral-50">
      
      {/* 1. Sidebar Desktop (Oculto en móvil, Fijo en Desktop) */}
      <div className="hidden md:flex md:w-72 md:flex-col md:fixed md:inset-y-0 z-[80]">
        <Sidebar />
      </div>

      {/* 2. Columna Principal */}
      <div className="flex flex-col flex-1 md:pl-72 transition-all duration-300">
        
        {/* Header Móvil (El componente se encarga de mostrarse solo en móvil) */}
        <Header />

        {/* Área de Contenido Dinámico */}
        <main className="flex-1 p-4 md:p-8 overflow-y-auto">
          <div className="mx-auto max-w-6xl animate-in fade-in duration-500">
            {children}
          </div>
        </main>
      </div>

      {/* 3. Notificaciones Globales */}
      <Toaster />
    </div>
  );
};