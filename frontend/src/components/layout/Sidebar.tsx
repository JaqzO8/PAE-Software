// src/components/layout/Sidebar.tsx
import { NavLink, Link } from "react-router-dom";
import { cn } from "../../utils/cn";
import { ScrollArea } from "../../desingSystem/primitives";
import { type LucideIcon, Home, BookOpen } from "lucide-react";
import { BRAND_CONFIG } from "../../config/brandConfig";

export interface SidebarItem {
  label: string;
  to: string;
  icon: LucideIcon;
}

interface SidebarProps {
  className?: string;
  onClose?: () => void;
  items?: SidebarItem[];
  title?: string;
  backRoute?: string; 
}

//Parte del menú de los cursos
const DEFAULT_ITEMS: SidebarItem[] = [
  {
    label: "Panel",
    to: "/",
    icon: Home,
  },
  {
    label: "Cursos",
    to: "/cursos",
    icon: BookOpen,
  },
  {
    label: "Repositorios",
    to: "/repositorios",
    icon: BookOpen, // Si tienes otro icono mejor, lo cambias
  },
  {
    label: "Comunidades",
    to: "/comunidades",
    icon: BookOpen,
  },
  {
    label: "Simulacros",
    to: "/simulacros",
    icon: BookOpen,
  },
];

export function Sidebar({ 
  className, 
  onClose, 
  items, 
  title = BRAND_CONFIG.name,
  backRoute,
}: SidebarProps) {
  const finalItems = items && items.length > 0 ? items : DEFAULT_ITEMS;
  return (
    <aside className={cn("flex h-full w-72 flex-col border-r border-neutral-200 bg-neutral-white", className)}>
      
      <div className="p-6 pb-2">
        {/* 1. Lógica de Encabezado: ¿Mostrar Volver o Logo Principal? */}
        {backRoute ? (
          <Link 
            to={backRoute} 
            onClick={onClose}
            className="flex items-center gap-2 text-neutral-600 hover:text-brand-action transition-colors mb-4 group"
          >
            <div className="h-8 w-8 rounded-lg bg-neutral-100 flex items-center justify-center group-hover:bg-brand-action/10">
              <Home className="h-4 w-4" />
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-medium text-neutral-400">Volver a</span>
              <span className="text-sm font-bold">Inicio</span>
            </div>
          </Link>
        ) : (
          <Link to="/" onClick={onClose} className="flex items-center gap-2 mb-2">
            {/* ✅ Logo unificado */}
            <div className="h-8 w-8 rounded-lg bg-brand-action flex items-center justify-center">
              <span className="text-white font-bold text-sm">
                {BRAND_CONFIG.logo.fallbackIcon}
              </span>
            </div>
            <span className="text-xl font-extrabold text-primary-contrast">{BRAND_CONFIG.name}</span>
          </Link>
        )}

        {/* Título del contexto si es submenú */}
        {backRoute && (
          <h2 className="text-xl font-bold text-primary-contrast px-1 mb-2">{title}</h2>
        )}
      </div>

      <ScrollArea className="flex-1 px-4 py-2">
        <nav className="flex flex-col gap-1">
          {finalItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onClose}
              className={({ isActive }) => cn(
                "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                isActive 
                  ? "bg-primary-contrast/5 text-primary-contrast font-semibold shadow-sm" 
                  : "text-neutral-600 hover:bg-neutral-100 hover:text-primary-contrast"
              )}
            >
              <item.icon className={cn("h-5 w-5")} />
              {item.label}
            </NavLink>
          ))}
        </nav>
      </ScrollArea>
    </aside>
  );
}