import { api } from "../../../services/api";
import type { QualityDashboardResponse } from "../types/quality";

export const getQualityDashboard = async (refresh = false) => {
  const response = await api.get<QualityDashboardResponse>("/quality/dashboard", {
    params: refresh ? { refresh: true } : undefined,
  });
  return response.data;
};
