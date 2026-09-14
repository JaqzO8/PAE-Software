// src/features/groups/hooks/useStudentGroups.ts
import { useState, useEffect } from "react";
import { getStudentGroups, type Group } from "../services/groupsService";
import { useToast } from "../../../hooks/useToast";

export const useStudentGroups = () => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadGroups();
  }, []);

  const loadGroups = async () => {
    setIsLoading(true);
    try {
      const data = await getStudentGroups();
      setGroups(data);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudieron cargar tus comunidades.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return { groups, isLoading };
};