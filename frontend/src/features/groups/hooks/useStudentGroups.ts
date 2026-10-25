import { useState, useEffect, useCallback } from "react";
import { getStudentGroups, type Group } from "../services/groupsService";
import { useToast } from "../../../hooks/useToast";

export const useStudentGroups = () => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [revision, setRevision] = useState(0);
  const { toast } = useToast();
  const refresh = useCallback(() => setRevision(value => value + 1), []);

  useEffect(() => {
    const controller = new AbortController();
    getStudentGroups(controller.signal)
      .then(setGroups)
      .catch(() => {
        if (!controller.signal.aborted) toast({ variant: "destructive", title: "Error", description: "No se pudieron cargar tus comunidades." });
      })
      .finally(() => { if (!controller.signal.aborted) setIsLoading(false); });
    return () => controller.abort();
  }, [toast, revision]);

  return { groups, isLoading, refresh };
};
