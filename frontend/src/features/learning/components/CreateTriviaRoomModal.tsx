// src/features/learning/components/CreateTriviaRoomModal.tsx
import { useState } from "react";
import { X, Zap, Users } from "lucide-react";
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
import type { CreateTriviaRoomData } from "../services/learningService";

interface CreateTriviaRoomModalProps {
  onClose: () => void;
  onCreate: (data: CreateTriviaRoomData) => Promise<void>;
}

export function CreateTriviaRoomModal({ onClose, onCreate }: CreateTriviaRoomModalProps) {
  const [formData, setFormData] = useState<CreateTriviaRoomData>({
    topic: "",
    questionsCount: 5,
    maxPlayers: 4,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.topic.trim()) {
      alert("Por favor ingresa un tema para la trivia");
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
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-2xl font-bold">Crear Sala de Trivia</h2>
            <button
              onClick={onClose}
              className="hover:bg-white/20 rounded-full p-1 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <p className="text-purple-100 text-sm">
            Configura tu trivia y compite con otros estudiantes
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Tema */}
          <div>
            <Label htmlFor="topic" className="text-sm font-semibold mb-2 block">
              Tema de la Trivia
            </Label>
            <Input
              id="topic"
              placeholder="Ej: Historia del Perú - Época Colonial"
              value={formData.topic}
              onChange={(e) =>
                setFormData({ ...formData, topic: e.target.value })
              }
              className="w-full"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Elige un tema específico para las preguntas
            </p>
          </div>

          {/* Número de Preguntas */}
          <div>
            <Label htmlFor="questionsCount" className="text-sm font-semibold mb-2 block">
              Número de Preguntas
            </Label>
            <Select
              value={formData.questionsCount.toString()}
              onValueChange={(value) =>
                setFormData({ ...formData, questionsCount: parseInt(value) })
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5 preguntas (5 min)</SelectItem>
                <SelectItem value="10">10 preguntas (10 min)</SelectItem>
                <SelectItem value="15">15 preguntas (15 min)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Número de Jugadores */}
          <div>
            <Label htmlFor="maxPlayers" className="text-sm font-semibold mb-2 block">
              Número Máximo de Jugadores
            </Label>
            <div className="grid grid-cols-4 gap-3">
              {[2, 3, 4, 5].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setFormData({ ...formData, maxPlayers: num })}
                  className={`
                    p-4 rounded-xl border-2 transition-all font-semibold
                    ${
                      formData.maxPlayers === num
                        ? "border-purple-600 bg-purple-50 text-purple-600"
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
          <div className="bg-purple-50 border-l-4 border-purple-600 rounded p-4">
            <div className="flex gap-3">
              <Zap className="h-5 w-5 text-purple-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-sm text-primary-contrast mb-1">
                  Características de la Trivia:
                </p>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>• Las respuestas rápidas dan más puntos</li>
                  <li>• Cada pregunta tiene 30 segundos máximo</li>
                  <li>• El ganador es quien más puntos acumula</li>
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
              className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
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