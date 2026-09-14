import { useState, useEffect } from "react";
import { getGroupResources } from "../services/groupResourcesService";
import type { Repository } from "../../repository/services/repositoryService";
import { useToast } from "../../../hooks/useToast";

export const useGroupResources = () => {
  const [resources, setResources] = useState<Repository[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetch = async () => {
      setIsLoading(true);
      try {
        const data = await getGroupResources();
        setResources(data);
      } catch (error) {
        toast({ 
          variant: "destructive", 
          title: "Error", 
          description: "No se cargaron los recursos de tus grupos." 
        });
      } finally {
        setIsLoading(false);
      }
    };
    fetch();
  }, []);

  return { resources, isLoading };
};