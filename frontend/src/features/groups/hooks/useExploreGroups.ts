// src/features/groups/hooks/useExploreGroups.ts
import { useState, useEffect } from "react";
import { getPublicGroups, joinGroup, type JoinRequest } from "../services/exploreGroupsService";
import type { Group } from "../services/groupsService";
import { useToast } from "../../../hooks/useToast";

export const useExploreGroups = () => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isJoining, setIsJoining] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadGroups();
  }, []);

  const loadGroups = async () => {
    setIsLoading(true);
    try {
      const data = await getPublicGroups();
      setGroups(data);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudieron cargar las comunidades públicas.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const requestJoin = async (request: JoinRequest) => {
    setIsJoining(true);
    try {
      const response = await joinGroup(request);
      toast({
        title: "Te uniste a la comunidad",
        description: response.message,
      });
      setGroups((prev) => prev.filter((group) => group.id !== request.groupId));
      return response;
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo enviar la solicitud.",
      });
      throw error;
    } finally {
      setIsJoining(false);
    }
  };

  return { groups, isLoading, isJoining, requestJoin, refresh: loadGroups };
};
