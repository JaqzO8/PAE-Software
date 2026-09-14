// src/features/dashboard/services/teacherStatsService.ts
import { api } from "../../../services/api";

export interface AnalyticsSettings {
  lowPerformanceThreshold: number;
  criticalPerformanceThreshold: number;
  minAttemptsForAlert: number;
  weakSubjectMinQuestions: number;
  targetAccuracy: number;
  studentHistoryLimit: number;
  cohortHistoryLimit: number;
}

export interface StudySettings {
  restReminderMinutes: number;
  longTimeMultiplier: number;
  fastTimeMultiplier: number;
  minTrackedSeconds: number;
}

export interface LessonStudyStats {
  totalHours: number;
  completedLessons: number;
  averageLessonMinutes: number;
  longSessions: number;
  fastCompletions: number;
  restReminderMinutes: number;
  recommendation: string;
}

export interface DashboardStats {
  activeStudents: number;
  totalRepositories: number;
  pendingEvaluations: number;
  studentGrowth: number;
  simulacroAttempts: number;
  averageAccuracy: number;
  pendingOpenReviews: number;
  cohortAverageAccuracy: number;
  lowPerformanceAlerts: number;
  performanceDistribution: {
    low: number;
    medium: number;
    high: number;
  };
  settings: AnalyticsSettings;
  lessonStudy: LessonStudyStats;
  studySettings: StudySettings;
  weakSubject?: string;
}

const DEFAULT_SETTINGS: AnalyticsSettings = {
  lowPerformanceThreshold: 60,
  criticalPerformanceThreshold: 45,
  minAttemptsForAlert: 2,
  weakSubjectMinQuestions: 2,
  targetAccuracy: 70,
  studentHistoryLimit: 100,
  cohortHistoryLimit: 500,
};

const DEFAULT_STUDY_SETTINGS: StudySettings = {
  restReminderMinutes: 30,
  longTimeMultiplier: 1.5,
  fastTimeMultiplier: 0.5,
  minTrackedSeconds: 30,
};

const DEFAULT_LESSON_STUDY: LessonStudyStats = {
  totalHours: 0,
  completedLessons: 0,
  averageLessonMinutes: 0,
  longSessions: 0,
  fastCompletions: 0,
  restReminderMinutes: 30,
  recommendation: "Aun no hay progreso de lecciones suficiente.",
};

export const getTeacherStats = async (): Promise<DashboardStats> => {
  try {
    const [contentResponse, learningResponse] = await Promise.allSettled([
      api.get("/content/stats/teacher"),
      api.get("/learning/analytics/summary"),
    ]);
    const content = contentResponse.status === "fulfilled" ? contentResponse.value.data.data : {};
    const learning = learningResponse.status === "fulfilled" ? learningResponse.value.data.data : {};

    return {
      activeStudents: learning.studentsWithAttempts ?? content.activeStudents ?? 0,
      totalRepositories: content.totalRepositories || 0,
      pendingEvaluations: Math.max(content.pendingEvaluations || 0, learning.pendingOpenReviews || 0),
      studentGrowth: content.studentGrowth || 0,
      simulacroAttempts: learning.attemptsCount || 0,
      averageAccuracy: learning.averageAccuracy || 0,
      pendingOpenReviews: learning.pendingOpenReviews || 0,
      cohortAverageAccuracy: learning.cohortAverageAccuracy || 0,
      lowPerformanceAlerts: learning.lowPerformanceAlerts?.length || 0,
      performanceDistribution: learning.performanceDistribution || { low: 0, medium: 0, high: 0 },
      settings: learning.settings || DEFAULT_SETTINGS,
      lessonStudy: content.lessonStudy || DEFAULT_LESSON_STUDY,
      studySettings: content.studySettings || DEFAULT_STUDY_SETTINGS,
      weakSubject: learning.weakSubjects?.[0]?.subject,
    };
  } catch (error) {
    console.error("Error obteniendo estadisticas de docente:", error);

    return {
      activeStudents: 0,
      totalRepositories: 0,
      pendingEvaluations: 0,
      studentGrowth: 0,
      simulacroAttempts: 0,
      averageAccuracy: 0,
      pendingOpenReviews: 0,
      cohortAverageAccuracy: 0,
      lowPerformanceAlerts: 0,
      performanceDistribution: { low: 0, medium: 0, high: 0 },
      settings: DEFAULT_SETTINGS,
      lessonStudy: DEFAULT_LESSON_STUDY,
      studySettings: DEFAULT_STUDY_SETTINGS,
    };
  }
};

export const updateAnalyticsSettings = async (
  settings: AnalyticsSettings
): Promise<AnalyticsSettings> => {
  const response = await api.put<{ data: AnalyticsSettings }>("/learning/analytics/settings", settings);
  return response.data.data;
};

export const updateStudySettings = async (
  settings: StudySettings
): Promise<StudySettings> => {
  const response = await api.put<{ data: StudySettings }>("/content/stats/study-settings", settings);
  return response.data.data;
};
