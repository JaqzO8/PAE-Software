// src/pages/learning/ExamView.tsx
import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Clock, AlertCircle, ChevronLeft, ChevronRight, Flag, CheckCircle } from "lucide-react";
import {
  Card,
  Button,
  Badge,
  Textarea,
} from "../../desingSystem/primitives";
import { submitSimulacro, type SimulacroResult, type SimulacroSubmission } from "../../features/learning/services/learningService";
import { clearActiveExam, loadActiveExam, saveActiveExam } from "../../features/learning/services/activeExamCache";
import { useToast } from "../../hooks/useToast";
import styles from "../../features/learning/components/learning.module.css";

type AnswerValue = number | string | null;

const ExamView = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const cachedExam = loadActiveExam();
  const stateSimulacro = location.state?.simulacro as SimulacroResult | undefined;
  const simulacro = stateSimulacro || cachedExam?.simulacro;
  const shouldRestoreCached = !stateSimulacro && cachedExam?.simulacro.id === simulacro?.id;

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(
    shouldRestoreCached ? cachedExam?.currentQuestionIndex || 0 : 0
  );
  const [answers, setAnswers] = useState<AnswerValue[]>(
    simulacro
      ? shouldRestoreCached
        ? cachedExam?.answers || new Array(simulacro.questions.length).fill(null)
        : new Array(simulacro.questions.length).fill(null)
      : []
  );
  const [timeRemaining, setTimeRemaining] = useState(
    simulacro ? (shouldRestoreCached ? cachedExam?.timeRemaining || simulacro.timeLimit : simulacro.timeLimit) : 0
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [markedForReview, setMarkedForReview] = useState<Set<number>>(new Set());
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);

  // ✅ CORRECCIÓN 1: Usar 'number' en lugar de NodeJS.Timeout para el navegador
  const timerRef = useRef<number | null>(null);

  // Detectar rol del usuario para navegación
  const userRole = localStorage.getItem("role") as "docente" | "estudiante";
  const basePath = userRole === "docente" ? "/docente" : "/estudiante";

  // ✅ CORRECCIÓN 2: Definición única y completa de handleAutoSubmit antes de su uso
  const handleAutoSubmit = useCallback(async () => {
    if (!simulacro) return;

    toast({
      variant: "destructive",
      title: "Tiempo agotado",
      description: "El examen se está enviando automáticamente...",
    });
    
    setIsSubmitting(true);
    try {
      const submission: SimulacroSubmission = {
        simulacroId: simulacro.id,
        answers: answers.map((a) => a ?? -1),
        timeSpent: simulacro.timeLimit - timeRemaining,
      };

      const result = await submitSimulacro(submission);
      clearActiveExam(simulacro.id);
      
      navigate(`${basePath}/aprendizaje/simulacros/resultados`, {
        state: { result },
        replace: true,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo enviar el examen. Intenta nuevamente.",
      });
      setIsSubmitting(false);
    }
  }, [answers, simulacro, timeRemaining, navigate, toast, basePath]);

  useEffect(() => {
    if (!simulacro || isSubmitting) return;
    saveActiveExam({
      simulacro,
      answers,
      currentQuestionIndex,
      timeRemaining,
      updatedAt: new Date().toISOString(),
    });
  }, [answers, currentQuestionIndex, isSubmitting, simulacro, timeRemaining]);

  // Timer
  useEffect(() => {
    if (!simulacro || timeRemaining <= 0) return;

    // Usamos window.setInterval explícitamente para asegurar que devuelve un número
    timerRef.current = window.setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [simulacro, handleAutoSubmit]); // Eliminado timeRemaining de dependencias para evitar renders infinitos

  // Advertencia al salir
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, []);

  if (!simulacro) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="p-8 text-center">
          <AlertCircle className="h-12 w-12 mx-auto mb-4 text-red-500" />
          <h2 className="text-xl font-bold mb-2">Simulacro no encontrado</h2>
          <p className="text-muted-foreground mb-4">
            No hay un examen activo. Por favor inicia uno nuevo.
          </p>
          <Button onClick={() => navigate("/docente/aprendizaje/simulacros")}>
            Volver a Simulacros
          </Button>
        </Card>
      </div>
    );
  }

  const currentQuestion = simulacro.questions[currentQuestionIndex];
  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleAnswerSelect = (optionIndex: number) => {
    const newAnswers = [...answers];
    newAnswers[currentQuestionIndex] = optionIndex;
    setAnswers(newAnswers);
  };

  const handleOpenAnswerChange = (value: string) => {
    const newAnswers = [...answers];
    newAnswers[currentQuestionIndex] = value;
    setAnswers(newAnswers);
  };

  const handleMarkForReview = () => {
    const newMarked = new Set(markedForReview);
    if (newMarked.has(currentQuestionIndex)) {
      newMarked.delete(currentQuestionIndex);
    } else {
      newMarked.add(currentQuestionIndex);
    }
    setMarkedForReview(newMarked);
  };

  const handleNext = () => {
    if (currentQuestionIndex < simulacro.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  // ✅ handleSubmit manual (sin duplicar handleAutoSubmit)
  const handleSubmit = async () => {
    const unanswered = answers.filter((a) => a === null || a === "").length;
    
    if (unanswered > 0 && !showSubmitConfirm) {
      setShowSubmitConfirm(true);
      return;
    }

    setIsSubmitting(true);
    setShowSubmitConfirm(false);
    
    try {
      const submission: SimulacroSubmission = {
        simulacroId: simulacro.id,
        answers: answers.map((a) => a ?? -1),
        timeSpent: simulacro.timeLimit - timeRemaining,
      };

      const result = await submitSimulacro(submission);
      clearActiveExam(simulacro.id);
      
      navigate(`${basePath}/aprendizaje/simulacros/resultados`, {
        state: { result },
        replace: true,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo enviar el examen. Intenta nuevamente.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const answeredCount = answers.filter((a) => a !== null && a !== "").length;
  const isTimeWarning = timeRemaining < 300; // Últimos 5 minutos
  const unansweredCount = answers.filter((a) => a === null || a === "").length;

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Timer Sticky */}
      <div className={`${styles.timerSticky} ${isTimeWarning ? styles.timerWarning : ""}`}>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Clock className={`h-5 w-5 ${isTimeWarning ? "animate-pulse" : ""}`} />
            <span className={styles.timerText}>{formatTime(timeRemaining)}</span>
          </div>
          {isTimeWarning && (
            <Badge className="bg-red-500 text-white animate-pulse">
              ¡Tiempo limitado!
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm">
            <CheckCircle className="h-4 w-4" />
            <span>
              {answeredCount} / {simulacro.questions.length} respondidas
            </span>
          </div>
          {unansweredCount > 0 && (
            <Badge variant="outline" className="text-orange-600 border-orange-600">
              {unansweredCount} sin responder
            </Badge>
          )}
          <Button
            variant="ghost"
            className="text-white hover:bg-white/20"
            onClick={() => setShowSubmitConfirm(true)}
            disabled={isSubmitting}
          >
            Finalizar Examen
          </Button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto p-6 pt-24">
        {/* Navegación de Preguntas */}
        <Card className="mb-6 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-neutral-600">
              Navegación de Preguntas
            </h3>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-green-100 border-2 border-green-500" />
                <span>Respondida</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-orange-100 border-2 border-orange-500" />
                <span>Marcada</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-neutral-100" />
                <span>Sin responder</span>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {simulacro.questions.map((_, index) => {
              const isAnswered = answers[index] !== null && answers[index] !== "";
              const isMarked = markedForReview.has(index);
              const isCurrent = currentQuestionIndex === index;

              return (
                <button
                  key={index}
                  onClick={() => setCurrentQuestionIndex(index)}
                  className={`
                    relative w-10 h-10 rounded-lg font-semibold text-sm transition-all
                    ${isCurrent 
                      ? "bg-brand-action text-white ring-2 ring-brand-action ring-offset-2" 
                      : isAnswered
                      ? "bg-green-100 text-green-700 border-2 border-green-500 hover:bg-green-200"
                      : isMarked
                      ? "bg-orange-100 text-orange-700 border-2 border-orange-500 hover:bg-orange-200"
                      : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200 border border-neutral-300"
                    }
                  `}
                >
                  {index + 1}
                  {isMarked && !isCurrent && (
                    <Flag className="absolute -top-1 -right-1 h-3 w-3 fill-orange-500 text-orange-500" />
                  )}
                </button>
              );
            })}
          </div>
        </Card>

        {/* Pregunta Actual */}
        <Card className="p-8 mb-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <Badge className="mb-4">{currentQuestion.subject}</Badge>
              <h2 className="text-2xl font-bold text-primary-contrast">
                Pregunta {currentQuestionIndex + 1}
              </h2>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleMarkForReview}
              className={markedForReview.has(currentQuestionIndex) ? "bg-orange-100" : ""}
            >
              <Flag className={`h-4 w-4 mr-2 ${markedForReview.has(currentQuestionIndex) ? "fill-orange-500" : ""}`} />
              Marcar
            </Button>
          </div>

          <p className="text-lg text-neutral-700 mb-8 leading-relaxed">
            {currentQuestion.question}
          </p>

          {currentQuestion.type === "abierta" ? (
            <div className="space-y-3">
              <Badge variant="outline">Respuesta abierta</Badge>
              <Textarea
                className="min-h-40 text-base leading-relaxed"
                placeholder="Escribe tu respuesta con claridad y sustento."
                value={typeof answers[currentQuestionIndex] === "string" ? answers[currentQuestionIndex] : ""}
                onChange={(event) => handleOpenAnswerChange(event.target.value)}
              />
              <p className="text-sm text-muted-foreground">
                Esta respuesta sera revisada por un docente y se incorporara al puntaje final.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {currentQuestion.options.map((option, index) => (
                <button
                  key={index}
                  onClick={() => handleAnswerSelect(index)}
                  className={`
                    w-full p-4 rounded-xl border-2 text-left font-medium transition-all
                    ${answers[currentQuestionIndex] === index
                      ? "border-brand-action bg-brand-action/5 text-brand-action"
                      : "border-neutral-200 hover:border-brand-action/50 hover:bg-neutral-50"
                    }
                  `}
                >
                  <div className="flex items-center gap-3">
                    <div className={`
                      w-8 h-8 rounded-full border-2 flex items-center justify-center font-bold
                      ${answers[currentQuestionIndex] === index
                        ? "border-brand-action bg-brand-action text-white"
                        : "border-neutral-300 text-neutral-500"
                      }
                    `}>
                      {String.fromCharCode(65 + index)}
                    </div>
                    <span>{option}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </Card>

        {/* Navegación */}
        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentQuestionIndex === 0}
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Anterior
          </Button>
          <Button
            onClick={handleNext}
            disabled={currentQuestionIndex === simulacro.questions.length - 1}
            className="bg-brand-action hover:bg-brand-action/90"
          >
            Siguiente
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>

      {/* Modal de Confirmación */}
      {showSubmitConfirm && (
        <div 
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setShowSubmitConfirm(false)}
        >
          <Card 
            className="max-w-md w-full p-6 animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-4 mb-6">
              <div className="p-3 bg-orange-100 rounded-full">
                <AlertCircle className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-primary-contrast mb-2">
                  ¿Finalizar el examen?
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {unansweredCount > 0 ? (
                    <>
                      Tienes <strong className="text-orange-600">{unansweredCount} preguntas sin responder</strong>.
                      Las preguntas sin respuesta se contarán como incorrectas.
                    </>
                  ) : (
                    "Has respondido todas las preguntas. ¿Estás listo para enviar tu examen?"
                  )}
                </p>
                <div className="space-y-2 bg-neutral-50 rounded-lg p-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Respondidas:</span>
                    <span className="font-semibold text-green-600">{answeredCount}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Sin responder:</span>
                    <span className="font-semibold text-orange-600">{unansweredCount}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Tiempo usado:</span>
                    <span className="font-semibold text-blue-600">
                      {formatTime(simulacro.timeLimit - timeRemaining)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setShowSubmitConfirm(false)}
                className="flex-1"
                disabled={isSubmitting}
              >
                Seguir Respondiendo
              </Button>
              <Button
                onClick={handleSubmit}
                className="flex-1 bg-brand-action hover:bg-brand-action/90"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Enviando..." : "Finalizar Examen"}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default ExamView;
