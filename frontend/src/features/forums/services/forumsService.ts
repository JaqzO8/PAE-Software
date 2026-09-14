// src/features/forums/services/forumsService.ts
import { api } from "../../../services/api";

// --- INTERFACES ---
export interface ForumPost {
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
}

export interface CreateForumData {
  title: string;
  question: string;
  groupId: string;
  tags?: string[];
  image?: File;
}

// --- MOCK DATA ---
const MOCK_FORUMS: ForumPost[] = [
  {
    id: "forum-1",
    title: "¿Cómo resolver integrales por partes?",
    question: "Tengo problemas para entender cuándo usar integración por partes. ¿Alguien puede explicar el criterio LIATE?",
    image: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=400&h=250&fit=crop",
    author: "María García",
    authorAvatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=maria2",
    authorRole: "estudiante",
    groupName: "Cálculo Diferencial 2025-I",
    likes: 24,
    comments: 8,
    isLiked: false,
    createdAt: "Hace 2 horas",
    tags: ["Matemáticas", "Cálculo"],
  },
  {
    id: "forum-2",
    title: "Recomendaciones de libros sobre la Guerra Fría",
    question: "Estoy preparando mi tesis sobre el conflicto ideológico del siglo XX. ¿Qué bibliografía me recomiendan?",
    image: "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=400&h=250&fit=crop",
    author: "Carlos Ramírez",
    authorAvatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=carlos3",
    authorRole: "estudiante",
    groupName: "Historia Universal - Grupo A",
    likes: 15,
    comments: 12,
    isLiked: true,
    createdAt: "Hace 5 horas",
    tags: ["Historia", "Investigación"],
  },
  {
    id: "forum-3",
    title: "Explicación sobre enlaces covalentes",
    question: "¿Por qué algunos enlaces covalentes son polares y otros no? Necesito ejemplos prácticos para entenderlo mejor.",
    image: "https://images.unsplash.com/photo-1603126857599-f6e157fa2fe6?w=400&h=250&fit=crop",
    author: "Prof. Ana Torres",
    authorAvatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=ana2",
    authorRole: "docente",
    groupName: "Química Orgánica",
    likes: 42,
    comments: 18,
    isLiked: true,
    createdAt: "Hace 1 día",
    tags: ["Química", "Fundamentos"],
  },
  {
    id: "forum-4",
    title: "Ayuda con proyecto de React",
    question: "Estoy construyendo mi primer SPA y tengo dudas sobre el manejo de estado con Context API vs Redux.",
    image: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=400&h=250&fit=crop",
    author: "Luis Hernández",
    authorAvatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=luis2",
    authorRole: "estudiante",
    groupName: "Desarrollo Web Moderno",
    likes: 31,
    comments: 9,
    isLiked: false,
    createdAt: "Hace 3 horas",
    tags: ["Programación", "React"],
  },
];

const MOCK_FORUM_DETAIL: ForumDetail = {
  ...MOCK_FORUMS[0],
  comments: [
    {
      id: "c1",
      author: "Prof. Carlos Mendoza",
      authorAvatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=carlos",
      authorRole: "docente",
      content: "Excelente pregunta. LIATE es un acrónimo que te ayuda a elegir qué función debe ser 'u' en integración por partes: Logarítmicas, Inversas trigonométricas, Algebraicas, Trigonométricas, Exponenciales.",
      likes: 12,
      isLiked: true,
      createdAt: "Hace 1 hora",
    },
    {
      id: "c2",
      author: "Pedro Sánchez",
      authorAvatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=pedro",
      authorRole: "estudiante",
      content: "Yo también tenía esa duda. El video de Khan Academy sobre esto me ayudó mucho.",
      likes: 5,
      isLiked: false,
      createdAt: "Hace 30 min",
    },
  ],
};

// --- SERVICIOS MOCK ---
const getForumsMock = async (): Promise<ForumPost[]> => {
  return new Promise((resolve) => setTimeout(() => resolve(MOCK_FORUMS), 800));
};

const getMyForumsMock = async (): Promise<ForumPost[]> => {
  // Simulamos que el usuario actual tiene algunos foros
  const myForums = MOCK_FORUMS.filter(f => f.authorRole === "docente");
  return new Promise((resolve) => setTimeout(() => resolve(myForums), 800));
};

const getForumDetailMock = async (_id: string): Promise<ForumDetail> => {
  return new Promise((resolve) => setTimeout(() => resolve(MOCK_FORUM_DETAIL), 600));
};

