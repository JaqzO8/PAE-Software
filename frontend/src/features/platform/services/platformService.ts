import { api } from "../../../services/api";
import { DEFAULT_LOCALE, type SupportedLocale } from "../../../config/i18nConfig";

export type ThemePreference = "light" | "dark";
export type FontSizePreference = "small" | "medium" | "large";

export interface UserPreferences {
  theme: ThemePreference;
  fontSize: FontSizePreference;
  language: SupportedLocale;
  reduceMotion: boolean;
  highContrast: boolean;
  emailReminders: boolean;
  challengeNotifications: boolean;
  communityMessages: boolean;
}

export interface SupportTicket {
  id: string;
  subject: string;
  description: string;
  category: "tecnico" | "cuenta" | "privacidad" | "contenido" | "accesibilidad";
  priority: "baja" | "media" | "alta";
  status: "abierto" | "en_revision" | "resuelto" | "cerrado";
  response?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSupportTicketData {
  subject: string;
  description: string;
  category: SupportTicket["category"];
  priority: SupportTicket["priority"];
}

export const DEFAULT_USER_PREFERENCES: UserPreferences = {
  theme: "light",
  fontSize: "medium",
  language: DEFAULT_LOCALE,
  reduceMotion: false,
  highContrast: false,
  emailReminders: true,
  challengeNotifications: true,
  communityMessages: false,
};

export const getPreferences = async (): Promise<UserPreferences> => {
  const response = await api.get<{ preferences: UserPreferences }>("/auth/preferences");
  return response.data.preferences;
};

export const updatePreferences = async (
  data: Partial<UserPreferences>,
): Promise<UserPreferences> => {
  const response = await api.put<{ preferences: UserPreferences }>("/auth/preferences", data);
  return response.data.preferences;
};

export const listSupportTickets = async (): Promise<SupportTicket[]> => {
  const response = await api.get<{ tickets: SupportTicket[] }>("/auth/support/tickets");
  return response.data.tickets;
};

export const createSupportTicket = async (
  data: CreateSupportTicketData,
): Promise<SupportTicket> => {
  const response = await api.post<{ ticket: SupportTicket }>("/auth/support/tickets", data);
  return response.data.ticket;
};

export const exportPrivacyData = async () => {
  const response = await api.get("/auth/privacy/export");
  return response.data;
};

export const requestAccountDeletion = async (reason: string): Promise<SupportTicket> => {
  const response = await api.post<{ ticket: SupportTicket }>("/auth/privacy/delete-request", {
    reason,
  });
  return response.data.ticket;
};
