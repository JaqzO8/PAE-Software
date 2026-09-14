// src/features/repository/services/repositoryService.ts
import { api } from "../../../services/api";

// ========================================
// INTERFACES
// ========================================

export interface Repository {
  id: string;
  title: string;
  description?: string;
  author: string;
  authorId: string;
  role: "docente" | "estudiante";
  views: number;
  downloads: number;
  rating: number;
  tags: string[];
  category?: string;
  isFavorite: boolean;
  isPublic: boolean;
  coverImage?: string;
  createdAt: string;
  updatedAt: string;
  resourceCount?: number;
}

export interface CreateRepoData {
  titulo: string;
  descripcion?: string;
  id_categoria?: number;
  tags?: string[];
  publico?: boolean;
  portada?: File;
}

export interface UpdateRepoData extends Partial<CreateRepoData> {}

// ========================================
// HELPER: Construir URL completa de imágenes
// ========================================
const getFullImageUrl = (imagePath?: string): string | undefined => {
  if (!imagePath) return undefined;
  
  // Si ya es una URL completa, retornarla tal cual
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  
  // Construir URL completa
  const baseUrl = import.meta.env.VITE_API_URL?.startsWith('http')
    ? import.meta.env.VITE_API_URL.replace('/api', '')
    : window.location.origin;
  
  // Si la ruta ya empieza con /, no duplicarla
  const path = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
  
  return `${baseUrl}${path}`;
};

// ========================================
// API CALLS
// ========================================

/**
 * Explorar repositorios públicos con filtros
 */
export const exploreRepositories = async (params?: {
  page?: number;
  limit?: number;
  search?: string;
  categoria?: number;
  tags?: string;
  orderBy?: string;
}): Promise<{ data: Repository[]; pagination: any }> => {
  try {
    const response = await api.get("/content/repositories/explore", { params });
    
    return {
      data: response.data.data.map(mapRepositoryFromAPI),
      pagination: response.data.pagination,
    };
  } catch (error: any) {
    console.error("Error explorando repositorios:", error);
    throw new Error(error.response?.data?.message || "Error al cargar repositorios");
  }
};

/**
 * Obtener repositorios más populares
 */
export const getPopularRepositories = async (limit: number = 10): Promise<Repository[]> => {
  try {
    const response = await api.get("/content/repositories/popular", {
      params: { limit },
    });
    
    return response.data.data.map(mapRepositoryFromAPI);
  } catch (error: any) {
    console.error("Error obteniendo repositorios populares:", error);
    throw new Error(error.response?.data?.message || "Error al cargar repositorios");
  }
};

/**
 * Obtener repositorios destacados
 */
export const getFeaturedRepositories = async (limit: number = 6): Promise<Repository[]> => {
  try {
    const response = await api.get("/content/repositories/destacados", {
      params: { limit },
    });
    
    return response.data.data.map(mapRepositoryFromAPI);
  } catch (error: any) {
    console.error("Error obteniendo repositorios destacados:", error);
    return [];
  }
};

/**
 * Obtener MIS repositorios (solo docentes)
 */
export const getMyRepositories = async (): Promise<Repository[]> => {
  try {
    const response = await api.get("/content/repositories/my");
    
    return response.data.data.map(mapRepositoryFromAPI);
  } catch (error: any) {
    console.error("Error obteniendo mis repositorios:", error);
    throw new Error(error.response?.data?.message || "Error al cargar tus repositorios");
  }
};

/**
 * Obtener un repositorio por ID
 */
export const getRepositoryById = async (id: string): Promise<Repository> => {
  try {
    const response = await api.get(`/content/repositories/${id}`);
    
    return mapRepositoryFromAPI(response.data.data);
  } catch (error: any) {
    console.error("Error obteniendo repositorio:", error);
    throw new Error(error.response?.data?.message || "Repositorio no encontrado");
  }
};

/**
 * Crear repositorio (solo docentes)
 */
