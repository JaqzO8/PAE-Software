// src/components/layout/Header.tsx
import { useState } from "react";
import { Menu } from "lucide-react";
import { Button } from "../../desingSystem/primitives/Button";
import { Sheet, SheetContent, SheetTrigger } from "../../desingSystem/primitives/Sheet";
import { Sidebar } from "./Sidebar";
import { BRAND_CONFIG } from "../../config/brandConfig";

export function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center gap-4 border-b bg-neutral-white px-6 shadow-sm md:hidden">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="-ml-2">
            <Menu className="h-6 w-6 text-primary-contrast" />
            <span className="sr-only">Abrir menú</span>
          </Button>
        </SheetTrigger>
        
        {/* Contenido del Menú Móvil */}
        <SheetContent side="left" className="p-0 w-72">
          <Sidebar onClose={() => setOpen(false)} />
        </SheetContent>
      </Sheet>

      {/* ✅ CORRECCIÓN: Logo unificado usando brandConfig */}
      <div className="flex items-center gap-2 font-bold text-lg text-primary-contrast">
        <div className="h-6 w-6 rounded bg-brand-action flex items-center justify-center">
          <span className="text-white text-xs font-extrabold">
            {BRAND_CONFIG.logo.fallbackIcon}
          </span>
        </div>
        <span>{BRAND_CONFIG.name}</span>
      </div>
    </header>
  );
}