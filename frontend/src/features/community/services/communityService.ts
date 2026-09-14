import { api } from "../../../services/api";

export interface Community {
  id: number | string;
  nombre: string;
  descripcion?: string | null;
  icono_url?: string | null;
  materia?: string | null;
  profesor?: {
    id: number | string;
    nombres: string;
    apellidos: string;
    avatar?: string | null;
  } | null;
  puntos_prestigio?: number;
  proximo_hito?: number;
  miembros_count?: number;
  desafio_activo?: unknown;
  fecha_creacion?: string;
  is_member?: boolean;
  messages?: CommunityMessage[];
  participants?: CommunityParticipant[];
  forums?: CommunityForum[];
  analytics?: CommunityAnalytics;
}

export interface CommunityMessage {
  id: number | string;
  content: string;
  author: string;
  authorRole: "docente" | "estudiante";
  timestamp: string;
  avatar?: string | null;
  userId?: number | string;
}

export interface CommunityParticipant {
  id: number | string;
  name: string;
  role: "docente" | "estudiante";
  avatar?: string | null;
  email: string;
  joinedAt: string;
}

export interface CommunityForum {
  id: number | string;
  title: string;
  author: string;
  authorAvatar?: string | null;
  replies: number;
  lastReply: string;
  isResolved: boolean;
}

export interface CommunityAnalytics {
  totalMessages: number;
  activeMembers: number;
  avgResponseTime: string;
  participationRate: number;
  topContributors: Array<{
    name: string;
    messages: number;
    avatar?: string | null;
  }>;
  performance?: CommunityPerformance | null;
}

export interface CommunitySettings {
  restSessionMinutes: number;
  wellbeingItemsLimit: number;
  universityNewsLimit: number;
  performanceWindowDays: number;
  activeParticipationTargetPercent: number;
  lowParticipationThreshold: number;
  messageTargetPerMember: number;
  resourceTargetPerCommunity: number;
  challengeTargetPerMonth: number;
  performanceWeights: {
    participation: number;
    messages: number;
    resources: number;
    challenges: number;
  };
}

export interface WellbeingItem {
  id: number | string;
  type: "descanso" | "orientacion" | "bienestar";
  title: string;
  description: string;
  actionLabel?: string | null;
  url?: string | null;
  durationMinutes?: number | null;
  tags: string[];
  publishedAt: string;
}

export interface UniversityNewsItem {
  id: number | string;
  title: string;
  summary: string;
  university: string;
  category: string;
  url?: string | null;
  publishedAt: string;
}

export interface CommunityPerformance {
  windowDays: number;
  score: number;
  status: "alto" | "estable" | "en_riesgo";
  totals: {
    members: number;
    activeMembers: number;
    messages: number;
    recentMessages: number;
    resources: number;
    challenges: number;
  };
  rates: {
    participation: number;
    messages: number;
    resources: number;
    challenges: number;
  };
  thresholds: {
    activeParticipationTargetPercent: number;
    lowParticipationThreshold: number;
  };
  topContributors: Array<{
    id: string;
    name: string;
    messages: number;
    avatar?: string | null;
  }>;
  recommendedActions: string[];
}

export interface CommunityHub {
  settings: CommunitySettings;
  contents: {
    descanso: WellbeingItem[];
    orientacion: WellbeingItem[];
    bienestar: WellbeingItem[];
  };
  news: UniversityNewsItem[];
  summary: {
    communitiesCount: number;
    restSessionMinutes: number;
    participationTarget: number;
  };
}

export const communityService = {
  async create(data: {
    nombre: string;
    descripcion?: string;
    materia?: string;
    icono_url?: string;
    es_publica?: boolean;
  }) {
    const response = await api.post("/community/create", data);
    return response.data.community as Community;
  },

  async getMyCommunities() {
    const response = await api.get("/community/my-communities");
    return response.data.communities as Community[];
  },

  async explore(search?: string, materia?: string) {
    const response = await api.get("/community/explore", { params: { search, materia } });
    return response.data.communities as Community[];
  },

  async getDetail(id: string) {
    const response = await api.get(`/community/${id}`);
    return response.data.community as Community;
  },

  async join(id: string) {
    const response = await api.post(`/community/${id}/join`);
    return response.data;
  },

  async leave(id: string) {
    const response = await api.post(`/community/${id}/leave`);
    return response.data;
  },

  async delete(id: string) {
    const response = await api.delete(`/community/${id}`);
    return response.data;
  },

  async getMessages(id: string) {
    const response = await api.get(`/community/${id}/messages`);
    return response.data.messages as CommunityMessage[];
  },

  async sendMessage(id: string, contenido: string) {
    const response = await api.post(`/community/${id}/messages`, { contenido });
    return response.data.message as CommunityMessage;
  },

  async uploadResource(id: string, file: File, descripcion?: string) {
    const formData = new FormData();
    formData.append("file", file);
    if (descripcion) formData.append("descripcion", descripcion);

    const response = await api.post(`/community/${id}/resources`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },

  async getResources(id: string) {
    const response = await api.get(`/community/${id}/resources`);
    return response.data.resources;
  },

  async getHub() {
    const response = await api.get("/community/hub");
    return response.data as CommunityHub;
  },

  async getNews(params?: { university?: string; category?: string; search?: string }) {
    const response = await api.get("/community/news", { params });
    return response.data.news as UniversityNewsItem[];
  },

  async getSettings() {
    const response = await api.get("/community/settings");
    return response.data.settings as CommunitySettings;
  },

  async updateSettings(settings: Partial<CommunitySettings>) {
    const response = await api.put("/community/settings", settings);
    return response.data.settings as CommunitySettings;
  },

  async getPerformance(id: string) {
    const response = await api.get(`/community/${id}/performance`);
    return response.data.performance as CommunityPerformance;
  },
};
