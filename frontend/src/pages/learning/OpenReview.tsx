import { useEffect, useMemo, useState } from "react";
import { ClipboardCheck, RefreshCw, Save } from "lucide-react";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
} from "../../desingSystem/primitives";
import { useToast } from "../../hooks/useToast";
import {
  getOpenAnswerReviews,
  reviewOpenAnswer,
  type OpenAnswerReview,
} from "../../features/learning/services/learningService";
import styles from "../../features/learning/components/learning.module.css";

const OpenReview = () => {
  const { toast } = useToast();
  const [reviews, setReviews] = useState<OpenAnswerReview[]>([]);
  const [status, setStatus] = useState<"pendiente" | "revisado" | "all">("pendiente");
  const [scores, setScores] = useState<Record<number, string>>({});
  const [feedback, setFeedback] = useState<Record<number, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [savingId, setSavingId] = useState<number | null>(null);

  const loadReviews = async () => {
    setIsLoading(true);
    try {
      const data = await getOpenAnswerReviews(status);
      setReviews(data);
      setScores(Object.fromEntries(data.map((item) => [item.id_revision, item.puntaje?.toString() || ""])));
      setFeedback(Object.fromEntries(data.map((item) => [item.id_revision, item.feedback || ""])));
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.response?.data?.message || "No se pudieron cargar las revisiones",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadReviews();
  }, [status]);

  const summary = useMemo(() => {
    const pending = reviews.filter((item) => item.estado === "pendiente").length;
    const reviewed = reviews.filter((item) => item.estado === "revisado").length;
    return { pending, reviewed };
  }, [reviews]);

  const saveReview = async (review: OpenAnswerReview) => {
    const puntaje = Number(scores[review.id_revision]);
    if (!Number.isFinite(puntaje) || puntaje < 0 || puntaje > 5) {
      toast({
        variant: "destructive",
        title: "Puntaje invalido",
        description: "Usa un valor entre 0 y 5.",
      });
      return;
    }

    setSavingId(review.id_revision);
    try {
      const updated = await reviewOpenAnswer(review.id_intento, review.id_pregunta, {
        puntaje,
        feedback: feedback[review.id_revision],
      });
      setReviews((prev) => prev.map((item) => (
        item.id_revision === review.id_revision
          ? { ...item, ...updated, puntaje, feedback: feedback[review.id_revision], estado: "revisado" }
          : item
      )));
      toast({ title: "Revision guardada", description: "El puntaje del simulacro fue actualizado." });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.response?.data?.message || "No se pudo guardar la revision",
      });
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className={styles.pageContainer}>
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-brand-action/10 p-3">
            <ClipboardCheck className="h-6 w-6 text-brand-action" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-primary-contrast">Revision de Abiertas</h1>
            <p className="text-muted-foreground">Califica respuestas abiertas de simulacros y agrega feedback docente.</p>
          </div>
        </div>
        <Button variant="outline" onClick={loadReviews} disabled={isLoading}>
          <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          Actualizar
        </Button>
      </div>

      <Card>
        <CardContent className="grid gap-4 p-4 md:grid-cols-[240px_1fr] md:items-center">
          <Select value={status} onValueChange={(value: any) => setStatus(value)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="pendiente">Pendientes</SelectItem>
              <SelectItem value="revisado">Revisadas</SelectItem>
              <SelectItem value="all">Todas</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">{summary.pending} pendientes</Badge>
            <Badge variant="secondary">{summary.reviewed} revisadas</Badge>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4">
        {reviews.map((review) => (
          <Card key={review.id_revision}>
            <CardHeader>
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <CardTitle className="text-lg">{review.pregunta?.materia || "Pregunta abierta"}</CardTitle>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Badge variant={review.estado === "pendiente" ? "outline" : "secondary"}>
                      {review.estado === "pendiente" ? "Pendiente" : "Revisada"}
                    </Badge>
                    {review.intento?.universidad && <Badge variant="outline">{review.intento.universidad}</Badge>}
                    {review.pregunta?.dificultad && <Badge variant="outline">{review.pregunta.dificultad}</Badge>}
                    <Badge variant="outline">Intento #{review.id_intento}</Badge>
                  </div>
                </div>
                <div className="grid w-full grid-cols-[96px_1fr] gap-2 md:w-72">
                  <div className="space-y-2">
                    <Label>Puntaje</Label>
                    <Input
                      type="number"
                      min={0}
                      max={5}
                      step={1}
                      value={scores[review.id_revision] || ""}
                      onChange={(event) => setScores((prev) => ({ ...prev, [review.id_revision]: event.target.value }))}
                    />
                  </div>
                  <div className="flex items-end">
                    <Button
                      className="w-full bg-brand-action hover:bg-brand-action/90"
                      onClick={() => saveReview(review)}
                      disabled={savingId === review.id_revision}
                    >
                      <Save className="h-4 w-4" />
                      {savingId === review.id_revision ? "Guardando" : "Guardar"}
                    </Button>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="grid gap-4 lg:grid-cols-[1fr_360px]">
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-semibold text-primary-contrast">Enunciado</p>
                  <p className="mt-2 text-neutral-700">{review.pregunta?.enunciado}</p>
                </div>
                <div className="rounded-md border bg-neutral-50 p-4">
                  <p className="text-xs font-semibold uppercase text-muted-foreground">Respuesta del estudiante</p>
                  <p className="mt-2 whitespace-pre-wrap text-sm text-neutral-700">{review.respuesta_texto}</p>
                </div>
              </div>
              <div className="space-y-4">
                {review.pregunta?.respuesta_texto && (
                  <div className="rounded-md border p-4">
                    <p className="text-xs font-semibold uppercase text-muted-foreground">Respuesta esperada</p>
                    <p className="mt-2 text-sm text-neutral-700">{review.pregunta.respuesta_texto}</p>
                  </div>
                )}
                <div className="space-y-2">
                  <Label>Feedback</Label>
                  <Textarea
                    className="min-h-28"
                    value={feedback[review.id_revision] || ""}
                    onChange={(event) => setFeedback((prev) => ({ ...prev, [review.id_revision]: event.target.value }))}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {!isLoading && reviews.length === 0 && (
          <div className="rounded-md border border-dashed bg-white p-10 text-center text-muted-foreground">
            No hay respuestas abiertas para este filtro.
          </div>
        )}
      </div>
    </div>
  );
};

export default OpenReview;
