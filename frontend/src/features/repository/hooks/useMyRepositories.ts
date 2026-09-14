// src/features/repository/hooks/useMyRepositories.ts
import { useState, useEffect } from "react";
import { 
  getMyRepositories, 
  deleteRepository as deleteRepoService,
  createRepository as createRepoService,
  type Repository,
  type CreateRepoData
} from "../services/repositoryService";
import { useToast } from "../../../hooks/useToast";
import { useNavigate } from "react-router-dom";

export const useMyRepositories = () => {
  const [repos, setRepos] = useState<Repository[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    loadRepos();
  }, []);

  const loadRepos = async () => {
    setIsLoading(true);
    try {
      const data = await getMyRepositories();
      setRepos(data);
    } catch (error: any) {
      toast({ 
        variant: "destructive", 
        title: "Error", 
        description: error.message || "No se cargaron tus repositorios." 
      });
      setRepos([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Acción: Eliminar
  const remove = async (id: string) => {
    try {
      // Optimistic update
      setRepos(prev => prev.filter(r => r.id !== id));
      
      await deleteRepoService(id);
      
      toast({ 
        title: "Eliminado", 
        description: "El repositorio ha sido eliminado." 
      });
    } catch (error: any) {
      // Recargar en caso de error
      loadRepos();
      
      toast({ 
        variant: "destructive", 
        title: "Error", 
        description: error.message || "No se pudo eliminar." 
      });
    }
  };

  // Acción: Crear
  const create = async (data: CreateRepoData) => {
    setIsLoading(true);
    try {
      await createRepoService(data);
      
      toast({ 
        title: "Éxito", 
        description: "Repositorio creado correctamente." 
      });
      
      navigate("/docente/repositorios/mis-repos");
    } catch (error: any) {
      toast({ 
        variant: "destructive", 
        title: "Error", 
        description: error.message || "No se pudo crear el repositorio." 
      });
    } finally {
      setIsLoading(false);
    }
  };

  return { 
    repos, 
    isLoading, 
    remove, 
    create, 
    refresh: loadRepos 
  };
};