const createForumMock = async (data: CreateForumData): Promise<ForumPost> => {
  const newForum: ForumPost = {
    id: `forum-${Date.now()}`,
    title: data.title,
    question: data.question,
    author: "Usuario Actual",
    authorRole: "docente",
    groupName: "Mi Grupo",
    likes: 0,
    comments: 0,
    isLiked: false,
    createdAt: "Hace unos segundos",
    tags: data.tags || [],
  };
  return new Promise((resolve) => setTimeout(() => resolve(newForum), 1000));
};

const likeForumMock = async (_forumId: string): Promise<void> => {
  return new Promise((resolve) => setTimeout(() => resolve(), 300));
};

const reportForumMock = async (_forumId: string, _reason: string): Promise<void> => {
  return new Promise((resolve) => setTimeout(() => resolve(), 500));
};

// --- SERVICIOS API ---
const getForumsApi = async (): Promise<ForumPost[]> => {
  const response = await api.get("/forums");
  return response.data;
};

const getMyForumsApi = async (): Promise<ForumPost[]> => {
  const response = await api.get("/forums/mine");
  return response.data;
};

const getForumDetailApi = async (id: string): Promise<ForumDetail> => {
  const response = await api.get(`/forums/${id}`);
  return response.data;
};

const createForumApi = async (data: CreateForumData): Promise<ForumPost> => {
  const formData = new FormData();
  formData.append("title", data.title);
  formData.append("question", data.question);
  formData.append("groupId", data.groupId);
  if (data.image) formData.append("image", data.image);
  if (data.tags) formData.append("tags", JSON.stringify(data.tags));

  const response = await api.post("/forums", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
};

const likeForumApi = async (forumId: string): Promise<void> => {
  await api.post(`/forums/${forumId}/like`);
};

const reportForumApi = async (forumId: string, reason: string): Promise<void> => {
  await api.post(`/forums/${forumId}/report`, { reason });
};

// --- EXPORTACIONES CON FALLBACK ---
export const getForums = async (): Promise<ForumPost[]> => {
  if (import.meta.env.VITE_USE_MOCKS === "true") {
    console.log("🔶 Modo Mock: Forums");
    return getForumsMock();
  }

  try {
    return await getForumsApi();
  } catch (error) {
    console.warn("🔴 API Error (Forums), using mock.", error);
    return getForumsMock();
  }
};

export const getMyForums = async (): Promise<ForumPost[]> => {
  if (import.meta.env.VITE_USE_MOCKS === "true") {
    console.log("🔶 Modo Mock: My Forums");
    return getMyForumsMock();
  }

  try {
    return await getMyForumsApi();
  } catch (error) {
    console.warn("🔴 API Error (My Forums), using mock.", error);
    return getMyForumsMock();
  }
};

export const getForumDetail = async (id: string): Promise<ForumDetail> => {
  if (import.meta.env.VITE_USE_MOCKS === "true") {
    console.log("🔶 Modo Mock: Forum Detail");
    return getForumDetailMock(id);
  }

  try {
    return await getForumDetailApi(id);
  } catch (error) {
    console.warn("🔴 API Error (Forum Detail), using mock.", error);
    return getForumDetailMock(id);
  }
};

export const createForum = async (data: CreateForumData): Promise<ForumPost> => {
  if (import.meta.env.VITE_USE_MOCKS === "true") {
    return createForumMock(data);
  }

  try {
    return await createForumApi(data);
  } catch (error) {
    console.warn("🔴 API Error (Create Forum), using mock.", error);
    return createForumMock(data);
  }
};

export const likeForum = async (forumId: string): Promise<void> => {
  if (import.meta.env.VITE_USE_MOCKS === "true") {
    return likeForumMock(forumId);
  }

  try {
    return await likeForumApi(forumId);
  } catch (error) {
    console.warn("🔴 API Error (Like Forum), using mock.", error);
    return likeForumMock(forumId);
  }
};

export const reportForum = async (forumId: string, reason: string): Promise<void> => {
  if (import.meta.env.VITE_USE_MOCKS === "true") {
    return reportForumMock(forumId, reason);
  }

  try {
    return await reportForumApi(forumId, reason);
  } catch (error) {
    console.warn("🔴 API Error (Report Forum), using mock.", error);
    return reportForumMock(forumId, reason);
  }
};
