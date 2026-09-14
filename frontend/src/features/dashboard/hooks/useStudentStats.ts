// src/features/dashboard/hooks/useStudentStats.ts
import { useState, useEffect } from "react";
import { getStudentStats, type StudentDashboardStats } from "../services/studentStatsService";
import { useToast } from "../../../hooks/useToast";

export const useStudentStats = () => {
    const [stats, setStats] = useState<StudentDashboardStats | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();

    useEffect(() => {
        const loadData = async () => {
            setIsLoading(true);
            try {
                const data = await getStudentStats();
                setStats(data);
            } catch (error) {
                toast({
                    variant: "destructive",
                    title: "Error",
                    description: "No se pudieron cargar las estadísticas.",
                });
            } finally {
                setIsLoading(false);
            }
        };
        loadData();
    }, []);

    return { stats, isLoading };
};