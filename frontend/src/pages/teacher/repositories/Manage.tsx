// src/pages/teacher/repositories/Manage.tsx
import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { ArrowLeft, Plus, FileText, Trash2, ExternalLink, BookOpen } from "lucide-react";
import { Button, Card, Skeleton, Badge } from "../../../desingSystem/primitives";
import { useToast } from "../../../hooks/useToast";
import { getRepositoryById, type Repository } from "../../../features/repository/services/repositoryService";
import { api } from "../../../services/api";
import { deleteLesson, getLessonsByRepository, type Lesson } from "../../../features/lessons/services/lessonService";
import styles from "../../../features/repository/components/repository.module.css";

interface Resource {
    id_recurso: number;
    titulo: string;
    descripcion?: string;
    tipo_recurso: string;
    url_archivo?: string;
    url_externa?: string;
    descargas: number;
    fecha_subida: string;
}

const ManageRepository = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { toast } = useToast();

    const [repository, setRepository] = useState<Repository | null>(null);
    const [resources, setResources] = useState<Resource[]>([]);
    const [lessons, setLessons] = useState<Lesson[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (id) {
            loadRepository();
            loadResources();
            loadLessons();
        }
    }, [id]);

    const loadRepository = async () => {
        if (!id) return;
        setIsLoading(true);
        try {
            const data = await getRepositoryById(id);
            setRepository(data);
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Error",
                description: error.message || "No se pudo cargar el repositorio",
            });
            navigate("/docente/repositorios/mis-repos");
        } finally {
            setIsLoading(false);
        }
    };

    const loadResources = async () => {
        if (!id) return;
        try {
            const response = await api.get("/content/resources", {
                params: { repositorio_id: id },
            });
            setResources(response.data.data);
        } catch (error) {
            console.error("Error cargando recursos:", error);
        }
    };

    const handleAddResource = () => {
        navigate(`/docente/repositorios/gestionar/${id}/agregar-recurso`);
    };

    const handleAddLesson = () => {
        navigate(`/docente/repositorios/gestionar/${id}/agregar-leccion`);
    };

    const handleDeleteResource = async (resourceId: number) => {
        if (!confirm("¿Estás seguro de eliminar este recurso?")) return;

        try {
            await api.delete(`/content/resources/${resourceId}`);
            toast({
                title: "Recurso eliminado",
                description: "El recurso fue eliminado correctamente",
            });
            loadResources();
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Error",
                description: error.response?.data?.message || "No se pudo eliminar",
            });
        }
    };

    const loadLessons = async () => {
        if (!id) return;
        try {
            setLessons(await getLessonsByRepository(id));
        } catch (error) {
            console.error("Error cargando lecciones:", error);
        }
    };

    const handleDeleteLesson = async (lessonId: number) => {
        if (!confirm("Estas seguro de eliminar esta leccion?")) return;

        try {
            await deleteLesson(lessonId);
            toast({ title: "Leccion eliminada" });
            loadLessons();
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Error",
                description: error.response?.data?.message || "No se pudo eliminar",
            });
        }
    };

    if (isLoading) {
        return (
            <div className="space-y-4">
                <Skeleton className="h-12 w-64" />
                <Skeleton className="h-96 w-full" />
            </div>
        );
    }

    if (!repository) {
        return (
            <div className="text-center py-12">
                <p>Repositorio no encontrado</p>
            </div>
        );
    }

    return (
        <div className={styles.pageContainer}>
            <div className="mb-6">
                <Button
                    variant="ghost"
                    className="pl-0 hover:bg-transparent hover:text-brand-action gap-2 text-neutral-500"
                    onClick={() => navigate("/docente/repositorios/mis-repos")}
                >
                    <ArrowLeft className="h-4 w-4" /> Volver a mis repositorios
                </Button>
                <div className="mt-4 flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-primary-contrast">{repository.title}</h1>
                        <p className="text-muted-foreground">{repository.description || "Sin descripción"}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <Button variant="outline" className="gap-2" onClick={handleAddLesson}>
                            <BookOpen className="h-4 w-4" /> Agregar Leccion
                        </Button>
                        <Button className="gap-2 bg-brand-action" onClick={handleAddResource}>
                            <Plus className="h-4 w-4" /> Agregar Recurso
                        </Button>
                    </div>
                </div>
            </div>

            <Card className="p-6 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <p className="text-sm text-muted-foreground">Categoría</p>
                        <p className="font-semibold">{repository.category || "Sin categoría"}</p>
                    </div>
                    <div>
                        <p className="text-sm text-muted-foreground">Vistas</p>
                        <p className="font-semibold">{repository.views}</p>
                    </div>
                    <div>
                        <p className="text-sm text-muted-foreground">Descargas</p>
                        <p className="font-semibold">{repository.downloads}</p>
                    </div>
                </div>
                {repository.tags.length > 0 && (
                    <div className="mt-4">
                        <p className="text-sm text-muted-foreground mb-2">Etiquetas</p>
                        <div className="flex flex-wrap gap-2">
                            {repository.tags.map((tag) => (
                                <Badge key={tag} variant="secondary">{tag}</Badge>
                            ))}
                        </div>
                    </div>
                )}
            </Card>

            <Card className="p-6 mb-6">
                <h2 className="text-xl font-bold mb-4">Lecciones ({lessons.length})</h2>

                {lessons.length === 0 ? (
                    <div className="text-center py-12 border-2 border-dashed rounded-xl">
                        <BookOpen className="h-12 w-12 mx-auto mb-4 text-neutral-300" />
                        <p className="text-muted-foreground">No hay lecciones aun</p>
                        <Button className="mt-4 gap-2" onClick={handleAddLesson}>
                            <Plus className="h-4 w-4" /> Agregar Primera Leccion
                        </Button>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {lessons.map((lesson) => (
                            <div key={lesson.id_leccion} className="flex items-center justify-between p-4 border rounded-lg hover:bg-neutral-50">
                                <div className="flex items-center gap-3 flex-1">
                                    <BookOpen className="h-5 w-5 text-brand-action" />
                                    <div className="flex-1">
                                        <h3 className="font-semibold">{lesson.titulo}</h3>
                                        {lesson.descripcion && (
                                            <p className="text-sm text-muted-foreground">{lesson.descripcion}</p>
                                        )}
                                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                                            <span>{lesson.dificultad}</span>
                                            <span>•</span>
                                            <span>{lesson.duracion_minutos} min</span>
                                        </div>
                                    </div>
                                </div>
                                <Button variant="ghost" size="sm" onClick={() => handleDeleteLesson(lesson.id_leccion)}>
                                    <Trash2 className="h-4 w-4 text-red-500" />
                                </Button>
                            </div>
                        ))}
                    </div>
                )}
            </Card>

            <Card className="p-6">
                <h2 className="text-xl font-bold mb-4">Recursos ({resources.length})</h2>

                {resources.length === 0 ? (
                    <div className="text-center py-12 border-2 border-dashed rounded-xl">
                        <FileText className="h-12 w-12 mx-auto mb-4 text-neutral-300" />
                        <p className="text-muted-foreground">No hay recursos aún</p>
                        <Button className="mt-4 gap-2" onClick={handleAddResource}>
                            <Plus className="h-4 w-4" /> Agregar Primer Recurso
                        </Button>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {resources.map((resource) => (
                            <div key={resource.id_recurso} className="flex items-center justify-between p-4 border rounded-lg hover:bg-neutral-50">
                                <div className="flex items-center gap-3 flex-1">
                                    <FileText className="h-5 w-5 text-brand-action" />
                                    <div className="flex-1">
                                        <h3 className="font-semibold">{resource.titulo}</h3>
                                        {resource.descripcion && (
                                            <p className="text-sm text-muted-foreground">{resource.descripcion}</p>
                                        )}
                                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                                            <span>Tipo: {resource.tipo_recurso}</span>
                                            <span>•</span>
                                            <span>Descargas: {resource.descargas}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    {resource.url_externa && (
                                        <Button variant="outline" size="sm" asChild>
                                            <a href={resource.url_externa} target="_blank" rel="noopener noreferrer">
                                                <ExternalLink className="h-4 w-4" />
                                            </a>
                                        </Button>
                                    )}
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleDeleteResource(resource.id_recurso)}
                                    >
                                        <Trash2 className="h-4 w-4 text-red-500" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </Card>
        </div>
    );
};

export default ManageRepository;
