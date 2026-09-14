// src/pages/learning/ExamResults.tsx
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Trophy, Clock, Target, TrendingUp, CheckCircle, XCircle, Home, BookmarkPlus, Medal } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Badge,
  Separator,
} from "../../desingSystem/primitives";
import { saveQuestion, type SimulacroScore } from "../../features/learning/services/learningService";
import { useToast } from "../../hooks/useToast";
import styles from "../../features/learning/components/learning.module.css";

const ExamResults = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [savedQuestionIds, setSavedQuestionIds] = useState<Set<string>>(new Set());
  
  const result = location.state?.result as SimulacroScore | undefined;
  const userRole = localStorage.getItem("role") as "docente" | "estudiante" | null;
  const basePath = userRole === "estudiante" ? "/estudiante" : "/docente";

  if (!result) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="p-8 text-center">
          <h2 className="text-xl font-bold mb-2">Resultados no encontrados</h2>
          <p className="text-muted-foreground mb-4">
            No hay resultados para mostrar.
          </p>
          <Button onClick={() => navigate(`${basePath}/aprendizaje/simulacros`)}>
            Volver a Simulacros
          </Button>
        </Card>
      </div>
    );
  }

  const percentage = (result.correctAnswers / result.totalQuestions) * 100;
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const getPerformanceMessage = () => {
    if (result.offlinePending) return "Tu intento quedo guardado en este dispositivo y se sincronizara al recuperar conexion.";
    if (result.requiresManualReview) return "Tu resultado parcial fue registrado. Un docente revisara las respuestas abiertas.";
    if (percentage >= 90) return "¡Excelente! Dominas estos temas a la perfección.";
    if (percentage >= 75) return "¡Muy bien! Estás en buen camino hacia tu meta.";
    if (percentage >= 60) return "Buen trabajo. Con más práctica mejorarás aún más.";
    return "Sigue practicando. Cada intento te acerca más a tu objetivo.";
  };

  const getPerformanceColor = () => {
    if (percentage >= 90) return "text-green-600";
    if (percentage >= 75) return "text-blue-600";
    if (percentage >= 60) return "text-orange-600";
    return "text-red-600";
  };

  const handleSaveQuestion = async (questionId: string) => {
    try {
      await saveQuestion(questionId);
      setSavedQuestionIds((current) => new Set(current).add(questionId));
      toast({ title: "Pregunta guardada", description: "La agregamos a tu repaso personal" });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "No se pudo guardar",
        description: error.response?.data?.message || "Intenta nuevamente",
      });
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 py-12">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header con Puntaje Principal */}
        {result.offlinePending && (
          <Card className="mb-6 border-orange-200 bg-orange-50">
            <CardContent className="p-4">
              <p className="font-semibold text-orange-800">Envio pendiente de sincronizacion</p>
              <p className="text-sm text-orange-700">
                Puedes cerrar esta pantalla. PAE intentara enviar el resultado automaticamente cuando vuelva la conexion.
              </p>
            </CardContent>
          </Card>
        )}

        <Card className="mb-8 overflow-hidden">
          <div className="bg-gradient-to-r from-brand-action to-blue-600 p-8 text-white">
            <div className="flex items-center justify-center mb-4">
              <div className="p-4 bg-white/20 rounded-full backdrop-blur-sm">
                <Trophy className="h-12 w-12" />
              </div>
            </div>
            <h1 className="text-4xl font-bold text-center mb-2">
              ¡Simulacro Completado!
            </h1>
            <p className="text-center text-blue-100 text-lg">
              {getPerformanceMessage()}
            </p>
          </div>

          <CardContent className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {/* Puntaje */}
              <div className="text-center">
                <div className="mb-2">
                  <Target className="h-8 w-8 mx-auto text-brand-action" />
                </div>
                <p className={`text-4xl font-bold ${getPerformanceColor()}`}>
                  {result.score}
                </p>
                <p className="text-sm text-muted-foreground mt-1">Puntos</p>
              </div>

              {/* Correctas */}
              <div className="text-center">
                <div className="mb-2">
                  <CheckCircle className="h-8 w-8 mx-auto text-green-600" />
                </div>
                <p className="text-4xl font-bold text-green-600">
                  {result.correctAnswers}
                </p>
                <p className="text-sm text-muted-foreground mt-1">Correctas</p>
              </div>

              {/* Tiempo */}
              <div className="text-center">
                <div className="mb-2">
                  <Clock className="h-8 w-8 mx-auto text-blue-600" />
                </div>
                <p className="text-4xl font-bold text-blue-600">
                  {formatTime(result.timeSpent)}
                </p>
                <p className="text-sm text-muted-foreground mt-1">Tiempo</p>
              </div>

              {/* Percentil */}
              <div className="text-center">
                <div className="mb-2">
                  <TrendingUp className="h-8 w-8 mx-auto text-purple-600" />
                </div>
                <p className="text-4xl font-bold text-purple-600">
                  {result.percentile}%
                </p>
                <p className="text-sm text-muted-foreground mt-1">Percentil</p>
              </div>
            </div>

            <Separator className="my-6" />

            {/* Barra de Progreso */}
            <div className="mb-4">
              <div className="flex justify-between text-sm mb-2">
                <span className="font-medium">Rendimiento General</span>
                <span className={`font-bold ${getPerformanceColor()}`}>
                  {percentage.toFixed(1)}%
                </span>
              </div>
              <div className="h-4 bg-neutral-200 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-1000 ${
                    percentage >= 90
                      ? "bg-green-500"
                      : percentage >= 75
                      ? "bg-blue-500"
                      : percentage >= 60
                      ? "bg-orange-500"
                      : "bg-red-500"
                  }`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {result.newAchievements && result.newAchievements.length > 0 && (
          <Card className="mb-8 border-amber-200 bg-amber-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-amber-950">
                <Medal className="h-5 w-5" />
                Logros desbloqueados
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-2">
              {result.newAchievements.map((achievement) => (
                <div key={achievement.id} className="rounded-md border border-amber-200 bg-white p-4">
                  <p className="font-semibold text-primary-contrast">{achievement.title}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{achievement.description}</p>
                  <p className="mt-2 text-xs font-semibold text-amber-700">+{achievement.points} puntos</p>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Solucionario Detallado */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-6 w-6 text-brand-action" />
              Solucionario Detallado
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {result.solutions.map((solution, index) => (
              <div key={solution.question.id} className={styles.solutionCard}>
                <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div className="flex flex-wrap items-start gap-3">
                    <Badge
                      className={
                        solution.requiresManualReview
                          ? "bg-blue-100 text-blue-700"
                          : solution.isCorrect
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }
                    >
                      {solution.requiresManualReview ? (
                        <Clock className="h-3 w-3 mr-1" />
                      ) : solution.isCorrect ? (
                        <CheckCircle className="h-3 w-3 mr-1" />
                      ) : (
                        <XCircle className="h-3 w-3 mr-1" />
                      )}
                      {solution.requiresManualReview ? "Por revisar" : solution.isCorrect ? "Correcta" : "Incorrecta"}
                    </Badge>
                    <Badge variant="outline">{solution.question.subject}</Badge>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleSaveQuestion(solution.question.id)}
                    disabled={savedQuestionIds.has(solution.question.id)}
                  >
                    <BookmarkPlus className="h-4 w-4" />
                    {savedQuestionIds.has(solution.question.id) ? "Guardada" : "Guardar"}
                  </Button>
                </div>

                <h3 className={styles.solutionQuestion}>
                  {index + 1}. {solution.question.question}
                </h3>

                {solution.question.type === "abierta" ? (
                  <div className="rounded-md border bg-neutral-50 p-4">
                    <p className="text-xs font-semibold uppercase text-muted-foreground">Tu respuesta</p>
                    <p className="mt-2 whitespace-pre-wrap text-sm text-neutral-700">
                      {solution.userAnswer || "Sin respuesta"}
                    </p>
                  </div>
                ) : (
                  <div className={styles.solutionOptions}>
                    {solution.question.options.map((option, optIndex) => {
                      const isCorrect = optIndex === solution.question.correctAnswer;
                      const isUserAnswer = optIndex === solution.userAnswer;

                      return (
                        <div
                          key={optIndex}
                          className={`${styles.solutionOption} ${
                            isCorrect ? styles.solutionOptionCorrect : ""
                          } ${
                            isUserAnswer && !isCorrect
                              ? styles.solutionOptionIncorrect
                              : ""
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <div className="font-bold">
                              {String.fromCharCode(65 + optIndex)}.
                            </div>
                            <span>{option}</span>
                          </div>
                          {isCorrect && (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          )}
                          {isUserAnswer && !isCorrect && (
                            <XCircle className="h-4 w-4 text-red-600" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Explicación */}
                <div className={styles.solutionExplanation}>
                  <p className="font-semibold mb-2">📚 Explicación:</p>
                  <p>{solution.question.explanation}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Botones de Acción */}
        <div className="flex flex-col md:flex-row gap-4 mt-8 justify-center">
          <Button
            size="lg"
            variant="outline"
            onClick={() => navigate(`${basePath}/aprendizaje/simulacros`)}
            className="gap-2"
          >
            <Home className="h-4 w-4" />
            Volver a Simulacros
          </Button>
          <Button
            size="lg"
            className="bg-brand-action hover:bg-brand-action/90 gap-2"
            onClick={() => navigate(`${basePath}/aprendizaje/simulacros`)}
          >
            <Trophy className="h-4 w-4" />
            Intentar Nuevo Simulacro
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ExamResults;
