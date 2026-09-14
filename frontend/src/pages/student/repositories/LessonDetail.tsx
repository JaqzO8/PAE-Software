import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
    AlertTriangle, ArrowLeft, BookOpen, CheckCircle2, Download, FileQuestion,
    GitBranch, PlayCircle, Sparkles
} from "lucide-react";
import {
    Badge, Button, Card, CardContent, CardHeader, CardTitle,
    Skeleton, Tabs, TabsContent, TabsList, TabsTrigger
} from "../../../desingSystem/primitives";
import { useToast } from "../../../hooks/useToast";
import {
    completeLesson,
    downloadLessonMaterial,
    getLessonById,
    getLessonConceptMap,
    getLessonSolution,
    getLessonSummary,
    startLesson,
    trackLessonTime,
    type Lesson
} from "../../../features/lessons/services/lessonService";

export default function StudentLessonDetail() {
    const { lessonId } = useParams<{ lessonId: string }>();
    const navigate = useNavigate();
    const { toast } = useToast();
    const [lesson, setLesson] = useState<Lesson | null>(null);
    const [summary, setSummary] = useState<string>("");
    const [solution, setSolution] = useState<any[]>([]);
    const [conceptMap, setConceptMap] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [startedAt, setStartedAt] = useState<number>(Date.now());
    const [baseTrackedSeconds, setBaseTrackedSeconds] = useState(0);
    const [isTracking, setIsTracking] = useState(false);
    const [timeTick, setTimeTick] = useState(0);

    const completed = useMemo(() => Boolean(lesson?.progress?.completada), [lesson]);
    const currentTrackedSeconds = useMemo(() => {
        if (!isTracking || completed) return baseTrackedSeconds;
        return baseTrackedSeconds + Math.max(0, Math.round((Date.now() - startedAt) / 1000));
    }, [baseTrackedSeconds, completed, isTracking, startedAt, timeTick]);
    const shouldRest = useMemo(() => {
        const lessonLimit = Math.max(30 * 60, (lesson?.duracion_minutos || 0) * 60 * 1.5);
        return !completed && currentTrackedSeconds >= lessonLimit;
    }, [completed, currentTrackedSeconds, lesson?.duracion_minutos]);

    useEffect(() => {
        loadLesson();
    }, [lessonId]);

    useEffect(() => {
        if (!lessonId || !isTracking || completed) return undefined;

        const interval = window.setInterval(async () => {
            const elapsed = baseTrackedSeconds + Math.max(0, Math.round((Date.now() - startedAt) / 1000));
            try {
                await trackLessonTime(lessonId, elapsed);
            } catch (error) {
                console.warn("No se pudo registrar el tiempo de estudio", error);
            }
        }, 60000);

        return () => window.clearInterval(interval);
    }, [baseTrackedSeconds, completed, isTracking, lessonId, startedAt]);

    useEffect(() => {
        if (!isTracking || completed) return undefined;
        const interval = window.setInterval(() => setTimeTick((value) => value + 1), 30000);
        return () => window.clearInterval(interval);
    }, [completed, isTracking]);

    const loadLesson = async () => {
        if (!lessonId) return;
        setIsLoading(true);
        try {
            const data = await getLessonById(lessonId);
            setLesson(data);
            const tracked = data.progress?.tiempo_segundos || 0;
            setBaseTrackedSeconds(tracked);
            setStartedAt(Date.now());
            setIsTracking(Boolean(data.progress && !data.progress.completada));
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Error",
                description: error.response?.data?.message || "No se pudo cargar la leccion",
            });
            navigate(-1);
        } finally {
            setIsLoading(false);
        }
    };

    const handleStart = async () => {
        if (!lessonId) return;
        const progress = await startLesson(lessonId);
        setBaseTrackedSeconds(progress.tiempo_segundos || 0);
        setStartedAt(Date.now());
        setIsTracking(true);
        toast({ title: "Leccion iniciada" });
        loadLesson();
    };

    const handleComplete = async () => {
        if (!lessonId) return;
        const elapsed = Math.max(30, baseTrackedSeconds + Math.round((Date.now() - startedAt) / 1000));
        if (isTracking) {
            await trackLessonTime(lessonId, elapsed);
        }
        await completeLesson(lessonId, { puntuacion: 100, tiempo_segundos: elapsed });
        setIsTracking(false);
        toast({ title: "Leccion completada", description: "Ya puedes acceder al resumen, solucionario y material PDF" });
        loadLesson();
    };

    const guardedAction = async (action: () => Promise<void>) => {
        try {
            await action();
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Acceso no disponible",
                description: error.response?.data?.message || "Completa la leccion para acceder a esta funcion",
            });
        }
    };

    if (isLoading) {
        return (
            <div className="space-y-4 max-w-5xl mx-auto">
                <Skeleton className="h-10 w-64" />
                <Skeleton className="h-72 w-full" />
            </div>
        );
    }

    if (!lesson) return null;

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            <Button variant="ghost" className="pl-0 gap-2" onClick={() => navigate(-1)}>
                <ArrowLeft className="h-4 w-4" /> Volver
            </Button>

            <Card>
                <CardContent className="p-6">
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                        <div className="space-y-3">
                            <div className="flex flex-wrap items-center gap-2">
                                <Badge variant="secondary">{lesson.dificultad}</Badge>
                                <Badge variant={completed ? "default" : "outline"}>
                                    {completed ? "Completada" : `${lesson.duracion_minutos} min`}
                                </Badge>
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold text-primary-contrast">{lesson.titulo}</h1>
                                {lesson.descripcion && (
                                    <p className="mt-2 text-muted-foreground">{lesson.descripcion}</p>
                                )}
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <Button variant="outline" onClick={handleStart}>
                                <PlayCircle className="h-4 w-4" /> Iniciar
                            </Button>
                            <Button className="bg-brand-action" onClick={handleComplete}>
                                <CheckCircle2 className="h-4 w-4" /> Completar
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {shouldRest && (
                <Card className="border-amber-200 bg-amber-50 text-amber-950">
                    <CardContent className="flex items-start gap-3 p-4">
                        <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0" />
                        <div>
                            <p className="font-semibold">Pausa sugerida</p>
                            <p className="text-sm">
                                Llevas {Math.round(currentTrackedSeconds / 60)} minutos en esta leccion. Toma un descanso breve antes de continuar.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            )}

            <Tabs defaultValue="contenido">
                <TabsList className="grid h-auto w-full grid-cols-2 md:grid-cols-5">
                    <TabsTrigger value="contenido">Contenido</TabsTrigger>
                    <TabsTrigger value="resumen">Resumen</TabsTrigger>
                    <TabsTrigger value="solucionario">Solucionario</TabsTrigger>
                    <TabsTrigger value="mapa">Mapa</TabsTrigger>
                    <TabsTrigger value="material">Material</TabsTrigger>
                </TabsList>

                <TabsContent value="contenido">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <BookOpen className="h-5 w-5 text-brand-action" />
                                Leccion
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="whitespace-pre-wrap leading-7 text-primary-contrast">{lesson.contenido}</p>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="resumen">
                    <Card>
                        <CardContent className="p-6 space-y-4">
                            <Button onClick={() => guardedAction(async () => {
                                const data = await getLessonSummary(String(lesson.id_leccion));
                                setSummary(data.resumen_teorico);
                            })}>
                                <Sparkles className="h-4 w-4" /> Ver resumen
                            </Button>
                            {summary && <p className="whitespace-pre-wrap leading-7">{summary}</p>}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="solucionario">
                    <Card>
                        <CardContent className="p-6 space-y-4">
                            <Button onClick={() => guardedAction(async () => {
                                const data = await getLessonSolution(String(lesson.id_leccion));
                                setSolution(data.preguntas_respuestas || []);
                            })}>
                                <FileQuestion className="h-4 w-4" /> Ver solucionario
                            </Button>
                            <div className="space-y-3">
                                {solution.map((item, index) => (
                                    <div key={`${item.pregunta}-${index}`} className="rounded-md border p-4">
                                        <p className="font-semibold">{item.pregunta}</p>
                                        <p className="mt-2 text-muted-foreground">{item.respuesta}</p>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="mapa">
                    <Card>
                        <CardContent className="p-6 space-y-4">
                            <Button onClick={() => guardedAction(async () => {
                                const data = await getLessonConceptMap(String(lesson.id_leccion));
                                setConceptMap(data.mapa_conceptual || []);
                            })}>
                                <GitBranch className="h-4 w-4" /> Generar mapa
                            </Button>
                            <div className="grid gap-3 md:grid-cols-2">
                                {conceptMap.map((item, index) => (
                                    <div key={`${item.concepto}-${index}`} className="rounded-md border p-4">
                                        <p className="font-semibold">{item.concepto}</p>
                                        {item.relacion && <p className="text-sm text-muted-foreground">{item.relacion}</p>}
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="material">
                    <Card>
                        <CardContent className="p-6">
                            <Button onClick={() => guardedAction(async () => {
                                await downloadLessonMaterial(String(lesson.id_leccion), lesson.titulo);
                            })}>
                                <Download className="h-4 w-4" /> Descargar PDF
                            </Button>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
