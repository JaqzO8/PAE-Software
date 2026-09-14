import type { SimulacroResult } from "./learningService";

export interface CachedExam {
  simulacro: SimulacroResult;
  answers: Array<number | string | null>;
  currentQuestionIndex: number;
  timeRemaining: number;
  updatedAt: string;
}

const STORAGE_KEY = "pae.activeExam";

export const saveActiveExam = (exam: CachedExam) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...exam, updatedAt: new Date().toISOString() }));
};

export const loadActiveExam = (): CachedExam | null => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    return null;
  }
};

export const clearActiveExam = (simulacroId?: string) => {
  const cached = loadActiveExam();
  if (!simulacroId || cached?.simulacro.id === simulacroId) {
    localStorage.removeItem(STORAGE_KEY);
  }
};
