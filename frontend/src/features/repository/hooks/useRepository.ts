// src/features/repository/hooks/useRepository.ts
import { useState, useEffect } from "react";
import { 
  getPopularRepositories, 
  getFeaturedRepositories,
  toggleFavorite as toggleFavAPI,
  type Repository 
} from "../services/repositoryService";
import { useToast } from "../../../hooks/useToast";

export const useRepository = (featured: boolean = false) => {
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadRepositories();
  }, [featured]);

  const loadRepositories = async () => {
    setIsLoading(true);
    try {
      const data = featured 
        ? await getFeaturedRepositories() 
        : await getPopularRepositories();
      setRepositories(data);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error al cargar",
        description: error.message || "No se pudieron obtener los repositorios.",
      });
      setRepositories([]);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleFavorite = async (id: string) => {
    const repo = repositories.find(r => r.id === id);
    if (!repo) return;

    try {
      // Optimistic update
      setRepositories(prev => 
        prev.map(r => r.id === id ? { ...r, isFavorite: !r.isFavorite } : r)
      );

      await toggleFavAPI(id, repo.isFavorite);

      toast({
        title: repo.isFavorite ? "Eliminado de favoritos" : "Agregado a favoritos",
        description: repo.isFavorite 
          ? "El repositorio fue quitado de tus favoritos" 
          : "El repositorio fue agregado a tus favoritos",
      });
    } catch (error: any) {
      // Revertir cambio en caso de error
      setRepositories(prev => 
        prev.map(r => r.id === id ? { ...r, isFavorite: repo.isFavorite } : r)
      );
      
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "No se pudo actualizar favoritos",
      });
    }
  };

  return {
    repositories,
    isLoading,
    refresh: loadRepositories,
    toggleFavorite,
  };
};