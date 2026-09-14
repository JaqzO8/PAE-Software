// src/features/forums/hooks/useForums.ts
import { useState, useEffect } from "react";
import { 
  getForums, 
  getMyForums,
  getForumDetail,
  createForum,
  likeForum as likeForumService,
  reportForum as reportForumService,
  type ForumPost,
  type ForumDetail,
  type CreateForumData 
} from "../services/forumsService";
import { useToast } from "../../../hooks/useToast";

export const useForums = (myForumsOnly: boolean = false) => {
  const [forums, setForums] = useState<ForumPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadForums();
  }, [myForumsOnly]);

  const loadForums = async () => {
    setIsLoading(true);
    try {
      const data = myForumsOnly ? await getMyForums() : await getForums();
      setForums(data);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudieron cargar los foros.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleLike = async (forumId: string) => {
    try {
      await likeForumService(forumId);
      
      // Actualización optimista
      setForums(prev => prev.map(forum => {
        if (forum.id === forumId) {
          return {
            ...forum,
            likes: forum.isLiked ? forum.likes - 1 : forum.likes + 1,
            isLiked: !forum.isLiked,
          };
        }
        return forum;
      }));
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo actualizar el like.",
      });
    }
  };

  const report = async (forumId: string, reason: string) => {
    try {
      await reportForumService(forumId, reason);
      toast({
        title: "Reporte enviado",
        description: "Gracias por ayudar a mantener la comunidad segura.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo enviar el reporte.",
      });
    }
  };

  return { forums, isLoading, toggleLike, report, refresh: loadForums };
};

// Hook separado para detalle de foro
export const useForumDetail = (forumId: string) => {
  const [forum, setForum] = useState<ForumDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (!forumId) return;
    loadForumDetail();
  }, [forumId]);

  const loadForumDetail = async () => {
    setIsLoading(true);
    try {
      const data = await getForumDetail(forumId);
      setForum(data);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo cargar el foro.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return { forum, isLoading, refresh: loadForumDetail };
};

// Hook para crear foro
export const useCreateForum = () => {
  const [isCreating, setIsCreating] = useState(false);
  const { toast } = useToast();

  const create = async (data: CreateForumData) => {
    setIsCreating(true);
    try {
      await createForum(data);
      toast({
        title: "Foro creado",
        description: "Tu pregunta ha sido publicada exitosamente.",
      });
      return true;
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo crear el foro.",
      });
      return false;
    } finally {
      setIsCreating(false);
    }
  };

  return { create, isCreating };
};