import { useState, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, BookOpen, Plus } from "lucide-react";
import {
    Button, Card, CardContent, CardHeader, CardTitle, Input,
    Label, Textarea, Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "../../../desingSystem/primitives";
import { useToast } from "../../../hooks/useToast";
import { createLesson } from "../../../features/lessons/services/lessonService";

const parseLines = (value: string, mapper: (line: string) => any) =>
    value
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean)
        .map(mapper);

export default function AddLesson() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { toast } = useToast();
    const [isSaving, setIsSaving] = useState(false);
    const [form, setForm] = useState({
        titulo: "",
        descripcion: "",
        contenido: "",
        resumen_teorico: "",
        dificultad: "basico",
        duracion_minutos: 15,
        orden: 0,
        preguntas: "",
        mapa: "",
        multimedia: "",
    });

    const update = (key: keyof typeof form, value: string | number) => {
        setForm((prev) => ({ ...prev, [key]: value }));
    };

    const handleSubmit = async (event: FormEvent) => {
        event.preventDefault();
        if (!id) return;

        setIsSaving(true);
        try {
            await createLesson({
                id_repositorio: id,
                titulo: form.titulo,
                descripcion: form.descripcion,
                contenido: form.contenido,
                resumen_teorico: form.resumen_teorico,
                dificultad: form.dificultad,
                duracion_minutos: Number(form.duracion_minutos),
                orden: Number(form.orden),
                preguntas_respuestas: parseLines(form.preguntas, (line) => {
                    const [pregunta, respuesta] = line.split("|");
                    return { pregunta: pregunta?.trim() || line, respuesta: respuesta?.trim() || "" };
                }),
                mapa_conceptual: parseLines(form.mapa, (line) => {
                    const [concepto, relacion] = line.split("|");
                    return { concepto: concepto?.trim() || line, relacion: relacion?.trim() || "" };
                }),
                recursos_multimedia: parseLines(form.multimedia, (line) => {
                    const [titulo, url, tipo] = line.split("|");
                    return { titulo: titulo?.trim() || url?.trim() || line, url: url?.trim() || line, tipo: tipo?.trim() || "enlace" };
                }),
            });

            toast({ title: "Leccion creada", description: "La leccion ya esta disponible en el repositorio" });
            navigate(`/docente/repositorios/gestionar/${id}`);
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Error",
                description: error.response?.data?.message || "No se pudo crear la leccion",
            });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <Button
                variant="ghost"
                className="pl-0 gap-2"
                onClick={() => navigate(`/docente/repositorios/gestionar/${id}`)}
            >
                <ArrowLeft className="h-4 w-4" /> Volver al repositorio
            </Button>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <BookOpen className="h-5 w-5 text-brand-action" />
                        Nueva leccion
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="titulo">Titulo *</Label>
                                <Input id="titulo" value={form.titulo} onChange={(e) => update("titulo", e.target.value)} required />
                            </div>
                            <div className="space-y-2">
                                <Label>Dificultad</Label>
                                <Select value={form.dificultad} onValueChange={(value) => update("dificultad", value)}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="basico">Basico</SelectItem>
                                        <SelectItem value="intermedio">Intermedio</SelectItem>
                                        <SelectItem value="avanzado">Avanzado</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="duracion">Duracion estimada</Label>
                                <Input id="duracion" type="number" min={1} value={form.duracion_minutos} onChange={(e) => update("duracion_minutos", Number(e.target.value))} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="orden">Orden</Label>
                                <Input id="orden" type="number" min={0} value={form.orden} onChange={(e) => update("orden", Number(e.target.value))} />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="descripcion">Descripcion</Label>
                            <Textarea id="descripcion" value={form.descripcion} onChange={(e) => update("descripcion", e.target.value)} />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="contenido">Contenido de la leccion *</Label>
                            <Textarea id="contenido" className="min-h-44" value={form.contenido} onChange={(e) => update("contenido", e.target.value)} required />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="resumen">Resumen teorico</Label>
                            <Textarea id="resumen" className="min-h-28" value={form.resumen_teorico} onChange={(e) => update("resumen_teorico", e.target.value)} />
                        </div>

                        <div className="grid gap-4 md:grid-cols-3">
                            <div className="space-y-2">
                                <Label htmlFor="preguntas">Preguntas y respuestas</Label>
                                <Textarea id="preguntas" placeholder="Pregunta | Respuesta" value={form.preguntas} onChange={(e) => update("preguntas", e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="mapa">Mapa conceptual</Label>
                                <Textarea id="mapa" placeholder="Concepto | Relacion" value={form.mapa} onChange={(e) => update("mapa", e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="multimedia">Recursos multimedia</Label>
                                <Textarea id="multimedia" placeholder="Titulo | URL | tipo" value={form.multimedia} onChange={(e) => update("multimedia", e.target.value)} />
                            </div>
                        </div>

                        <div className="flex justify-end gap-3">
                            <Button type="button" variant="outline" onClick={() => navigate(`/docente/repositorios/gestionar/${id}`)} disabled={isSaving}>
                                Cancelar
                            </Button>
                            <Button type="submit" className="bg-brand-action" disabled={isSaving}>
                                <Plus className="h-4 w-4" />
                                {isSaving ? "Guardando..." : "Crear leccion"}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