export const createRepository = async (data: CreateRepoData): Promise<Repository> => {
  try {
    const formData = new FormData();
    
    formData.append("titulo", data.titulo);
    if (data.descripcion) formData.append("descripcion", data.descripcion);
    if (data.id_categoria) formData.append("id_categoria", data.id_categoria.toString());
    if (data.publico !== undefined) formData.append("publico", data.publico.toString());
    if (data.tags && data.tags.length > 0) {
      formData.append("tags", JSON.stringify(data.tags));
    }
    if (data.portada) formData.append("portada", data.portada);

    const response = await api.post("/content/repositories", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    
    return mapRepositoryFromAPI(response.data.data);
  } catch (error: any) {
    console.error("Error creando repositorio:", error);
    throw new Error(error.response?.data?.message || "Error al crear repositorio");
  }
};

/**
 * Actualizar repositorio
 */
export const updateRepository = async (id: string, data: UpdateRepoData): Promise<Repository> => {
  try {
    const formData = new FormData();
    
    if (data.titulo) formData.append("titulo", data.titulo);
    if (data.descripcion) formData.append("descripcion", data.descripcion);
    if (data.id_categoria) formData.append("id_categoria", data.id_categoria.toString());
    if (data.publico !== undefined) formData.append("publico", data.publico.toString());
    if (data.tags && data.tags.length > 0) {
      formData.append("tags", JSON.stringify(data.tags));
    }
    if (data.portada) formData.append("portada", data.portada);

    const response = await api.put(`/content/repositories/${id}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    
    return mapRepositoryFromAPI(response.data.data);
  } catch (error: any) {
    console.error("Error actualizando repositorio:", error);
    throw new Error(error.response?.data?.message || "Error al actualizar repositorio");
  }
};

/**
 * Eliminar repositorio (soft delete)
 */
export const deleteRepository = async (id: string): Promise<void> => {
  try {
    await api.delete(`/content/repositories/${id}`);
  } catch (error: any) {
    console.error("Error eliminando repositorio:", error);
    throw new Error(error.response?.data?.message || "Error al eliminar repositorio");
  }
};

// ========================================
// FAVORITOS
// ========================================

/**
 * Obtener mis favoritos
 */
export const getFavorites = async (): Promise<Repository[]> => {
  try {
    const response = await api.get("/content/favorites");
    
    return response.data.data.map((fav: any) => 
      mapRepositoryFromAPI({ ...fav.repositorio, isFavorite: true })
    );
  } catch (error: any) {
    console.error("Error obteniendo favoritos:", error);
    throw new Error(error.response?.data?.message || "Error al cargar favoritos");
  }
};

/**
 * Verificar si un repo está en favoritos
 */
export const checkFavorite = async (id: string): Promise<boolean> => {
  try {
    const response = await api.get(`/content/favorites/check/${id}`);
    return response.data.isFavorite;
  } catch (error) {
    return false;
  }
};

/**
 * Agregar a favoritos
 */
export const addToFavorites = async (id: string): Promise<void> => {
  try {
    await api.post(`/content/favorites/${id}`);
  } catch (error: any) {
    console.error("Error agregando a favoritos:", error);
    throw new Error(error.response?.data?.message || "Error al agregar a favoritos");
  }
};

/**
 * Quitar de favoritos
 */
export const removeFromFavorites = async (id: string): Promise<void> => {
  try {
    await api.delete(`/content/favorites/${id}`);
  } catch (error: any) {
    console.error("Error quitando de favoritos:", error);
    throw new Error(error.response?.data?.message || "Error al quitar de favoritos");
  }
};

/**
 * Toggle favorito
 */
export const toggleFavorite = async (id: string, currentStatus: boolean): Promise<void> => {
  if (currentStatus) {
    await removeFromFavorites(id);
  } else {
    await addToFavorites(id);
  }
};

// ========================================
// CALIFICACIONES
// ========================================

/**
 * Calificar repositorio
 */
export const rateRepository = async (
  id: string, 
  puntuacion: number, 
  comentario?: string
): Promise<void> => {
  try {
    await api.post(`/content/repositories/${id}/rate`, {
      puntuacion,
      comentario,
    });
  } catch (error: any) {
    console.error("Error calificando repositorio:", error);
    throw new Error(error.response?.data?.message || "Error al calificar");
  }
};

/**
 * Obtener mi calificación
 */
export const getMyRating = async (id: string): Promise<any> => {
  try {
    const response = await api.get(`/content/repositories/${id}/my-rating`);
    return response.data.data;
  } catch (error) {
    return null;
  }
};

// ========================================
// MAPPER: API → Frontend
// ========================================

const mapRepositoryFromAPI = (apiRepo: any): Repository => {
  console.log("📦 Mapeando repositorio:", apiRepo); // Debug
  
  return {
    id: apiRepo.id_repositorio?.toString() || apiRepo.id,
    title: apiRepo.titulo || "",
    description: apiRepo.descripcion || "",
    author: "Docente", // TODO: Obtener del backend cuando esté disponible
    authorId: apiRepo.id_profesor?.toString() || "",
    role: "docente",
    views: apiRepo.cantidad_vistas || 0,
    downloads: apiRepo.cantidad_descargas || 0,
    rating: parseFloat(apiRepo.rating_promedio) || 0,
    tags: apiRepo.tags?.map((t: any) => t.nombre || t) || [],
    category: apiRepo.categoria?.nombre || "",
    isFavorite: apiRepo.isFavorite || false,
    isPublic: apiRepo.publico || false,
    coverImage: getFullImageUrl(apiRepo.portada),
    createdAt: new Date(apiRepo.fecha_creacion).toLocaleDateString("es-PE"),
    updatedAt: new Date(apiRepo.fecha_actualizacion || apiRepo.fecha_creacion).toLocaleDateString("es-PE"),
    resourceCount: apiRepo.recursos?.length || 0,
  };
};
