import { isAxiosError } from "axios";
import { api } from "../../../services/api";

export interface CommunityInvitation {
  id_invitacion: number;
  expires_at: string;
  comunidad: { id_comunidad: number; nombre: string; materia: string | null };
}
export interface PublicStudent {
  id: string;
  identificador_unico: string;
  nombres: string;
  apellidos: string;
  rol: string;
}
export const invitationError = (error: unknown) => {
  if (isAxiosError<{ message?: string }>(error)) return error.response?.data.message || "No se pudo completar la operación. Intenta nuevamente.";
  return "No se pudo completar la operación. Intenta nuevamente.";
};
export const invitationsService = {
  async list(signal?: AbortSignal) {
    const response = await api.get<{ invitations: CommunityInvitation[] }>("/community/invitations", { signal });
    return response.data.invitations;
  },
  async respond(id: number, action: "accept" | "reject") {
    await api.post(`/community/invitations/${id}/${action}`);
  },
  async search(query: string, signal?: AbortSignal) {
    const response = await api.get<{ users: PublicStudent[] }>("/community/users/search", { params: { query }, signal });
    return response.data.users.filter(user => user.rol === "estudiante");
  },
  async send(communityId: string, studentId: string) {
    await api.post(`/community/${communityId}/invite`, { estudiante_id: studentId });
  },
};
