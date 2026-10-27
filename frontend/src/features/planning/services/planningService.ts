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
  timeZone: string;
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
  const response = await api.get<{ data: PlanningOverview }>("/learning/planning");
  return response.data.data;
};

export const updateStudyPreference = async (preference: StudyPreference): Promise<StudyPreference> => {
  const response = await api.put<{ data: StudyPreference }>("/learning/planning/preferences", preference);
  return response.data.data;
};

export const generateStudyReminders = async (): Promise<StudyReminder[]> => {
  const response = await api.post<{ data: StudyReminder[] }>("/learning/planning/reminders/generate");
  return response.data.data;
};

export const updateReminderStatus = async (
  id: number,
  status: "pendiente" | "completado" | "omitido"
): Promise<StudyReminder> => {
  const response = await api.patch<{ data: StudyReminder }>(`/learning/planning/reminders/${id}/status`, { status });
  return response.data.data;
};

export const cancelReminder = async (id: number): Promise<StudyReminder> => {
  const response = await api.patch<{ data: StudyReminder }>(`/learning/planning/reminders/${id}/cancel`);
  return response.data.data;
};

export type PomodoroState = "idle" | "running" | "paused" | "completed";

export const transitionPomodoro = async (
  currentState: PomodoroState,
  action: "start" | "pause" | "resume" | "finish",
  secondsElapsed: number
): Promise<{ currentState: PomodoroState; secondsElapsed: number }> => {
  const response = await api.post<{ data: { currentState: PomodoroState; secondsElapsed: number } }>(
    "/learning/planning/pomodoro",
    { currentState, action, secondsElapsed }
  );
  return response.data.data;
};
