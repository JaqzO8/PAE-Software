// src/pages/teacher/repositories/AddResource.tsx

import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { ArrowLeft, Upload, FileText } from "lucide-react";
import {
    Button, Input, Textarea, Select, SelectContent, SelectItem,
    SelectTrigger, SelectValue, Form, FormControl, FormField,
    FormItem, FormLabel, FormMessage, FormDescription, Card,
    CardContent, CardHeader, CardTitle
} from "../../../desingSystem/primitives";
import { useToast } from "../../../hooks/useToast";
import { api } from "../../../services/api";

const resourceSchema = z.object({
    titulo: z.string().min(3, "Mínimo 3 caracteres"),
    descripcion: z.string().optional(),
    tipo_recurso: z.enum(["pdf", "video", "audio", "imagen", "enlace", "otro"]),
    url_externa: z.string().url("URL inválida").optional().or(z.literal("")),
    orden: z.number().min(0).optional(),
});

type ResourceFormData = z.infer<typeof resourceSchema>;

export default function AddResource() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { toast } = useToast();
    const [file, setFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);

    const form = useForm<ResourceFormData>({
        resolver: zodResolver(resourceSchema),
        defaultValues: {
            titulo: "",
            descripcion: "",
            tipo_recurso: "pdf",
            url_externa: "",
            orden: 0,
        },
    });

    const tipoRecurso = form.watch("tipo_recurso");

    const onSubmit = async (data: ResourceFormData) => {
        if (!id) return;

        if (!file && !data.url_externa) {
            toast({
                variant: "destructive",
                title: "Error",
                description: "Debes subir un archivo o proporcionar una URL externa",
            });
            return;
        }

        setIsUploading(true);

        try {
            const formData = new FormData();
            formData.append("id_repositorio", id);
            formData.append("titulo", data.titulo);
            if (data.descripcion) formData.append("descripcion", data.descripcion);
            formData.append("tipo_recurso", data.tipo_recurso);
            if (data.url_externa) formData.append("url_externa", data.url_externa);
            if (data.orden !== undefined) formData.append("orden", data.orden.toString());
            if (file) formData.append("file", file);

            await api.post("/content/resources", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });

            toast({
                title: "Recurso agregado",
                description: "El recurso se subió correctamente",
            });

            navigate(`/docente/repositorios/gestionar/${id}`);
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Error",
                description: error.response?.data?.message || "No se pudo subir el recurso",
            });
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <Button
                variant="ghost"
                className="pl-0 gap-2"
                onClick={() => navigate(`/docente/repositorios/gestionar/${id}`)}
            >
                <ArrowLeft className="h-4 w-4" /> Volver al repositorio
            </Button>

            <Card>
                <CardHeader>
                    <CardTitle>Agregar Nuevo Recurso</CardTitle>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                            <FormField
                                control={form.control}
                                name="titulo"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Título del Recurso *</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Ej. Guía de Cálculo Integral" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="descripcion"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Descripción</FormLabel>
                                        <FormControl>
                                            <Textarea placeholder="Describe el contenido..." {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="tipo_recurso"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Tipo de Recurso *</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="pdf">PDF</SelectItem>
                                                <SelectItem value="video">Video</SelectItem>
                                                <SelectItem value="audio">Audio</SelectItem>
                                                <SelectItem value="imagen">Imagen</SelectItem>
                                                <SelectItem value="enlace">Enlace Externo</SelectItem>
                                                <SelectItem value="otro">Otro</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {(tipoRecurso === "video" || tipoRecurso === "audio" || tipoRecurso === "enlace") && (
                                <FormField
                                    control={form.control}
                                    name="url_externa"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>URL Externa</FormLabel>
                                            <FormControl>
                                                <Input
                                                    placeholder="https://youtube.com/..."
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormDescription>
                                                YouTube, Google Drive, Vimeo, etc.
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            )}

                            {!form.watch("url_externa") && (
                                <div className="space-y-3">
                                    <FormLabel>Archivo</FormLabel>
                                    <div className="border-2 border-dashed rounded-lg p-8 text-center">
                                        <input
                                            type="file"
                                            onChange={(e) => setFile(e.target.files?.[0] || null)}
                                            className="hidden"
                                            id="file-upload"
                                            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.mp4,.mp3"
                                        />
                                        <label htmlFor="file-upload" className="cursor-pointer">
                                            {file ? (
                                                <div>
                                                    <FileText className="h-10 w-10 mx-auto mb-2 text-green-600" />
                                                    <p className="font-medium">{file.name}</p>
                                                    <p className="text-sm text-muted-foreground">
                                                        {(file.size / 1024 / 1024).toFixed(2)} MB
                                                    </p>
                                                </div>
                                            ) : (
                                                <>
                                                    <Upload className="h-10 w-10 mx-auto mb-2 text-neutral-400" />
                                                    <p className="font-medium">Click para subir archivo</p>
                                                    <p className="text-sm text-muted-foreground">
                                                        Máx. 50MB
                                                    </p>
                                                </>
                                            )}
                                        </label>
                                    </div>
                                </div>
                            )}

                            <div className="flex justify-end gap-3 pt-4">
                                <Button
                                    variant="outline"
                                    type="button"
                                    onClick={() => navigate(`/docente/repositorios/gestionar/${id}`)}
                                    disabled={isUploading}
                                >
                                    Cancelar
                                </Button>
                                <Button
                                    type="submit"
                                    className="bg-brand-action"
                                    disabled={isUploading}
                                >
                                    {isUploading ? "Subiendo..." : "Agregar Recurso"}
                                </Button>
                            </div>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </div>
    );
}
