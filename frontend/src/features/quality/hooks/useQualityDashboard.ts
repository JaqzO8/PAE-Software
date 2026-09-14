import { useCallback, useEffect, useState } from "react";
import { getQualityDashboard } from "../services/qualityService";
import type { QualityDashboard } from "../types/quality";

interface QualityDashboardState {
  dashboard: QualityDashboard | null;
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
}

const initialState: QualityDashboardState = {
  dashboard: null,
  isLoading: true,
  isRefreshing: false,
  error: null,
};

export const useQualityDashboard = () => {
  const [state, setState] = useState(initialState);

  useEffect(() => {
    let isActive = true;

    getQualityDashboard()
      .then(({ dashboard }) => {
        if (!isActive) return;
        setState({ dashboard, isLoading: false, isRefreshing: false, error: null });
      })
      .catch(() => {
        if (!isActive) return;
        setState({
          dashboard: null,
          isLoading: false,
          isRefreshing: false,
          error: "No se pudieron cargar las métricas de calidad.",
        });
      });

    return () => {
      isActive = false;
    };
  }, []);

  const refresh = useCallback(async () => {
    setState((current) => ({ ...current, isRefreshing: true, error: null }));
    try {
      const { dashboard } = await getQualityDashboard(true);
      setState({ dashboard, isLoading: false, isRefreshing: false, error: null });
    } catch {
      setState((current) => ({
        ...current,
        isRefreshing: false,
        error: "No se pudo actualizar el análisis de SonarQube.",
      }));
    }
  }, []);

  return { ...state, refresh };
};
