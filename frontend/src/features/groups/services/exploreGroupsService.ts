import { communityService } from "../../community/services/communityService";
import type { Group } from "./groupsService";

export interface JoinRequest {
  groupId: string;
  message?: string;
}

export interface JoinResponse {
  status: "approved";
  message: string;
}

const fallbackAvatar = (seed: string) =>
  `https://api.dicebear.com/7.x/shapes/svg?seed=${encodeURIComponent(seed)}`;

export const getPublicGroups = async (): Promise<Group[]> => {
  const communities = await communityService.explore();
  return communities.map((community) => ({
    id: String(community.id),
    name: community.nombre,
    subject: community.materia || "General",
    membersCount: community.miembros_count ?? 0,
    avatar: community.icono_url || fallbackAvatar(community.nombre),
    status: "Publica",
  }));
};

export const joinGroup = async (request: JoinRequest): Promise<JoinResponse> => {
  const response = await communityService.join(request.groupId);
  return {
    status: "approved",
    message: response.message || "Te has unido a la comunidad.",
  };
};
