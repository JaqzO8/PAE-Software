import { api } from "../../../services/api";

export interface LessonProgress {
  id_progreso: number;
  completada: boolean;
  puntuacion?: number;
  tiempo_segundos: number;
  resumen_generado: boolean;
  mapa_generado: boolean;
}

export interface Lesson {
  id_leccion: number;
  id_repositorio: number;
  titulo: string;
  descripcion?: string;
  contenido: string;
  resumen_teorico?: string;
  preguntas_respuestas: Array<{ pregunta: string; respuesta: string }>;
  mapa_conceptual: Array<{ concepto: string; relacion?: string }>;
  recursos_multimedia: Array<{ titulo: string; url: string; tipo?: string }>;
  dificultad: string;
  duracion_minutos: number;
  orden: number;
  publicado: boolean;
  progresos?: LessonProgress[];
  progress?: LessonProgress | null;
}

export interface CreateLessonInput {
  id_repositorio: string;
  titulo: string;
  descripcion?: string;
  contenido: string;
  resumen_teorico?: string;
  preguntas_respuestas?: Array<{ pregunta: string; respuesta: string }>;
  mapa_conceptual?: Array<{ concepto: string; relacion?: string }>;
  recursos_multimedia?: Array<{ titulo: string; url: string; tipo?: string }>;
  dificultad?: string;
  duracion_minutos?: number;
  orden?: number;
  publicado?: boolean;
}

export const getLessonsByRepository = async (repositoryId: string): Promise<Lesson[]> => {
  const response = await api.get("/content/lessons", {
    params: { repositorio_id: repositoryId },
  });
  return response.data.data;
};

export const getLessonById = async (lessonId: string): Promise<Lesson> => {
  const response = await api.get(`/content/lessons/${lessonId}`);
  return response.data.data;
};

export const createLesson = async (data: CreateLessonInput): Promise<Lesson> => {
  const response = await api.post("/content/lessons", data);
  return response.data.data;
};

export const deleteLesson = async (lessonId: number): Promise<void> => {
  await api.delete(`/content/lessons/${lessonId}`);
};

export const startLesson = async (lessonId: string): Promise<LessonProgress> => {
  const response = await api.post(`/content/lessons/${lessonId}/start`);
  return response.data.data;
};

export const completeLesson = async (
  lessonId: string,
  data: { puntuacion?: number; tiempo_segundos?: number }
): Promise<LessonProgress> => {
  const response = await api.post(`/content/lessons/${lessonId}/complete`, data);
  return response.data.data;
};

export const trackLessonTime = async (
  lessonId: string,
  tiempo_segundos: number
): Promise<LessonProgress> => {
  const response = await api.post(`/content/lessons/${lessonId}/time`, { tiempo_segundos });
  return response.data.data;
};

export const getLessonSummary = async (lessonId: string) => {
  const response = await api.get(`/content/lessons/${lessonId}/summary`);
  return response.data.data;
};

export const getLessonSolution = async (lessonId: string) => {
  const response = await api.get(`/content/lessons/${lessonId}/solution`);
  return response.data.data;
};

export const getLessonConceptMap = async (lessonId: string) => {
  const response = await api.get(`/content/lessons/${lessonId}/concept-map`);
  return response.data.data;
};

export const downloadLessonMaterial = async (lessonId: string, filename: string) => {
  const response = await api.get(`/content/lessons/${lessonId}/material`, {
    responseType: "blob",
  });

  const blobUrl = window.URL.createObjectURL(response.data);
  const link = document.createElement("a");
  link.href = blobUrl;
  link.download = `${filename}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(blobUrl);
};
