import { api } from "../../../services/api";

export interface PlanningSettings {
  sessionDurationMinutes: number;
  reminderLeadMinutes: number;
  pomodoroFocusMinutes: number;
  pomodoroBreakMinutes: number;
  maxSessionsPerDay: number;
}

export interface StudyPreference {
  preferredDays: number[];
  startTime: string;
  endTime: string;
  subjects: string[];
  remindersEnabled: boolean;
}

export interface StudySuggestion {
  title: string;
  subject: string;
  scheduledAt: string;
  durationMinutes: number;
  reminderAt: string;
}

export interface StudyReminder {
  id_recordatorio: number;
  titulo: string;
  materia?: string;
  programado_para: string;
  duracion_minutos: number;
  estado: "pendiente" | "completado" | "omitido";
  origen: string;
}

export interface PlanningOverview {
  settings: PlanningSettings;
  preference: StudyPreference;
  suggestions: StudySuggestion[];
  reminders: StudyReminder[];
}

export const getPlanningOverview = async (): Promise<PlanningOverview> => {
  const response = await api.get<{ data: PlanningOverview }>("/content/planning");
  return response.data.data;
};

export const updateStudyPreference = async (preference: StudyPreference): Promise<StudyPreference> => {
  const response = await api.put<{ data: StudyPreference }>("/content/planning/preferences", preference);
  return response.data.data;
};

export const generateStudyReminders = async (): Promise<StudyReminder[]> => {
  const response = await api.post<{ data: StudyReminder[] }>("/content/planning/reminders/generate");
  return response.data.data;
};

export const updateReminderStatus = async (
  id: number,
  status: "pendiente" | "completado" | "omitido"
): Promise<StudyReminder> => {
  const response = await api.patch<{ data: StudyReminder }>(`/content/planning/reminders/${id}/status`, { status });
  return response.data.data;
};
