import { api } from "../../../services/api";
import type { Repository } from "../../repository/services/repositoryService";

const MOCK_GROUP_RESOURCES: Repository[] = [
  {
    id: "res-1",
    title: "Guia de Estudio: Algebra Vectorial",
    author: "Prof. Carlos (Grupo A)",
    authorId: "mock-teacher-1",
    role: "docente",
    views: 450,
    downloads: 120,
    rating: 4.8,
    tags: ["Algebra", "Guia"],
    isFavorite: false,
    isPublic: true,
    createdAt: "15/03/2024",
    updatedAt: "15/03/2024",
  },
  {
    id: "res-2",
    title: "Solucionario: Examen Parcial 1",
    author: "Dra. Ana (Historia)",
    authorId: "mock-teacher-2",
    role: "docente",
    views: 890,
    downloads: 560,
    rating: 4.9,
    tags: ["Historia", "Examen"],
    isFavorite: true,
    isPublic: true,
    createdAt: "12/03/2024",
    updatedAt: "12/03/2024",
  },
];

export const getGroupResources = async (): Promise<Repository[]> => {
  if (import.meta.env.VITE_USE_MOCKS === "true") {
    return new Promise((resolve) => setTimeout(() => resolve(MOCK_GROUP_RESOURCES), 800));
  }

  try {
    const response = await api.get("/community/resources/all");
    return response.data;
  } catch (error) {
    console.warn("API Error (Group Resources), using mock.", error);
    return MOCK_GROUP_RESOURCES;
  }
};
