export const SUPPORTED_LOCALES = ["es-PE", "es", "en"] as const;

export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

export const DEFAULT_LOCALE: SupportedLocale = "es-PE";

export const LOCALE_LABELS: Record<SupportedLocale, string> = {
  "es-PE": "Espanol (Peru)",
  es: "Espanol",
  en: "English",
};

export const isSupportedLocale = (locale?: string): locale is SupportedLocale => {
  return SUPPORTED_LOCALES.includes(locale as SupportedLocale);
};
