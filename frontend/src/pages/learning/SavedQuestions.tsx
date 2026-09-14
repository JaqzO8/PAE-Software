import { useEffect, useMemo, useState } from "react";
import { BookmarkCheck, CheckCircle2, Search, Trash2 } from "lucide-react";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Skeleton,
} from "../../desingSystem/primitives";
import { useToast } from "../../hooks/useToast";
import {
  deleteSavedQuestion,
  getSavedQuestions,
  type SavedQuestionItem,
} from "../../features/learning/services/learningService";
import styles from "../../features/learning/components/learning.module.css";

const SavedQuestions = () => {
  const { toast } = useToast();
  const [items, setItems] = useState<SavedQuestionItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [removingId, setRemovingId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [difficulty, setDifficulty] = useState("all");

  useEffect(() => {
    loadSavedQuestions();
  }, []);

  const loadSavedQuestions = async () => {
    setIsLoading(true);
    try {
      setItems(await getSavedQuestions());
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "No se pudo cargar el repaso",
        description: error.response?.data?.message || "Intenta nuevamente en unos segundos",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filteredItems = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return items.filter((item) => {
      const question = item.pregunta;
      const matchesDifficulty = difficulty === "all" || question.dificultad === difficulty;
      const searchable = [
        question.enunciado,
        question.materia,
        question.tema,
        question.explicacion,
        question.universidad?.nombre,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return matchesDifficulty && (!normalizedSearch || searchable.includes(normalizedSearch));
    });
  }, [difficulty, items, search]);

  const handleDelete = async (item: SavedQuestionItem) => {
    const questionId = item.pregunta.id_pregunta || item.id_pregunta;
    setRemovingId(item.id_guardado);
    try {
      await deleteSavedQuestion(questionId);
      setItems((current) => current.filter((saved) => saved.id_guardado !== item.id_guardado));
      toast({ title: "Pregunta retirada", description: "Ya no aparecera en tu repaso" });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "No se pudo retirar",
        description: error.response?.data?.message || "La pregunta sigue guardada",
      });
    } finally {
      setRemovingId(null);
    }
  };

  const formatDate = (value?: string) => {
    if (!value) return "Guardada recientemente";
    return new Intl.DateTimeFormat("es-PE", { dateStyle: "medium" }).format(new Date(value));
  };

  return (
    <div className={styles.pageContainer}>
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-brand-action/10 p-3">
            <BookmarkCheck className="h-6 w-6 text-brand-action" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-primary-contrast">Preguntas Guardadas</h1>
            <p className="text-muted-foreground">
              Revisa los ejercicios marcados desde tus simulacros y fortalece tus temas debiles.
            </p>
          </div>
        </div>
        <Badge variant="outline" className="w-fit">
          {items.length} guardadas
        </Badge>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="grid gap-3 md:grid-cols-[1fr_180px_auto]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-10"
                placeholder="Buscar por enunciado, curso o tema"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>
            <Select value={difficulty} onValueChange={setDifficulty}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="facil">Facil</SelectItem>
                <SelectItem value="medio">Medio</SelectItem>
                <SelectItem value="dificil">Dificil</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={loadSavedQuestions} disabled={isLoading}>
              Actualizar
            </Button>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-40 w-full rounded-lg" />
          <Skeleton className="h-40 w-full rounded-lg" />
        </div>
      ) : filteredItems.length === 0 ? (
        <Card>
          <CardContent className="flex min-h-52 flex-col items-center justify-center gap-3 p-8 text-center">
            <BookmarkCheck className="h-10 w-10 text-muted-foreground" />
            <div>
              <p className="font-semibold text-primary-contrast">Aun no hay preguntas para este filtro</p>
              <p className="text-sm text-muted-foreground">
                Guarda preguntas desde el solucionario de un simulacro para construir tu repaso.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredItems.map((item, index) => {
            const question = item.pregunta;
            const correctAnswer = question.respuesta_correcta ?? -1;

            return (
              <Card key={item.id_guardado}>
                <CardHeader className="gap-3">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div className="space-y-2">
                      <div className="flex flex-wrap gap-2">
                        <Badge>{question.materia}</Badge>
                        <Badge variant="outline">{question.dificultad}</Badge>
                        {question.tema && <Badge variant="outline">{question.tema}</Badge>}
                        {question.universidad?.nombre && (
                          <Badge variant="outline">{question.universidad.nombre}</Badge>
                        )}
                      </div>
                      <CardTitle className="text-lg leading-snug">
                        {index + 1}. {question.enunciado}
                      </CardTitle>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(item)}
                      disabled={removingId === item.id_guardado}
                    >
                      <Trash2 className="h-4 w-4" />
                      Retirar
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">Guardada: {formatDate(item.created_at)}</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  {question.tipo === "abierta" ? (
                    <div className="rounded-md border bg-neutral-50 p-4">
                      <p className="text-xs font-semibold uppercase text-muted-foreground">Respuesta esperada</p>
                      <p className="mt-2 whitespace-pre-wrap text-sm text-neutral-700">
                        {question.respuesta_texto || "Respuesta pendiente de referencia"}
                      </p>
                    </div>
                  ) : (
                    <div className="grid gap-2">
                      {question.opciones.map((option, optionIndex) => {
                        const isCorrect = optionIndex === correctAnswer;

                        return (
                          <div
                            key={`${item.id_guardado}-${optionIndex}`}
                            className={`flex items-center justify-between rounded-md border p-3 text-sm ${
                              isCorrect ? "border-green-300 bg-green-50 text-green-800" : "bg-white"
                            }`}
                          >
                            <span>
                              <strong>{String.fromCharCode(65 + optionIndex)}.</strong> {option}
                            </span>
                            {isCorrect && <CheckCircle2 className="h-4 w-4 text-green-600" />}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {question.explicacion && (
                    <div className="rounded-md border border-blue-100 bg-blue-50 p-4 text-sm text-blue-900">
                      <p className="font-semibold">Explicacion</p>
                      <p className="mt-1">{question.explicacion}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default SavedQuestions;
