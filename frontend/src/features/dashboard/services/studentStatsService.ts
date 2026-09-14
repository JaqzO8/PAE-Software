// src/features/dashboard/services/studentStatsService.ts
import { api } from "../../../services/api";

export interface StudentDashboardStats {
    savedResources: number;
    activeCommunities: number;
    studyHours: number;
    weeklyGrowth: number;
    simulacrosCompleted: number;
    averageAccuracy: number;
    bestScore: number;
    cohortAverageAccuracy: number;
    cohortPercentile: number | null;
    cohortGap: number;
    averageLessonMinutes: number;
    completedLessons: number;
    longStudySessions: number;
    fastCompletions: number;
    studyRecommendation?: string;
    weakSubject?: string;
    learningRecommendation?: string;
}

export const getStudentStats = async (): Promise<StudentDashboardStats> => {
    try {
        const [contentResponse, learningResponse] = await Promise.allSettled([
            api.get("/content/stats/student"),
            api.get("/learning/analytics/summary"),
        ]);
        const content = contentResponse.status === "fulfilled" ? contentResponse.value.data.data : {};
        const learning = learningResponse.status === "fulfilled" ? learningResponse.value.data.data : {};
        const weakSubject = learning.weakSubjects?.[0]?.subject;
        const lessonStudy = content.lessonStudy || {};

        return {
            savedResources: content.savedResources || 0,
            activeCommunities: content.activeCommunities || 0,
            studyHours: learning.totalStudyHours ?? content.studyHours ?? 0,
            weeklyGrowth: content.weeklyGrowth || 0,
            simulacrosCompleted: learning.attemptsCount || 0,
            averageAccuracy: learning.averageAccuracy || 0,
            bestScore: learning.bestScore || 0,
            cohortAverageAccuracy: learning.cohortAverageAccuracy || 0,
            cohortPercentile: learning.cohortPercentile ?? null,
            cohortGap: learning.cohortGap || 0,
            averageLessonMinutes: lessonStudy.averageLessonMinutes || 0,
            completedLessons: lessonStudy.completedLessons || 0,
            longStudySessions: lessonStudy.longSessions || 0,
            fastCompletions: lessonStudy.fastCompletions || 0,
            studyRecommendation: lessonStudy.recommendation,
            weakSubject,
            learningRecommendation: learning.recommendations?.[0],
        };
    } catch (error) {
        console.error("Error obteniendo stats de estudiante:", error);
        // Fallback temporal
        return {
            savedResources: 0,
            activeCommunities: 0,
            studyHours: 0,
            weeklyGrowth: 0,
            simulacrosCompleted: 0,
            averageAccuracy: 0,
            bestScore: 0,
            cohortAverageAccuracy: 0,
            cohortPercentile: null,
            cohortGap: 0,
            averageLessonMinutes: 0,
            completedLessons: 0,
            longStudySessions: 0,
            fastCompletions: 0,
        };
    }
};
