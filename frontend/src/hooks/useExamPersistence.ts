// src/hooks/useExamPersistence.ts
import { useState, useEffect, useCallback } from "react";
import type { SimulacroResult } from "../features/learning/services/learningService";

interface ExamState {
  simulacro: SimulacroResult;
  answers: (number | string | null)[];
  currentQuestionIndex: number;
  timeRemaining: number;
  markedForReview: number[];
}

const STORAGE_KEY = "exam_state";
const EXPIRY_TIME = 4 * 60 * 60 * 1000; // 4 horas en milisegundos

/**
 * Hook para persistir el estado del examen en sessionStorage
 * Se limpia automáticamente después de 4 horas o al finalizar
 */
export const useExamPersistence = (simulacroId?: string) => {
  const [persistedState, setPersistedState] = useState<ExamState | null>(null);

  // ✅ Cargar estado guardado al montar
  useEffect(() => {
    if (!simulacroId) return;

    try {
      const stored = sessionStorage.getItem(STORAGE_KEY);
      if (!stored) return;

      const parsed = JSON.parse(stored);
      
      // Verificar expiración
      if (parsed.expiresAt && Date.now() > parsed.expiresAt) {
        sessionStorage.removeItem(STORAGE_KEY);
        return;
      }

      // Verificar que sea el mismo examen
      if (parsed.state?.simulacro?.id === simulacroId) {
        setPersistedState(parsed.state);
      }
    } catch (error) {
      console.error("Error loading exam state:", error);
      sessionStorage.removeItem(STORAGE_KEY);
    }
  }, [simulacroId]);

  // ✅ Guardar estado
  const saveState = useCallback((state: ExamState) => {
    try {
      const dataToStore = {
        state,
        expiresAt: Date.now() + EXPIRY_TIME,
      };
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(dataToStore));
    } catch (error) {
      console.error("Error saving exam state:", error);
    }
  }, []);

  // ✅ Limpiar estado
  const clearState = useCallback(() => {
    sessionStorage.removeItem(STORAGE_KEY);
    setPersistedState(null);
  }, []);

  return {
    persistedState,
    saveState,
    clearState,
  };
};
