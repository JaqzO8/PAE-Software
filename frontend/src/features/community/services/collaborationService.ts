import { api } from '../../../services/api';
import type { PublicStudent } from './invitationsService';

export interface ChatMessage {
  id: number; content: string; userId: number; author: string; avatar: string | null;
  authorRole: string; timestamp: string; editado: boolean; version: number; removed: boolean; clientId?: string;
}
export interface Friendship {
  id_amistad: number; estado: string; direction: 'incoming' | 'outgoing';
  peer: { id: number; nombres: string; apellidos: string };
}
export interface InvitationRecord {
  id_invitacion: number; estudiante_id: number; estado: string; expires_at: string; fecha_invitacion: string;
}
export const collaborationService = {
  async messages(id: string, before?: string, signal?: AbortSignal) {
    return (await api.get<{ messages: ChatMessage[]; nextCursor: string | null }>(`/community/${id}/messages`, { params: { before, limit: 50 }, signal })).data;
  },
  async send(id: string, content: string, clientId: string) {
    return (await api.post<{ message: ChatMessage }>(`/community/${id}/messages`, { contenido: content, client_id: clientId })).data.message;
  },
  async edit(id: string, message: ChatMessage, content: string) {
    await api.patch(`/community/${id}/messages/${message.id}`, { contenido: content, version: message.version });
  },
  async remove(id: string, message: ChatMessage, reason: string) {
    await api.delete(`/community/${id}/messages/${message.id}`, { data: { version: message.version, motivo: reason } });
  },
  async friends(before?: string, signal?: AbortSignal) {
    return (await api.get<{ friends: Friendship[]; requests: Friendship[]; nextCursor: string | null }>('/community/friends', { params: { before }, signal })).data;
  },
  async search(query: string, signal?: AbortSignal) {
    return (await api.get<{ users: PublicStudent[] }>('/community/users/search', { params: { query }, signal })).data.users;
  },
  async requestFriend(id: string) { await api.post('/community/friends/request', { usuario_receptor_id: id }); },
  async respondFriend(id: number, action: 'accept' | 'reject' | 'cancel' | 'remove' | 'block') { await api.post(`/community/friends/${id}/${action}`); },
  async invitations(id: string, before?: string, signal?: AbortSignal) {
    return (await api.get<{ invitations: InvitationRecord[]; nextCursor: string | null }>(`/community/${id}/invitations/history`, { params: { before }, signal })).data;
  },
  async revokeInvitation(id: string, invitationId: number) { await api.post(`/community/${id}/invitations/${invitationId}/revoke`); },
  async kick(id: string, userId: string, reason: string) { await api.post(`/community/${id}/kick/${userId}`, { motivo: reason }); },
};
