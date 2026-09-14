// src/pages/student/repositories/Detail.tsx
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
    ArrowLeft, Star, Eye, Download, BookOpen, FileText, ExternalLink,
    Play, Headphones, Image as ImageIcon, Link as LinkIcon
} from "lucide-react";
import {
    Button, Card, CardContent, CardHeader, CardTitle, Badge,
    Skeleton, ScrollArea, Avatar, AvatarImage, AvatarFallback
} from "../../../desingSystem/primitives";
import { useToast } from "../../../hooks/useToast";
import { getRepositoryById, type Repository } from "../../../features/repository/services/repositoryService";
import { getLessonsByRepository, type Lesson } from "../../../features/lessons/services/lessonService";
import { api } from "../../../services/api";

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

const RESOURCE_ICONS = {
    pdf: FileText,
    video: Play,
    audio: Headphones,
    imagen: ImageIcon,
    enlace: LinkIcon,
    otro: FileText,
};

const StudentRepositoryDetail = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { toast } = useToast();

    const [repository, setRepository] = useState<Repository | null>(null);
    const [resources, setResources] = useState<Resource[]>([]);
    const [lessons, setLessons] = useState<Lesson[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isFavorite, setIsFavorite] = useState(false);

    useEffect(() => {
        if (id) {
            loadRepositoryData();
        }
    }, [id]);

    const loadRepositoryData = async () => {
        if (!id) return;
        setIsLoading(true);
        try {
            const [repoData, resourcesResponse] = await Promise.all([
                getRepositoryById(id),
                api.get("/content/resources", { params: { repositorio_id: id } })
            ]);
            const lessonData = await getLessonsByRepository(id);

            console.log("🖼️ Repositorio cargado:", repoData);
            console.log("📷 Cover Image URL:", repoData.coverImage);

            setRepository(repoData);
            setResources(resourcesResponse.data.data);
            setLessons(lessonData);
            setIsFavorite(repoData.isFavorite);
        } catch (error: any) {
            console.error("Error cargando repositorio:", error);
            toast({
                variant: "destructive",
                title: "Error",
                description: error.message || "No se pudo cargar el repositorio",
            });
            navigate("/estudiante/explorar");
        } finally {
            setIsLoading(false);
        }
    };

    const handleToggleFavorite = async () => {
        if (!id) return;

        try {
            if (isFavorite) {
                await api.delete(`/content/favorites/${id}`);
                toast({ title: "Eliminado de favoritos" });
            } else {
                await api.post(`/content/favorites/${id}`);
                toast({ title: "Agregado a favoritos" });
            }
            setIsFavorite(!isFavorite);
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Error",
                description: error.response?.data?.message || "No se pudo actualizar favoritos",
            });
        }
    };

    const handleDownload = async (resourceId: number) => {
        try {
            // 1. Registrar la descarga en el backend

            // 2. Obtener el recurso
            const resource = resources.find(r => r.id_recurso === resourceId);
            
            if (!resource) {
                throw new Error("Recurso no encontrado");
            }

            const response = await api.post(`/content/resources/${resourceId}/download`);
            const download = response.data;

            console.log("📥 Descargando recurso:", resource);

            // 3. Determinar la URL según el tipo
            if (download.type === "external" && download.url) {
                // Enlaces externos
                window.open(download.url, "_blank", "noopener,noreferrer");
            } else if (download.type === "file" && download.downloadUrl) {
                // Archivos locales en /uploads
                const fileResponse = await api.get(download.downloadUrl, {
                    responseType: "blob",
                });
                const blobUrl = window.URL.createObjectURL(fileResponse.data);

                // Crear un enlace temporal para forzar descarga
                const link = document.createElement('a');
                link.href = blobUrl;
                link.download = download.filename || resource.titulo;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                window.URL.revokeObjectURL(blobUrl);
            } else {
                throw new Error("El servidor no devolvio una descarga valida");
            }

            toast({
                title: download.type === "external" ? "Recurso abierto" : "Descarga iniciada",
                description: resource.titulo
            });

            // Actualizar contador localmente
            setResources(prev => prev.map(r =>
                r.id_recurso === resourceId
                    ? { ...r, descargas: r.descargas + 1 }
                    : r
            ));
        } catch (error: any) {
            console.error("❌ Error en descarga:", error);
            toast({
                variant: "destructive",
                title: "Error al descargar",
                description: error.response?.data?.message || error.message || "No se pudo descargar el recurso",
            });
        }
    };

    if (isLoading) {
        return (
            <div className="space-y-4 max-w-6xl mx-auto">
                <Skeleton className="h-12 w-64" />
                <Skeleton className="h-64 w-full" />
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

    // La URL ya viene procesada del servicio
    const coverUrl = repository.coverImage;

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            {/* Botón de regreso */}
            <Button
                variant="ghost"
                className="pl-0 hover:bg-transparent hover:text-brand-action gap-2 text-neutral-500"
                onClick={() => navigate(-1)}
            >
                <ArrowLeft className="h-4 w-4" /> Volver
            </Button>

            {/* Header del repositorio con portada */}
            <Card className="overflow-hidden">
                {coverUrl && (
                    <div className="h-48 md:h-64 w-full overflow-hidden bg-neutral-100">
                        <img
                            src={coverUrl}
                            alt={repository.title}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                                console.error("❌ Error cargando portada:", coverUrl);
                                e.currentTarget.style.display = 'none';
                            }}
                            onLoad={() => {
                                console.log("✅ Portada cargada correctamente:", coverUrl);
                            }}
                        />
                    </div>
                )}

                <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                        <div className="flex-1">
                            <div className="flex items-start gap-3 mb-3">
                                <div className="p-3 bg-brand-action/10 rounded-xl">
                                    <BookOpen className="h-6 w-6 text-brand-action" />
                                </div>
                                <div className="flex-1">
                                    <h1 className="text-2xl md:text-3xl font-bold text-primary-contrast mb-2">
                                        {repository.title}
                                    </h1>
                                    {repository.description && (
                                        <p className="text-muted-foreground">{repository.description}</p>
                                    )}
                                </div>
                            </div>

                            {/* Tags */}
                            {repository.tags.length > 0 && (
                                <div className="flex flex-wrap gap-2 mb-4">
                                    {repository.tags.map((tag) => (
                                        <Badge key={tag} variant="secondary">{tag}</Badge>
                                    ))}
                                </div>
                            )}

                            {/* Metadata */}
                            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                                {repository.category && (
                                    <span className="font-medium text-primary-contrast">{repository.category}</span>
                                )}
                                <span className="flex items-center gap-1">
                                    <Eye className="h-4 w-4" />
                                    {repository.views} vistas
                                </span>
                                <span className="flex items-center gap-1">
                                    <Download className="h-4 w-4" />
                                    {repository.downloads} descargas
                                </span>
                                {repository.rating > 0 && (
                                    <span className="flex items-center gap-1">
                                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                        {repository.rating.toFixed(1)}/10
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Botón de favoritos */}
                        <Button
                            variant={isFavorite ? "default" : "outline"}
                            onClick={handleToggleFavorite}
                            className="gap-2 flex-shrink-0"
                            style={isFavorite ? { backgroundColor: '#FF6A00' } : undefined}
                        >
                            <Star className={`h-4 w-4 ${isFavorite ? 'fill-current' : ''}`} />
                            {isFavorite ? "En favoritos" : "Guardar"}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Información del autor */}
            <Card>
                <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                        <Avatar className="h-12 w-12">
                            <AvatarImage src={repository.author} />
                            <AvatarFallback className="bg-brand-action/10 text-brand-action font-bold">
                                {repository.author[0]}
                            </AvatarFallback>
                        </Avatar>
                        <div>
                            <p className="font-semibold text-primary-contrast">{repository.author}</p>
                            <p className="text-sm text-muted-foreground">
                                Actualizado el {repository.updatedAt}
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Recursos */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <BookOpen className="h-5 w-5 text-brand-action" />
                        Lecciones ({lessons.length})
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {lessons.length === 0 ? (
                        <div className="text-center py-12 border-2 border-dashed rounded-xl">
                            <BookOpen className="h-12 w-12 mx-auto mb-4 text-neutral-300" />
                            <p className="text-muted-foreground">No hay lecciones disponibles</p>
                        </div>
                    ) : (
                        <div className="grid gap-3 md:grid-cols-2">
                            {lessons.map((lesson) => {
                                const progress = lesson.progresos?.[0];
                                return (
                                    <Card key={lesson.id_leccion} className="hover:shadow-md transition-shadow">
                                        <CardContent className="p-4">
                                            <div className="flex items-start gap-3">
                                                <div className="p-2 bg-brand-action/10 rounded-lg">
                                                    <BookOpen className="h-5 w-5 text-brand-action" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="font-semibold text-primary-contrast">{lesson.titulo}</h3>
                                                    {lesson.descripcion && (
                                                        <p className="text-sm text-muted-foreground mt-1">{lesson.descripcion}</p>
                                                    )}
                                                    <div className="flex flex-wrap gap-2 mt-3 text-xs text-muted-foreground">
                                                        <Badge variant="outline">{lesson.dificultad}</Badge>
                                                        <Badge variant={progress?.completada ? "default" : "secondary"}>
                                                            {progress?.completada ? "Completada" : `${lesson.duracion_minutos} min`}
                                                        </Badge>
                                                    </div>
                                                </div>
                                            </div>
                                            <Button
                                                className="mt-4 w-full bg-brand-action hover:bg-brand-action/90"
                                                onClick={() => navigate(`/estudiante/repositorios/${id}/lecciones/${lesson.id_leccion}`)}
                                            >
                                                Abrir leccion
                                            </Button>
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-brand-action" />
                        Recursos ({resources.length})
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {resources.length === 0 ? (
                        <div className="text-center py-12 border-2 border-dashed rounded-xl">
                            <FileText className="h-12 w-12 mx-auto mb-4 text-neutral-300" />
                            <p className="text-muted-foreground">No hay recursos disponibles</p>
                        </div>
                    ) : (
                        <ScrollArea className="h-[400px] pr-4">
                            <div className="space-y-3">
                                {resources.map((resource) => {
                                    const Icon = RESOURCE_ICONS[resource.tipo_recurso as keyof typeof RESOURCE_ICONS] || FileText;

                                    return (
                                        <Card key={resource.id_recurso} className="hover:shadow-md transition-shadow">
                                            <CardContent className="p-4">
                                                <div className="flex items-start gap-4">
                                                    <div className="p-2 bg-brand-action/10 rounded-lg flex-shrink-0">
                                                        <Icon className="h-5 w-5 text-brand-action" />
                                                    </div>

                                                    <div className="flex-1 min-w-0">
                                                        <h3 className="font-semibold text-primary-contrast mb-1">
                                                            {resource.titulo}
                                                        </h3>
                                                        {resource.descripcion && (
                                                            <p className="text-sm text-muted-foreground mb-2">
                                                                {resource.descripcion}
                                                            </p>
                                                        )}
                                                        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                                                            <Badge variant="outline" className="text-xs">
                                                                {resource.tipo_recurso}
                                                            </Badge>
                                                            <span className="flex items-center gap-1">
                                                                <Download className="h-3 w-3" />
                                                                {resource.descargas} descargas
                                                            </span>
                                                            <span>
                                                                {new Date(resource.fecha_subida).toLocaleDateString()}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    <Button
                                                        size="sm"
                                                        onClick={() => handleDownload(resource.id_recurso)}
                                                        className="gap-2 flex-shrink-0 bg-brand-action hover:bg-brand-action/90"
                                                    >
                                                        {resource.url_externa ? (
                                                            <>
                                                                <ExternalLink className="h-4 w-4" />
                                                                Abrir
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Download className="h-4 w-4" />
                                                                Descargar
                                                            </>
                                                        )}
                                                    </Button>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    );
                                })}
                            </div>
                        </ScrollArea>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default StudentRepositoryDetail;
