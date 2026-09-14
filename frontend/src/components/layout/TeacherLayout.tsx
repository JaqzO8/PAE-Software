import { useState } from "react";
import { useLocation } from "react-router-dom";
import { Menu } from "lucide-react";
import { Toaster } from "../ui/Toaster";
import { Sidebar } from "./Sidebar";
import { 
  Sheet, 
  SheetContent, 
  SheetTrigger, 
  SheetHeader, 
  SheetTitle, 
  SheetDescription 
} from "../../desingSystem/primitives/Sheet";
import { Button } from "../../desingSystem/primitives";
import { useIsMobile } from "../../hooks/useMobile";
import { BRAND_CONFIG } from "../../config/brandConfig";

// Importamos todos los menús
import { 
  TEACHER_MAIN_MENU, 
  REPO_MENU_TEACHER, 
  GROUPS_MENU_TEACHER,
  LEARNING_MENU_TEACHER,
} from "../../config/menus";

interface Props {
  children: React.ReactNode;
}

export const TeacherLayout = ({ children }: Props) => {
  const isMobile = useIsMobile();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();

  // --- LÓGICA DE SELECCIÓN DE MENÚ ---
  
  const pathname = location.pathname;

  let currentMenu = TEACHER_MAIN_MENU;
  let sidebarTitle: string = BRAND_CONFIG.name;
  let backRoute: string | undefined = undefined;

  // 1️COMUNIDADES
  if (pathname.startsWith("/docente/grupos")) {
    currentMenu = GROUPS_MENU_TEACHER;
    sidebarTitle = "Comunidades";
    backRoute = "/docente";
  }

  // 2️REPOSITORIOS
  else if (pathname.startsWith("/docente/repositorios")) {
    currentMenu = REPO_MENU_TEACHER;
    sidebarTitle = "Repositorio";
    backRoute = "/docente";
  }

  else if (pathname.startsWith("/docente/aprendizaje")) {
    currentMenu = LEARNING_MENU_TEACHER;
    sidebarTitle = "Aprendizaje";
    backRoute = "/docente";
  }

  return (
    <div className="flex min-h-screen w-full bg-neutral-50">
      {/* Sidebar Desktop */}
      <div className="hidden md:flex md:w-72 md:flex-col md:fixed md:inset-y-0 z-[80]">
        <Sidebar 
          className="bg-white border-r-neutral-200" 
          items={currentMenu} 
          title={sidebarTitle}
          backRoute={backRoute}
        /> 
      </div>

      <div className="flex flex-col flex-1 md:pl-72 transition-all duration-300">
        {isMobile && (
           <header className="sticky top-0 z-40 flex h-16 items-center gap-4 border-b bg-white px-6 shadow-sm md:hidden">
             <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
               <SheetTrigger asChild>
                 <Button variant="ghost" size="icon" className="-ml-2">
                   <Menu className="h-6 w-6 text-primary-contrast" />
                 </Button>
               </SheetTrigger>
               <SheetContent side="left" className="p-0 w-72">
                 <SheetHeader className="sr-only">
                   <SheetTitle>Menú de Navegación</SheetTitle>
                   <SheetDescription>
                     Acceso a las opciones principales del panel.
                   </SheetDescription>
                 </SheetHeader>

                 <Sidebar 
                   onClose={() => setIsSidebarOpen(false)} 
                   items={currentMenu} 
                   title={sidebarTitle}
                   backRoute={backRoute}
                 />
               </SheetContent>
             </Sheet>
             
             {/* Logo de marca en móvil */}
             <div className="flex items-center gap-2 font-bold text-lg text-primary-contrast">
               <div className="h-6 w-6 rounded bg-brand-action flex items-center justify-center">
                 <span className="text-white text-xs font-extrabold">
                   {BRAND_CONFIG.logo.fallbackIcon}
                 </span>
               </div>
               <span>{BRAND_CONFIG.name}</span>
             </div>
           </header>
        )}

        <main className="flex-1 p-4 md:p-8 overflow-y-auto">
          <div className="mx-auto max-w-7xl animate-in fade-in duration-500">
            {children}
          </div>
        </main>
      </div>
      <Toaster />
    </div>
  );
};
