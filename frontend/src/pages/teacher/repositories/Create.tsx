// src/pages/teacher/repositories/Create.tsx
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useNavigate } from "react-router-dom";
import { UploadCloud, ArrowLeft, X } from "lucide-react";
import { useState } from "react";

import { 
  Button, Input, Textarea, Form, FormControl, FormField, FormItem, FormLabel, 
  FormMessage, FormDescription, Card, CardContent, CardHeader, CardTitle, 
  CardDescription, Badge
} from "../../../desingSystem/primitives";

import { useMyRepositories } from "../../../features/repository/hooks/useMyRepositories";
import styles from "../../../features/repository/components/repository.module.css";

// Esquema de Validación actualizado para el backend
const repoSchema = z.object({
  titulo: z.string().min(5, "El título debe tener al menos 5 caracteres"),
  descripcion: z.string().optional(),
  id_categoria: z.number().optional(),
  tags: z.array(z.string()).optional(),
  publico: z.boolean().default(true),
});
type RepoFormInput = z.input<typeof repoSchema>;
type RepoFormData = z.output<typeof repoSchema>;

const TeacherRepoCreate = () => {
  const navigate = useNavigate();
  const { create, isLoading } = useMyRepositories();
  
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  
  const form = useForm<RepoFormInput, unknown, RepoFormData>({
    resolver: zodResolver(repoSchema),
    defaultValues: { 
      titulo: "", 
      descripcion: "",
      publico: true,
      tags: [],
    },
  });

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCoverImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setCoverPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const addTag = () => {
    const tag = tagInput.trim();
    if (tag && !tags.includes(tag) && tags.length < 5) {
      setTags([...tags, tag]);
      setTagInput("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  const onSubmit = async (data: RepoFormData) => {
    await create({
      ...data,
      tags: tags.length > 0 ? tags : undefined,
      portada: coverImage || undefined,
    });
  };

  return (
    <div className={styles.formContainer}>
      {/* Botón de regreso */}
      <div className="mb-6">
        <Button 
          variant="ghost" 
          className="pl-0 hover:bg-transparent hover:text-brand-action gap-2 text-neutral-500"
          onClick={() => navigate(-1)}
          disabled={isLoading}
        >
          <ArrowLeft className="h-4 w-4" /> Volver a mis repositorios
        </Button>
        <div className="mt-2">
          <h1 className="text-3xl font-bold text-primary-contrast">Crear Nuevo Repositorio</h1>
          <p className="text-muted-foreground">Sube materiales y guías para tus estudiantes.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Detalles del Contenido</CardTitle>
          <CardDescription>Información básica para que los alumnos encuentren tu material.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              
              {/* Título */}
              <FormField
                control={form.control}
                name="titulo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Título del Repositorio *</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Ej. Cálculo Diferencial - Semestre 2025-I" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Descripción */}
              <FormField
                control={form.control}
                name="descripcion"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descripción</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Describe el contenido de este repositorio..." 
                        className="min-h-[100px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      Explica qué encontrarán los estudiantes en este repositorio
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Tags */}
              <div className="space-y-3">
                <FormLabel>Etiquetas</FormLabel>
                <div className="flex gap-2">
                  <Input
                    placeholder="Agregar etiqueta (máx. 5)"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addTag();
                      }
                    }}
                    disabled={tags.length >= 5}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={addTag}
                    disabled={!tagInput.trim() || tags.length >= 5}
                  >
                    Agregar
                  </Button>
                </div>
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="gap-1">
                        {tag}
                        <button
                          type="button"
                          onClick={() => removeTag(tag)}
                          className="ml-1 hover:text-destructive"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
                <FormDescription>
                  Ayuda a los estudiantes a encontrar tu contenido (Ej: matemáticas, física, química)
                </FormDescription>
              </div>

              {/* Público/Privado */}
              <FormField
                control={form.control}
                name="publico"
                render={() => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Repositorio Público</FormLabel>
                      <FormDescription>
                        Los estudiantes podrán encontrar y acceder a este repositorio
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />

              {/* Imagen de Portada */}
              <div className="space-y-3">
                <FormLabel>Imagen de Portada (Opcional)</FormLabel>
                <div className={styles.dropzone}>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleCoverChange}
                    className="hidden"
                    id="cover-upload"
                  />
                  <label htmlFor="cover-upload" className="cursor-pointer">
                    {coverPreview ? (
                      <div className="relative">
                        <img 
                          src={coverPreview} 
                          alt="Preview" 
                          className="max-h-48 mx-auto rounded-lg"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="absolute top-2 right-2"
                          onClick={(e) => {
                            e.preventDefault();
                            setCoverImage(null);
                            setCoverPreview(null);
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <>
                        <UploadCloud className="h-10 w-10 mx-auto text-neutral-400 mb-3" />
                        <p className="text-sm font-medium text-neutral-600">
                          Click para subir una imagen de portada
                        </p>
                        <p className="text-xs text-neutral-400 mt-1">
                          PNG, JPG o WEBP (máx. 5MB)
                        </p>
                      </>
                    )}
                  </label>
                </div>
              </div>

              {/* Botones de Acción */}
              <div className="flex justify-end gap-3 pt-4">
                <Button 
                  variant="outline" 
                  type="button" 
                  onClick={() => navigate(-1)}
                  disabled={isLoading}
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  className="bg-brand-action hover:bg-brand-action/90 text-white min-w-[140px]"
                  disabled={isLoading}
                >
                  {isLoading ? "Creando..." : "Publicar Repositorio"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default TeacherRepoCreate;
