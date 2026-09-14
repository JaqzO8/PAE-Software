// src/features/learning/components/CreateRoomModal.tsx
import { useState } from "react";
import { X, Users, Zap } from "lucide-react";
import {
  Button,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../desingSystem/primitives";
import type { CreateRoomData } from "../services/learningService";

interface CreateRoomModalProps {
  onClose: () => void;
  onCreate: (data: CreateRoomData) => Promise<void>;
}

export function CreateRoomModal({ onClose, onCreate }: CreateRoomModalProps) {
  const [formData, setFormData] = useState<CreateRoomData>({
    topic: "",
    difficulty: "medio",
    maxPlayers: 4,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.topic.trim()) {
      alert("Por favor ingresa un tema para la sala");
      return;
    }

    setIsSubmitting(true);
    try {
      await onCreate(formData);
      onClose();
    } catch (error) {
      console.error("Error al crear sala:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-brand-action to-blue-600 p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-2xl font-bold">Crear Sala de Desafío</h2>
            <button
              onClick={onClose}
              className="hover:bg-white/20 rounded-full p-1 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <p className="text-blue-100 text-sm">
            Configura tu sala y espera a que otros jugadores se unan
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Tema */}
          <div>
            <Label htmlFor="topic" className="text-sm font-semibold mb-2 block">
              Tema del Desafío
            </Label>
            <Input
              id="topic"
              placeholder="Ej: Matemáticas - Álgebra Básica"
              value={formData.topic}
              onChange={(e) =>
                setFormData({ ...formData, topic: e.target.value })
              }
              className="w-full"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Sé específico para atraer jugadores interesados
            </p>
          </div>

          {/* Dificultad */}
          <div>
            <Label htmlFor="difficulty" className="text-sm font-semibold mb-2 block">
              Nivel de Dificultad
            </Label>
            <Select
              value={formData.difficulty}
              onValueChange={(value: any) =>
                setFormData({ ...formData, difficulty: value })
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="facil">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                    Fácil
                  </div>
                </SelectItem>
                <SelectItem value="medio">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-orange-500" />
                    Medio
                  </div>
                </SelectItem>
                <SelectItem value="dificil">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500" />
                    Difícil
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Número de Jugadores */}
          <div>
            <Label htmlFor="maxPlayers" className="text-sm font-semibold mb-2 block">
              Número Máximo de Jugadores
            </Label>
            <div className="grid grid-cols-3 gap-3">
              {[2, 3, 4].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setFormData({ ...formData, maxPlayers: num })}
                  className={`
                    p-4 rounded-xl border-2 transition-all font-semibold
                    ${
                      formData.maxPlayers === num
                        ? "border-brand-action bg-brand-action/10 text-brand-action"
                        : "border-neutral-200 hover:border-neutral-300"
                    }
                  `}
                >
                  <Users className="h-5 w-5 mx-auto mb-1" />
                  {num}
                </button>
              ))}
            </div>
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 border-l-4 border-brand-action rounded p-4">
            <div className="flex gap-3">
              <Zap className="h-5 w-5 text-brand-action flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-sm text-primary-contrast mb-1">
                  Consejos para una buena partida:
                </p>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>• Elige un tema que domines para ayudar a otros</li>
                  <li>• El nivel medio es ideal para aprendizaje</li>
                  <li>• 4 jugadores = más competencia = más diversión</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Botones */}
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-brand-action hover:bg-brand-action/90"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Creando..." : "Crear Sala"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
