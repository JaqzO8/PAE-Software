import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useAuth } from "./AuthContext";
import {
  DEFAULT_USER_PREFERENCES,
  getPreferences,
  updatePreferences as updatePreferencesApi,
  type UserPreferences,
} from "../features/platform/services/platformService";
import { DEFAULT_LOCALE, isSupportedLocale } from "../config/i18nConfig";

interface AppearanceContextType {
  preferences: UserPreferences;
  isSyncing: boolean;
  updatePreferences: (changes: Partial<UserPreferences>) => Promise<void>;
}

const STORAGE_KEY = "pae-ui-preferences";

const AppearanceContext = createContext<AppearanceContextType | undefined>(undefined);

const readStoredPreferences = (): UserPreferences => {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return DEFAULT_USER_PREFERENCES;
  }

  try {
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_USER_PREFERENCES,
      ...parsed,
      language: isSupportedLocale(parsed.language) ? parsed.language : DEFAULT_LOCALE,
    };
  } catch {
    return DEFAULT_USER_PREFERENCES;
  }
};

const persistAndApply = (preferences: UserPreferences) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
  const root = document.documentElement;

  root.classList.toggle("dark", preferences.theme === "dark");
  root.dataset.fontSize = preferences.fontSize;
  root.dataset.motion = preferences.reduceMotion ? "reduced" : "normal";
  root.dataset.contrast = preferences.highContrast ? "high" : "normal";
  root.dataset.locale = preferences.language;
  root.lang = preferences.language;
};

export const AppearanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, token } = useAuth();
  const [preferences, setPreferences] = useState<UserPreferences>(() => readStoredPreferences());
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    persistAndApply(preferences);
  }, [preferences]);

  useEffect(() => {
    if (!isAuthenticated || !token) {
      return;
    }

    const loadPreferences = async () => {
      setIsSyncing(true);
      try {
        const remote = await getPreferences();
        setPreferences((current) => ({ ...DEFAULT_USER_PREFERENCES, ...current, ...remote }));
      } catch (error) {
        console.warn("No se pudieron sincronizar las preferencias de interfaz.", error);
      } finally {
        setIsSyncing(false);
      }
    };

    loadPreferences();
  }, [isAuthenticated, token]);

  const updatePreferences = useCallback(
    async (changes: Partial<UserPreferences>) => {
      const next = { ...preferences, ...changes };
      setPreferences(next);

      if (!isAuthenticated || !token) {
        return;
      }

      setIsSyncing(true);
      try {
        const remote = await updatePreferencesApi(changes);
        setPreferences((current) => ({ ...DEFAULT_USER_PREFERENCES, ...current, ...remote }));
      } catch (error) {
        console.warn("No se pudieron guardar las preferencias en el servidor.", error);
      } finally {
        setIsSyncing(false);
      }
    },
    [isAuthenticated, preferences, token],
  );

  const value = useMemo(
    () => ({ preferences, isSyncing, updatePreferences }),
    [isSyncing, preferences, updatePreferences],
  );

  return <AppearanceContext.Provider value={value}>{children}</AppearanceContext.Provider>;
};

export const useAppearance = () => {
  const context = useContext(AppearanceContext);
  if (!context) {
    throw new Error("useAppearance must be used within an AppearanceProvider");
  }
  return context;
};
