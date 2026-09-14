// src/features/repository/hooks/useFavorites.ts
import { useState, useEffect } from "react";
import { 
  getFavorites, 
  toggleFavorite as toggleFavAPI,
  type Repository 
} from "../services/repositoryService";
import { useToast } from "../../../hooks/useToast";

export const useFavorites = () => {
  const [favorites, setFavorites] = useState<Repository[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadFavorites();
  }, []);

  const loadFavorites = async () => {
    setIsLoading(true);
    try {
      const data = await getFavorites();
      setFavorites(data);
    } catch (error: any) {
      toast({ 
        variant: "destructive", 
        title: "Error", 
        description: error.message || "No se pudieron cargar tus favoritos." 
      });
      setFavorites([]);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleFavorite = async (id: string) => {
    const repo = favorites.find(r => r.id === id);
    if (!repo) return;

    try {
      // Quitar de la lista (optimistic)
      setFavorites(prev => prev.filter(r => r.id !== id));

      await toggleFavAPI(id, true); // true porque está en favoritos

      toast({
        title: "Eliminado de favoritos",
        description: "El repositorio fue quitado de tus favoritos",
      });
    } catch (error: any) {
      // Revertir en caso de error
      setFavorites(prev => [...prev, repo]);
      
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "No se pudo actualizar favoritos",
      });
    }
  };

  return { 
    favorites, 
    isLoading, 
    refresh: loadFavorites,
    toggleFavorite,
  };
};