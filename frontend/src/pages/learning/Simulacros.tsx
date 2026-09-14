// src/pages/learning/Simulacros.tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ClipboardList, Clock, Zap, Target, AlertCircle } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  Button,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Skeleton,
} from "../../desingSystem/primitives";
import { useSimulacros } from "../../features/learning/hooks/useLearning";
import type { SimulacroConfig } from "../../features/learning/services/learningService";
import styles from "../../features/learning/components/learning.module.css";

type Difficulty = "facil" | "medio" | "dificil";

const Simulacros = () => {
  const navigate = useNavigate();
  const { universities, isLoading, startExam } = useSimulacros();
  const [selectedUniversity, setSelectedUniversity] = useState<string>("");
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty | "">("");
  const [isStarting, setIsStarting] = useState(false);

  // Detectar si es docente o estudiante
  const userRole = localStorage.getItem("role") as "docente" | "estudiante";
  const basePath = userRole === "docente" ? "/docente" : "/estudiante";

  const difficulties = [
    {
      id: "facil",
      title: "Fácil",
      icon: Target,
      description: "Sin límite de tiempo • Preguntas básicas",
      color: "Easy",
    },
    {
      id: "medio",
      title: "Medio",
      icon: Clock,
      description: "2 horas • Nivel estándar de admisión",
      color: "Medium",
    },
    {
      id: "dificil",
      title: "Difícil",
      icon: Zap,
      description: "1h 36min • -20% tiempo • Preguntas complejas",
      color: "Hard",
    },
  ];

  const handleStart = async () => {
    if (!selectedUniversity || !selectedDifficulty) {
      alert("Por favor selecciona una universidad y dificultad");
      return;
    }

    const confirmStart = window.confirm(
      "⚠️ ADVERTENCIA:\n\n" +
      "• El simulacro se cerrará si sales de la página\n" +
      "• El tiempo comenzará a correr inmediatamente\n" +
      "• No podrás pausar el examen\n\n" +
      "¿Estás listo para comenzar?"
    );

    if (!confirmStart) return;

    setIsStarting(true);
    try {
      const config: SimulacroConfig = {
        universityId: selectedUniversity,
        difficulty: selectedDifficulty as Difficulty,
      };
      
      const simulacro = await startExam(config);
      
      // Navegar a la vista del examen con el simulacro
      navigate(`${basePath}/aprendizaje/simulacros/examen`, {
        state: { simulacro },
      });
    } catch (error) {
      console.error("Error al iniciar simulacro:", error);
    } finally {
      setIsStarting(false);
    }
  };

  const canStart = selectedUniversity && selectedDifficulty;

  return (
    <div className={styles.pageContainer}>
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-3 bg-brand-action/10 rounded-xl">
          <ClipboardList className="h-6 w-6 text-brand-action" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-primary-contrast">
            Simulacros de Admisión
          </h1>
          <p className="text-muted-foreground">
            Prepárate con exámenes tipo de las principales universidades del Perú.
          </p>
        </div>
      </div>

      {/* Aviso Importante */}
      <Card className="border-l-4 border-l-brand-action bg-orange-50/50">
        <CardContent className="p-4">
          <div className="flex gap-3">
            <AlertCircle className="h-5 w-5 text-brand-action flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-sm text-primary-contrast mb-1">
                Recomendaciones antes de comenzar:
              </p>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Busca un lugar tranquilo sin distracciones</li>
                <li>• Asegúrate de tener buena conexión a internet</li>
                <li>• Ten papel y lápiz a mano para tus cálculos</li>
                <li>• El simulacro se cerrará si sales de la página</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Selector de Universidad */}
      <Card>
        <CardHeader>
          <CardTitle>1. Selecciona la Universidad</CardTitle>
          <CardDescription>
            Elige la institución a la que deseas postular
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-12 w-full rounded-lg" />
          ) : (
            <Select value={selectedUniversity} onValueChange={setSelectedUniversity}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecciona una universidad..." />
              </SelectTrigger>
              <SelectContent>
                {universities.map((uni) => (
                  <SelectItem key={uni.id} value={uni.id}>
                    {uni.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </CardContent>
      </Card>

      {/* Selector de Dificultad */}
      <Card>
        <CardHeader>
          <CardTitle>2. Elige el Nivel de Dificultad</CardTitle>
          <CardDescription>
            Ajusta el desafío según tu preparación actual
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className={styles.difficultyGrid}>
            {difficulties.map((diff) => {
              const Icon = diff.icon;
              const isSelected = selectedDifficulty === diff.id;
              
              return (
                <div
                  key={diff.id}
                  onClick={() => setSelectedDifficulty(diff.id as Difficulty)}
                  className={`
                    ${styles.difficultyCard}
                    ${styles[`difficultyCard${diff.color}`]}
                    ${isSelected ? styles.difficultyCardActive : ""}
                  `}
                >
                  <div
                    className={`
                      ${styles.difficultyIcon}
                      ${styles[`difficultyIcon${diff.color}`]}
                    `}
                  >
                    <Icon className="h-8 w-8" />
                  </div>
                  <h3 className={styles.difficultyTitle}>{diff.title}</h3>
                  <p className={styles.difficultyDescription}>{diff.description}</p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Botón de Inicio */}
      <div className="flex justify-center pt-4">
        <Button
          size="lg"
          onClick={handleStart}
          disabled={!canStart || isStarting}
          className="bg-brand-action hover:bg-brand-action/90 text-white text-lg px-12 py-6 h-auto"
        >
          {isStarting ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3" />
              Preparando simulacro...
            </>
          ) : (
            <>
              <ClipboardList className="h-5 w-5 mr-2" />
              Comenzar Simulacro
            </>
          )}
        </Button>
      </div>

      {/* Información Adicional */}
      <Card className="bg-neutral-50/50">
        <CardContent className="p-6">
          <h3 className="font-semibold text-primary-contrast mb-3">
            ¿Qué incluye el simulacro?
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex gap-3">
              <div className="w-10 h-10 rounded-lg bg-brand-action/10 flex items-center justify-center flex-shrink-0">
                <ClipboardList className="h-5 w-5 text-brand-action" />
              </div>
              <div>
                <p className="font-medium text-sm text-primary-contrast">20 Preguntas</p>
                <p className="text-xs text-muted-foreground">
                  Matemáticas, Comunicación, Historia y más
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-10 h-10 rounded-lg bg-brand-action/10 flex items-center justify-center flex-shrink-0">
                <Target className="h-5 w-5 text-brand-action" />
              </div>
              <div>
                <p className="font-medium text-sm text-primary-contrast">Resultados Inmediatos</p>
                <p className="text-xs text-muted-foreground">
                  Conoce tu puntaje al finalizar
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-10 h-10 rounded-lg bg-brand-action/10 flex items-center justify-center flex-shrink-0">
                <AlertCircle className="h-5 w-5 text-brand-action" />
              </div>
              <div>
                <p className="font-medium text-sm text-primary-contrast">Solucionario Completo</p>
                <p className="text-xs text-muted-foreground">
                  Explicación detallada de cada pregunta
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Simulacros;