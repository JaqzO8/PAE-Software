// src/features/groups/hooks/useTeacherGroups.ts
import { useState, useEffect } from "react";
import {
  createGroup as createGroupRequest,
  deleteGroup as deleteGroupRequest,
  getTeacherGroups,
  type Group,
} from "../services/groupsService";
import { useToast } from "../../../hooks/useToast";

export const useTeacherGroups = () => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const loadGroups = async () => {
    setIsLoading(true);
    try {
      const data = await getTeacherGroups();
      setGroups(data);
    } catch (error) {
      toast({ 
        variant: "destructive", 
        title: "Error", 
        description: "No se pudieron cargar tus comunidades." 
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadGroups();
  }, []);

  const createGroup = async (data: {
    name: string;
    description?: string;
    subject?: string;
    isPublic?: boolean;
  }) => {
    const group = await createGroupRequest(data);
    setGroups((prev) => [group, ...prev]);
    toast({ title: "Comunidad creada", description: "Ya puedes invitar estudiantes y conversar." });
    return group;
  };

  const deleteGroup = async (id: string) => {
    await deleteGroupRequest(id);
    setGroups((prev) => prev.filter((g) => g.id !== id));
    toast({ title: "Grupo eliminado", description: "La comunidad ha sido cerrada." });
  };

  return { groups, isLoading, createGroup, deleteGroup, refresh: loadGroups };
};
