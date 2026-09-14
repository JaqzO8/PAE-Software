import { useCallback, useEffect, useState } from "react";
import { getTeacherStats, type DashboardStats } from "../services/teacherStatsService";
import { useToast } from "../../../hooks/useToast";

export const useTeacherStats = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const refreshStats = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getTeacherStats();
      setStats(data);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudieron cargar las estadisticas.",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    refreshStats();
  }, [refreshStats]);

  return { stats, isLoading, refreshStats };
};
