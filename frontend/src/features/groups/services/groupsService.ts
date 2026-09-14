import {
  communityService,
  type Community,
  type CommunityPerformance,
} from "../../community/services/communityService";

export interface Group {
  id: string;
  name: string;
  subject: string;
  membersCount: number;
  avatar?: string;
  status?: string;
  lastActivity?: string;
}

export interface GroupMessage {
  id: string;
  author: string;
  authorRole: "docente" | "estudiante";
  content: string;
  timestamp: string;
  avatar?: string;
}

export interface GroupParticipant {
  id: string;
  name: string;
  role: "docente" | "estudiante";
  avatar?: string;
  email: string;
  joinedAt: string;
}

export interface ForumThread {
  id: string;
  title: string;
  author: string;
  authorAvatar?: string;
  replies: number;
  lastReply: string;
  isResolved: boolean;
}

export interface GroupAnalytics {
  totalMessages: number;
  activeMembers: number;
  avgResponseTime: string;
  participationRate: number;
  topContributors: Array<{
    name: string;
    messages: number;
    avatar?: string;
  }>;
  performance?: CommunityPerformance | null;
}

export interface GroupDetail extends Group {
  description: string;
  createdAt: string;
  messages: GroupMessage[];
  participants: GroupParticipant[];
  forums: ForumThread[];
  analytics: GroupAnalytics;
}

const formatDate = (date?: string | null) => {
  if (!date) return "";
  return new Intl.DateTimeFormat("es-PE", { day: "2-digit", month: "short", year: "numeric" }).format(
    new Date(date)
  );
};

const fallbackAvatar = (seed: string) =>
  `https://api.dicebear.com/7.x/shapes/svg?seed=${encodeURIComponent(seed)}`;

const mapCommunityToGroup = (community: Community): Group => ({
  id: String(community.id),
  name: community.nombre,
  subject: community.materia || "General",
  membersCount: community.miembros_count ?? 0,
  avatar: community.icono_url || fallbackAvatar(community.nombre),
  status: community.is_member === false ? "Publica" : "Activo",
  lastActivity: community.fecha_creacion ? `Creada ${formatDate(community.fecha_creacion)}` : undefined,
});

const mapCommunityToDetail = (community: Community): GroupDetail => ({
  ...mapCommunityToGroup(community),
  description: community.descripcion || "Comunidad de aprendizaje colaborativo.",
  createdAt: formatDate(community.fecha_creacion),
  messages: (community.messages || []).map((message) => ({
    id: String(message.id),
    author: message.author,
    authorRole: message.authorRole,
    content: message.content,
    timestamp: formatDate(message.timestamp) || message.timestamp,
    avatar: message.avatar || undefined,
  })),
  participants: (community.participants || []).map((participant) => ({
    id: String(participant.id),
    name: participant.name,
    role: participant.role,
    avatar: participant.avatar || undefined,
    email: participant.email,
    joinedAt: formatDate(participant.joinedAt),
  })),
  forums: (community.forums || []).map((forum) => ({
    id: String(forum.id),
    title: forum.title,
    author: forum.author,
    authorAvatar: forum.authorAvatar || undefined,
    replies: forum.replies,
    lastReply: forum.lastReply,
    isResolved: forum.isResolved,
  })),
  analytics: community.analytics
    ? {
        ...community.analytics,
        topContributors: community.analytics.topContributors.map((contributor) => ({
          ...contributor,
          avatar: contributor.avatar || undefined,
        })),
      }
    : {
    totalMessages: community.messages?.length || 0,
    activeMembers: community.miembros_count || 0,
    avgResponseTime: "Sin datos",
    participationRate: 0,
    topContributors: [],
  },
});

export const getTeacherGroups = async (): Promise<Group[]> => {
  const communities = await communityService.getMyCommunities();
  return communities.map(mapCommunityToGroup);
};

export const getStudentGroups = async (): Promise<Group[]> => {
  const communities = await communityService.getMyCommunities();
  return communities.map(mapCommunityToGroup);
};

export const getGroupDetail = async (id: string): Promise<GroupDetail> => {
  const community = await communityService.getDetail(id);
  return mapCommunityToDetail(community);
};

export const createGroup = async (data: {
  name: string;
  description?: string;
  subject?: string;
  isPublic?: boolean;
}): Promise<Group> => {
  const community = await communityService.create({
    nombre: data.name,
    descripcion: data.description,
    materia: data.subject,
    es_publica: data.isPublic,
  });
  return mapCommunityToGroup(community);
};

export const deleteGroup = (id: string) => communityService.delete(id);
export const leaveGroup = (id: string) => communityService.leave(id);
export const sendGroupMessage = (id: string, content: string) => communityService.sendMessage(id, content);
