// src/features/forums/services/forumsService.ts
import { api } from "../../../services/api";

// --- INTERFACES ---
export interface ForumPost {
  authorId?: string;
  isResolved?: boolean;
  removed?: boolean;
  version?: number;
  createdAtISO?: string;
  id: string;
  title: string;
  question: string;
  image?: string;
  author: string;
  authorAvatar?: string;
  authorRole: "docente" | "estudiante";
  groupName: string;
  likes: number;
  comments: number;
  isLiked: boolean;
  createdAt: string;
  tags: string[];
}

export interface ForumComment {
  authorId?: string;
  removed?: boolean;
  id: string;
  author: string;
  authorAvatar?: string;
  authorRole: "docente" | "estudiante";
  content: string;
  likes: number;
  isLiked: boolean;
  createdAt: string;
}

export interface ForumDetail extends Omit<ForumPost, 'comments'> {
  comments: ForumComment[];
  canModerate?: boolean;
  canEdit?: boolean;
  nextCommentsCursor?: string | null;
}

export interface CreateForumData {
  title: string;
  question: string;
  groupId: string;
  tags?: string[];
  image?: File;
}

export async function getForumPage(params: { mine?: boolean; moderation?: boolean; groupId?: string; before?: string; search?: string } = {}) {
  return (await api.get<{ forums: ForumPost[]; nextCursor: string | null }>("/community/forums", { params })).data;
}
export const getForums = async () => (await getForumPage()).forums;
export const getMyForums = async () => (await getForumPage({ mine: true })).forums;
export const getForumDetail = async (id: string, after?: string): Promise<ForumDetail> => (await api.get('/community/forums/' + id, { params: { after } })).data;
export const createForum = async (data: CreateForumData): Promise<ForumPost> => (await api.post('/community/forums', { title: data.title, question: data.question, groupId: data.groupId || null, tags: data.tags || [] })).data;
export const likeForum = async (id: string, liked = true) => { await api.put('/community/forums/' + id + '/like', { liked }); };
export const reportForum = async (id: string, reason: string) => { await api.post('/community/forums/' + id + '/report', { reason }); };
export const commentForum = async (id: string, content: string, clientId: string) => { await api.post('/community/forums/' + id + '/comments', { content, clientId }); };
export const removeComment = async (id: string, commentId: string, reason: string) => { await api.delete('/community/forums/' + id + '/comments/' + commentId, { data: { reason } }); };
export const updateForum = async (id: string, input: { action: string; version: number; reason: string; title?: string; question?: string }) => { await api.patch('/community/forums/' + id, input); };
export interface ForumReport { id: number; reason: string; status: string; resolution: string | null; }
export const forumReports = async (id: string): Promise<ForumReport[]> => (await api.get('/community/forums/' + id + '/reports')).data.reports;
export const resolveForumReport = async (id: string, reportId: number, resolution: string) => { await api.post('/community/forums/' + id + '/reports/' + reportId + '/resolve', { resolution }); };
