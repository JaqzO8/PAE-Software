import { useNavigate } from "react-router-dom";
import { Button, Card } from "../desingSystem/primitives";
import { Home } from "lucide-react";

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="flex h-screen w-full items-center justify-center bg-neutral-50 p-4">
      <Card className="w-full max-w-md p-12 text-center space-y-8 shadow-xl border-neutral-200">
        
        {/* Ilustración Visual del Error */}
        <div className="space-y-2">
          <h1 className="text-8xl font-extrabold text-brand-action tracking-tighter">404</h1>
          <h2 className="text-2xl font-bold text-primary-contrast">Página no encontrada</h2>
          <p className="text-neutral-500 text-lg">
            Parece que te has perdido en el campus. <br/>
            Esta ruta de estudio no existe.
          </p>
        </div>
        
        {/* Botón de Regreso */}
        <div className="flex justify-center">
          <Button 
            size="lg" 
            onClick={() => navigate("/home")}
            className="gap-2 font-semibold"
          >
            <Home className="h-4 w-4" />
            Volver al Dashboard
          </Button>
        </div>
      </Card>
    </div>
  );
}