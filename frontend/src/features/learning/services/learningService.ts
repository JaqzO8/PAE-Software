// src/features/learning/services/learningService.ts
import { api } from "../../../services/api";
import {
  getOfflineAttempts,
  markOfflineAttemptTried,
  queueOfflineAttempt,
  removeOfflineAttempt,
} from "./offlineAttempts";

// ========== INTERFACES ==========
export interface University {
  id: string;
  name: string;
  logo?: string;
  questionCount: number;
}

export interface SimulacroConfig {
  universityId: string;
  difficulty: "facil" | "medio" | "dificil";
}

export interface SimulacroQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  subject: string;
  difficulty: "facil" | "medio" | "dificil";
  type?: "opcion_multiple" | "abierta";
}

export interface SimulacroResult {
  id: string;
  questions: SimulacroQuestion[];
  timeLimit: number; // en segundos
  config: SimulacroConfig;
}

export interface SimulacroSubmission {
  simulacroId: string;
  answers: Array<number | string>;
  timeSpent: number;
}

export interface SimulacroScore {
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  timeSpent: number;
  percentile: number;
  requiresManualReview?: boolean;
  offlinePending?: boolean;
  offlineAttemptId?: string;
  newAchievements?: LearningAchievement[];
  gamification?: GamificationSummary;
  solutions: Array<{
    question: SimulacroQuestion;
    userAnswer: number | string;
    isCorrect: boolean;
    requiresManualReview?: boolean;
  }>;
}

export interface LearningAchievement {
  id: string;
  code: string;
  title: string;
  description: string;
  icon: string;
  points: number;
  earnedAt: string;
  metadata?: Record<string, unknown>;
}

export interface LearningNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  emailPending: boolean;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface GamificationSettings {
  attemptCompletedPoints: number;
  highAccuracyBonusPoints: number;
  highAccuracyThreshold: number;
  livePointsRatio: number;
  onboardingStepPoints: number;
  baseLevelPoints: number;
  levelPointsIncrement: number;
  leaderboardLimit: number;
  onboardingSteps: Array<{
    id: string;
    title: string;
    description: string;
    route: string;
  }>;
}

export interface GamificationSummary {
  profile: {
    userId: string;
    displayName: string;
    role: string;
    totalPoints: number;
    level: number;
    streakDays: number;
    lastActivity?: string | null;
    levelProgress: {
      level: number;
      currentLevelStart: number;
      nextLevelAt: number;
      progressPercent: number;
    };
  };
  achievements: LearningAchievement[];
  onboarding: Array<{
    id: string;
    title: string;
    description: string;
    route: string;
    completed: boolean;
    points: number;
  }>;
  recentEvents: Array<{
    id: string;
    type: string;
    points: number;
    description: string;
    metadata?: Record<string, unknown>;
    createdAt: string;
  }>;
  newEventsCount?: number;
}

export interface GamificationLeaderboardItem {
  rank: number;
  userId: string;
  displayName: string;
  role: string;
  totalPoints: number;
  level: number;
  lastActivity?: string | null;
}

export interface ChallengeRoom {
  id: string;
  host: string;
  hostAvatar?: string;
  topic: string;
  difficulty: "facil" | "medio" | "dificil";
  currentPlayers: number;
  maxPlayers: number;
  status: "waiting" | "playing" | "finished";
  createdAt: string;
  participants?: Array<{ id: string; name: string; joinedAt: string }>;
}

export interface CreateRoomData {
  topic: string;
  difficulty: "facil" | "medio" | "dificil";
  maxPlayers: number;
}

export interface LiveChallengeQuestion {
  id: string;
  question: string;
  options: string[];
  subject: string;
  difficulty: "facil" | "medio" | "dificil";
}

export interface LiveChallengeScore {
  id: string;
  name: string;
  score: number;
  correctAnswers: number;
  answered: number;
}

export interface LiveChallengeGame {
  id: string;
  room: ChallengeRoom;
  status: "waiting" | "playing" | "finished";
  currentQuestionIndex: number;
  totalQuestions: number;
  timePerQuestion: number;
  questionStartedAt?: string;
  currentQuestion: LiveChallengeQuestion | null;
  scoreboard: LiveChallengeScore[];
  answersCount: number;
  expectedAnswers: number;
  lastAnswer?: {
    questionId: string;
    userId: string;
    userName: string;
    answer: number;
    correct: boolean;
    points: number;
    responseMs: number;
    answeredAt: string;
  };
  gamification?: {
    pointsAwarded: number;
    totalPoints: number;
    level: number;
  } | null;
}

export interface TriviaQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  category: string;
  points: number;
}

export interface TriviaRoom {
  id: string;
  host: string;
  hostAvatar?: string;
  topic: string;
  questionsCount: number;
  currentPlayers: number;
  maxPlayers: number;
  status: "waiting" | "playing" | "finished";
  createdAt: string;
  participants?: Array<{ id: string; name: string; joinedAt: string }>;
}

export interface CreateTriviaRoomData {
  topic: string;
  questionsCount: number;
  maxPlayers: number;
}

export interface LiveTriviaGame {
  id: string;
  room: TriviaRoom;
  status: "waiting" | "playing" | "finished";
  currentQuestionIndex: number;
  totalQuestions: number;
  timePerQuestion: number;
  questionStartedAt?: string;
  currentQuestion: LiveChallengeQuestion | null;
  scoreboard: LiveChallengeScore[];
  answersCount: number;
  expectedAnswers: number;
  lastAnswer?: {
    questionId: string;
    userId: string;
    userName: string;
    answer: number;
    correct: boolean;
    points: number;
    responseMs: number;
    answeredAt: string;
  };
  gamification?: {
    pointsAwarded: number;
    totalPoints: number;
    level: number;
  } | null;
}

export interface BankQuestion {
  id_pregunta?: number;
  materia: string;
  tema?: string;
  dificultad: "facil" | "medio" | "dificil";
  tipo: "opcion_multiple" | "abierta";
  enunciado: string;
  opciones: string[];
  respuesta_correcta?: number;
  respuesta_texto?: string;
  explicacion?: string;
  etiquetas?: string[];
  universidad?: { slug: string; nombre: string };
}

export interface SavedQuestionItem {
  id_guardado: number;
  id_pregunta: number;
  created_at: string;
  pregunta: BankQuestion;
}

export interface CreateQuestionData {
  universityId?: string;
  materia: string;
  tema?: string;
  dificultad: "facil" | "medio" | "dificil";
  tipo: "opcion_multiple" | "abierta";
  enunciado: string;
  opciones: string[];
  respuesta_correcta?: number;
  respuesta_texto?: string;
  explicacion?: string;
  etiquetas?: string[];
}

export interface OpenAnswerReview {
  id_revision: number;
  id_intento: number;
  id_pregunta: number;
  id_estudiante: number;
  id_docente?: number;
  respuesta_texto: string;
  puntaje?: number;
  feedback?: string;
  estado: "pendiente" | "revisado";
  fecha_revision?: string;
  created_at: string;
  intento?: {
    id_intento: number;
    dificultad: string;
    puntaje?: number;
    correctas?: number;
    total_preguntas?: number;
    fecha_fin?: string;
    universidad?: string;
  };
  pregunta?: {
    id_pregunta: number;
    materia: string;
    tema?: string;
    dificultad: string;
    enunciado: string;
    respuesta_texto?: string;
    explicacion?: string;
  };
}

// ========== MOCK DATA ==========
const MOCK_UNIVERSITIES: University[] = [
  { id: "unmsm", name: "Universidad Nacional Mayor de San Marcos (UNMSM)", questionCount: 100 },
  { id: "uni", name: "Universidad Nacional de Ingeniería (UNI)", questionCount: 100 },
  { id: "pucp", name: "Pontificia Universidad Católica del Perú (PUCP)", questionCount: 80 },
  { id: "unfv", name: "Universidad Nacional Federico Villarreal (UNFV)", questionCount: 80 },
  { id: "unac", name: "Universidad Nacional del Callao (UNAC)", questionCount: 80 },
  { id: "upn", name: "Universidad Privada del Norte (UPN)", questionCount: 60 },
];

const MOCK_QUESTIONS: SimulacroQuestion[] = [
  {
    id: "q1",
    question: "Si f(x) = 3x² + 2x - 5, ¿cuál es el valor de f(2)?",
    options: ["7", "11", "15", "19"],
    correctAnswer: 1,
    explanation: "Reemplazamos x = 2 en la función: f(2) = 3(2)² + 2(2) - 5 = 3(4) + 4 - 5 = 12 + 4 - 5 = 11. Por lo tanto, la respuesta correcta es 11.",
    subject: "Matemáticas",
    difficulty: "medio",
  },
  {
    id: "q2",
    question: "¿Cuál es la capital de Perú?",
    options: ["Arequipa", "Lima", "Cusco", "Trujillo"],
    correctAnswer: 1,
    explanation: "Lima es la capital y ciudad más poblada del Perú, ubicada en la costa central del país.",
    subject: "Historia",
    difficulty: "facil",
  },
  {
    id: "q3",
    question: "La fórmula química del agua es:",
    options: ["H2O2", "H2O", "H3O", "HO2"],
    correctAnswer: 1,
    explanation: "El agua está compuesta por dos átomos de hidrógeno (H) y uno de oxígeno (O), por lo tanto su fórmula es H2O.",
    subject: "Química",
    difficulty: "facil",
  },
  {
    id: "q4",
    question: "¿Quién escribió 'Cien años de soledad'?",
    options: ["Mario Vargas Llosa", "Gabriel García Márquez", "Pablo Neruda", "Jorge Luis Borges"],
    correctAnswer: 1,
    explanation: "Gabriel García Márquez, escritor colombiano y Premio Nobel de Literatura 1982, es el autor de 'Cien años de soledad', publicada en 1967.",
    subject: "Literatura",
    difficulty: "medio",
  },
  {
    id: "q5",
    question: "El resultado de √144 es:",
    options: ["10", "11", "12", "13"],
    correctAnswer: 2,
    explanation: "La raíz cuadrada de 144 es 12, ya que 12 × 12 = 144.",
    subject: "Matemáticas",
    difficulty: "facil",
  },
];

const MOCK_CHALLENGE_ROOMS: ChallengeRoom[] = [
  {
    id: "room1",
    host: "María García",
    hostAvatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=maria",
    topic: "Matemáticas - Álgebra",
    difficulty: "medio",
    currentPlayers: 2,
    maxPlayers: 4,
    status: "waiting",
    createdAt: "Hace 5 min",
  },
  {
    id: "room2",
    host: "Carlos Pérez",
    hostAvatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=carlos",
    topic: "Historia Universal",
    difficulty: "dificil",
    currentPlayers: 3,
    maxPlayers: 4,
    status: "playing",
    createdAt: "Hace 10 min",
  },
];

const MOCK_TRIVIA: TriviaQuestion[] = [
  {
    id: "t1",
    question: "¿En qué año se descubrió América?",
    options: ["1490", "1492", "1494", "1500"],
    correctAnswer: 1,
    category: "Historia",
    points: 10,
  },
  {
    id: "t2",
    question: "¿Cuál es el resultado de 15 × 8?",
    options: ["110", "120", "130", "140"],
    correctAnswer: 1,
    category: "Matemáticas",
    points: 15,
  },
  {
    id: "t3",
    question: "¿Qué gas es esencial para la respiración humana?",
    options: ["Nitrógeno", "Oxígeno", "Dióxido de carbono", "Helio"],
    correctAnswer: 1,
    category: "Ciencias",
    points: 10,
  },
  {
    id: "t4",
    question: "¿Quién escribió 'Cien años de soledad'?",
    options: ["Mario Vargas Llosa", "Gabriel García Márquez", "Pablo Neruda", "Jorge Luis Borges"],
    correctAnswer: 1,
    category: "Literatura",
    points: 15,
  },
  {
    id: "t5",
    question: "¿Cuál es el río más largo del mundo?",
    options: ["Nilo", "Amazonas", "Yangtsé", "Misisipi"],
    correctAnswer: 1,
    category: "Geografía",
    points: 10,
  },
];

const MOCK_TRIVIA_ROOMS: TriviaRoom[] = [
  {
    id: "trivia1",
    host: "Ana López",
    hostAvatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=ana",
    topic: "Historia del Perú",
    questionsCount: 10,
    currentPlayers: 2,
    maxPlayers: 4,
    status: "waiting",
    createdAt: "Hace 3 min",
  },
  {
    id: "trivia2",
    host: "Pedro Sánchez",
    hostAvatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=pedro",
    topic: "Cultura General",
    questionsCount: 5,
    currentPlayers: 4,
    maxPlayers: 4,
    status: "playing",
    createdAt: "Hace 7 min",
  },
];

// ========== SERVICIOS MOCK ==========
const getUniversitiesMock = async (): Promise<University[]> => {
  return new Promise((resolve) => setTimeout(() => resolve(MOCK_UNIVERSITIES), 800));
};

const startSimulacroMock = async (config: SimulacroConfig): Promise<SimulacroResult> => {
  const timeLimit = config.difficulty === "facil" ? 9000 : config.difficulty === "medio" ? 7200 : 5760;
  
  // Generar más preguntas para el simulacro (20 total)
  const extendedQuestions = [
    ...MOCK_QUESTIONS,
    ...MOCK_QUESTIONS.map((q, i) => ({
      ...q,
      id: `q${i + 6}`,
      question: `${q.question} (Variante ${i + 1})`,
    })),
  ].slice(0, 20);
  
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        id: `sim-${Date.now()}`,
        questions: extendedQuestions,
        timeLimit,
        config,
      });
    }, 1500);
  });
};

const submitSimulacroMock = async (submission: SimulacroSubmission): Promise<SimulacroScore> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      // Obtener las preguntas del simulacro (en producción vendrían del servidor)
      const extendedQuestions = [
        ...MOCK_QUESTIONS,
        ...MOCK_QUESTIONS.map((q, i) => ({
          ...q,
          id: `q${i + 6}`,
          question: `${q.question} (Variante ${i + 1})`,
        })),
      ].slice(0, submission.answers.length);

      const correctAnswers = submission.answers.filter((answer, index) => {
        return answer === extendedQuestions[index]?.correctAnswer;
      }).length;

      const solutions = extendedQuestions.map((q, index) => ({
        question: q,
        userAnswer: submission.answers[index],
        isCorrect: submission.answers[index] === q.correctAnswer,
      }));

      resolve({
        score: correctAnswers * 5,
        totalQuestions: submission.answers.length,
        correctAnswers,
        timeSpent: submission.timeSpent,
        percentile: Math.min(Math.floor((correctAnswers / submission.answers.length) * 100) + Math.floor(Math.random() * 10), 99),
        solutions,
      });
    }, 1000);
  });
};

const getChallengeRoomsMock = async (): Promise<ChallengeRoom[]> => {
  return new Promise((resolve) => setTimeout(() => resolve(MOCK_CHALLENGE_ROOMS), 600));
};

const createChallengeRoomMock = async (data: CreateRoomData): Promise<ChallengeRoom> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        id: `room-${Date.now()}`,
        host: "Tú",
        topic: data.topic,
        difficulty: data.difficulty,
        currentPlayers: 1,
        maxPlayers: data.maxPlayers,
        status: "waiting",
        createdAt: "Ahora",
      });
    }, 1000);
  });
};

const getDailyTriviaMock = async (): Promise<TriviaQuestion[]> => {
  return new Promise((resolve) => setTimeout(() => resolve(MOCK_TRIVIA), 600));
};

const getTriviaRoomsMock = async (): Promise<TriviaRoom[]> => {
  return new Promise((resolve) => setTimeout(() => resolve(MOCK_TRIVIA_ROOMS), 600));
};

const createTriviaRoomMock = async (data: CreateTriviaRoomData): Promise<TriviaRoom> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        id: `trivia-${Date.now()}`,
        host: "Tú",
        topic: data.topic,
        questionsCount: data.questionsCount,
        currentPlayers: 1,
        maxPlayers: data.maxPlayers,
        status: "waiting",
        createdAt: "Ahora",
      });
    }, 1000);
  });
};

// ========== SERVICIOS API ==========
const getUniversitiesApi = async (): Promise<University[]> => {
  const response = await api.get("/learning/universities");
  return response.data;
};

const startSimulacroApi = async (config: SimulacroConfig): Promise<SimulacroResult> => {
  const response = await api.post("/learning/simulacro/start", config);
  return response.data;
};

const submitSimulacroApi = async (submission: SimulacroSubmission): Promise<SimulacroScore> => {
  const response = await api.post("/learning/simulacro/submit", submission);
  return response.data;
};

const isOfflineSubmissionError = (error: any) => !navigator.onLine || !error?.response;

const getChallengeRoomsApi = async (): Promise<ChallengeRoom[]> => {
  const response = await api.get("/learning/challenges/rooms");
  return response.data;
};

const createChallengeRoomApi = async (data: CreateRoomData): Promise<ChallengeRoom> => {
  const response = await api.post("/learning/challenges/rooms", data);
  return response.data;
};

const joinChallengeRoomApi = async (roomId: string): Promise<ChallengeRoom> => {
  const response = await api.post(`/learning/challenges/rooms/${roomId}/join`);
  return response.data;
};

const leaveChallengeRoomApi = async (roomId: string): Promise<ChallengeRoom> => {
  const response = await api.post(`/learning/challenges/rooms/${roomId}/leave`);
  return response.data;
};

const getChallengeMatchApi = async (roomId: string): Promise<LiveChallengeGame> => {
  const response = await api.get(`/learning/challenges/rooms/${roomId}/match`);
  return response.data;
};

const startChallengeMatchApi = async (roomId: string): Promise<LiveChallengeGame> => {
  const response = await api.post(`/learning/challenges/rooms/${roomId}/match/start`);
  return response.data;
};

const answerChallengeQuestionApi = async (
  roomId: string,
  questionId: string,
  answer: number
): Promise<LiveChallengeGame> => {
  const response = await api.post(`/learning/challenges/rooms/${roomId}/match/answer`, { questionId, answer });
  return response.data;
};

const nextChallengeQuestionApi = async (roomId: string): Promise<LiveChallengeGame> => {
  const response = await api.post(`/learning/challenges/rooms/${roomId}/match/next`);
  return response.data;
};

const getDailyTriviaApi = async (): Promise<TriviaQuestion[]> => {
  const response = await api.get("/learning/trivia/daily");
  return response.data;
};

const getAchievementsApi = async (): Promise<LearningAchievement[]> => {
  const response = await api.get("/learning/achievements");
  return response.data.data;
};

const getLearningNotificationsApi = async (): Promise<LearningNotification[]> => {
  const response = await api.get("/learning/notifications");
  return response.data.data;
};

const markLearningNotificationReadApi = async (notificationId: string): Promise<void> => {
  await api.patch(`/learning/notifications/${notificationId}/read`);
};

const getGamificationSummaryApi = async (): Promise<GamificationSummary> => {
  const response = await api.get("/learning/gamification/summary");
  return response.data.data;
};

const getGamificationLeaderboardApi = async (limit?: number): Promise<GamificationLeaderboardItem[]> => {
  const response = await api.get("/learning/gamification/leaderboard", { params: { limit } });
  return response.data.data;
};

const completeOnboardingStepApi = async (stepId: string): Promise<GamificationSummary> => {
  const response = await api.post(`/learning/gamification/onboarding/${stepId}/complete`);
  return response.data.data;
};

const getGamificationSettingsApi = async (): Promise<GamificationSettings> => {
  const response = await api.get("/learning/gamification/settings");
  return response.data.data;
};

const updateGamificationSettingsApi = async (settings: Partial<GamificationSettings>): Promise<GamificationSettings> => {
  const response = await api.put("/learning/gamification/settings", settings);
  return response.data.data;
};

const getTriviaRoomsApi = async (): Promise<TriviaRoom[]> => {
  const response = await api.get("/learning/trivia/rooms");
  return response.data;
};

const createTriviaRoomApi = async (data: CreateTriviaRoomData): Promise<TriviaRoom> => {
  const response = await api.post("/learning/trivia/rooms", data);
  return response.data;
};

const joinTriviaRoomApi = async (roomId: string): Promise<TriviaRoom> => {
  const response = await api.post(`/learning/trivia/rooms/${roomId}/join`);
  return response.data;
};

const getTriviaMatchApi = async (roomId: string): Promise<LiveTriviaGame> => {
  const response = await api.get(`/learning/trivia/rooms/${roomId}/match`);
  return response.data;
};

const startTriviaMatchApi = async (roomId: string): Promise<LiveTriviaGame> => {
  const response = await api.post(`/learning/trivia/rooms/${roomId}/match/start`);
  return response.data;
};

const answerTriviaQuestionApi = async (
  roomId: string,
  questionId: string,
  answer: number
): Promise<LiveTriviaGame> => {
  const response = await api.post(`/learning/trivia/rooms/${roomId}/match/answer`, { questionId, answer });
  return response.data;
};

const nextTriviaQuestionApi = async (roomId: string): Promise<LiveTriviaGame> => {
  const response = await api.post(`/learning/trivia/rooms/${roomId}/match/next`);
  return response.data;
};

// ========== EXPORTACIONES CON FALLBACK ==========
export const getUniversities = async (): Promise<University[]> => {
  if (import.meta.env.VITE_USE_MOCKS === "true") {
    return getUniversitiesMock();
  }

  try {
    return await getUniversitiesApi();
  } catch (error) {
    console.warn("🔴 API Error (Universities), using mock.", error);
    return getUniversitiesMock();
  }
};

export const startSimulacro = async (config: SimulacroConfig): Promise<SimulacroResult> => {
  if (import.meta.env.VITE_USE_MOCKS === "true") {
    return startSimulacroMock(config);
  }

  try {
    return await startSimulacroApi(config);
  } catch (error) {
    console.warn("🔴 API Error (Start Simulacro), using mock.", error);
    return startSimulacroMock(config);
  }
};

export const submitSimulacro = async (submission: SimulacroSubmission): Promise<SimulacroScore> => {
  if (import.meta.env.VITE_USE_MOCKS === "true") {
    return submitSimulacroMock(submission);
  }

  try {
    return await submitSimulacroApi(submission);
  } catch (error) {
    if (isOfflineSubmissionError(error)) {
      const queued = await queueOfflineAttempt(submission);
      return {
        score: 0,
        totalQuestions: submission.answers.length,
        correctAnswers: 0,
        timeSpent: submission.timeSpent,
        percentile: 0,
        offlinePending: true,
        offlineAttemptId: queued.id,
        solutions: [],
      };
    }
    console.warn("🔴 API Error (Submit Simulacro), using mock.", error);
    return submitSimulacroMock(submission);
  }
};

export const syncOfflineAttempts = async () => {
  const queued = await getOfflineAttempts();
  const synced: string[] = [];

  for (const item of queued) {
    try {
      await submitSimulacroApi(item.submission);
      await removeOfflineAttempt(item.id);
      synced.push(item.id);
    } catch (error: any) {
      await markOfflineAttemptTried(item.id);
      if (!isOfflineSubmissionError(error) && error?.response?.status === 409) {
        await removeOfflineAttempt(item.id);
      }
    }
  }

  return synced;
};

export const getAchievements = async (): Promise<LearningAchievement[]> => {
  return getAchievementsApi();
};

export const getLearningNotifications = async (): Promise<LearningNotification[]> => {
  return getLearningNotificationsApi();
};

export const markLearningNotificationRead = async (notificationId: string): Promise<void> => {
  await markLearningNotificationReadApi(notificationId);
};

export const getGamificationSummary = getGamificationSummaryApi;
export const getGamificationLeaderboard = getGamificationLeaderboardApi;
export const completeOnboardingStep = completeOnboardingStepApi;
export const getGamificationSettings = getGamificationSettingsApi;
export const updateGamificationSettings = updateGamificationSettingsApi;

export const getChallengeRooms = async (): Promise<ChallengeRoom[]> => {
  if (import.meta.env.VITE_USE_MOCKS === "true") {
    return getChallengeRoomsMock();
  }

  try {
    return await getChallengeRoomsApi();
  } catch (error) {
    console.warn("🔴 API Error (Challenge Rooms), using mock.", error);
    return getChallengeRoomsMock();
  }
};

export const createChallengeRoom = async (data: CreateRoomData): Promise<ChallengeRoom> => {
  if (import.meta.env.VITE_USE_MOCKS === "true") {
    return createChallengeRoomMock(data);
  }

  try {
    return await createChallengeRoomApi(data);
  } catch (error) {
    console.warn("🔴 API Error (Create Challenge Room), using mock.", error);
    return createChallengeRoomMock(data);
  }
};

export const joinChallengeRoom = async (roomId: string): Promise<ChallengeRoom> => {
  return joinChallengeRoomApi(roomId);
};

export const leaveChallengeRoom = async (roomId: string): Promise<ChallengeRoom> => {
  return leaveChallengeRoomApi(roomId);
};

export const getChallengeMatch = async (roomId: string): Promise<LiveChallengeGame> => {
  return getChallengeMatchApi(roomId);
};

export const startChallengeMatch = async (roomId: string): Promise<LiveChallengeGame> => {
  return startChallengeMatchApi(roomId);
};

export const answerChallengeQuestion = async (
  roomId: string,
  questionId: string,
  answer: number
): Promise<LiveChallengeGame> => {
  return answerChallengeQuestionApi(roomId, questionId, answer);
};

export const nextChallengeQuestion = async (roomId: string): Promise<LiveChallengeGame> => {
  return nextChallengeQuestionApi(roomId);
};

export const getDailyTrivia = async (): Promise<TriviaQuestion[]> => {
  if (import.meta.env.VITE_USE_MOCKS === "true") {
    return getDailyTriviaMock();
  }

  try {
    return await getDailyTriviaApi();
  } catch (error) {
    console.warn("🔴 API Error (Daily Trivia), using mock.", error);
    return getDailyTriviaMock();
  }
};

export const getTriviaRooms = async (): Promise<TriviaRoom[]> => {
  if (import.meta.env.VITE_USE_MOCKS === "true") {
    return getTriviaRoomsMock();
  }

  try {
    return await getTriviaRoomsApi();
  } catch (error) {
    console.warn("🔴 API Error (Trivia Rooms), using mock.", error);
    return getTriviaRoomsMock();
  }
};

export const createTriviaRoom = async (data: CreateTriviaRoomData): Promise<TriviaRoom> => {
  if (import.meta.env.VITE_USE_MOCKS === "true") {
    return createTriviaRoomMock(data);
  }

  try {
    return await createTriviaRoomApi(data);
  } catch (error) {
    console.warn("🔴 API Error (Create Trivia Room), using mock.", error);
    return createTriviaRoomMock(data);
  }
};

export const joinTriviaRoom = async (roomId: string): Promise<TriviaRoom> => {
  return joinTriviaRoomApi(roomId);
};

export const getTriviaMatch = async (roomId: string): Promise<LiveTriviaGame> => {
  return getTriviaMatchApi(roomId);
};

export const startTriviaMatch = async (roomId: string): Promise<LiveTriviaGame> => {
  return startTriviaMatchApi(roomId);
};

export const answerTriviaQuestion = async (
  roomId: string,
  questionId: string,
  answer: number
): Promise<LiveTriviaGame> => {
  return answerTriviaQuestionApi(roomId, questionId, answer);
};

export const nextTriviaQuestion = async (roomId: string): Promise<LiveTriviaGame> => {
  return nextTriviaQuestionApi(roomId);
};

export const getQuestionBank = async (params?: {
  search?: string;
  materia?: string;
  dificultad?: string;
  universidad?: string;
}): Promise<BankQuestion[]> => {
  const response = await api.get("/learning/questions", { params });
  return response.data.data;
};

export const getSavedQuestions = async (): Promise<SavedQuestionItem[]> => {
  const response = await api.get("/learning/questions/saved");
  return response.data.data;
};

export const saveQuestion = async (questionId: string | number): Promise<SavedQuestionItem> => {
  const response = await api.post(`/learning/questions/${questionId}/save`);
  return response.data.data;
};

export const deleteSavedQuestion = async (questionId: string | number): Promise<void> => {
  await api.delete(`/learning/questions/${questionId}/save`);
};

export const createQuestion = async (data: CreateQuestionData): Promise<BankQuestion> => {
  const response = await api.post("/learning/questions", data);
  return response.data.data;
};

export const importQuestions = async (questions: CreateQuestionData[]): Promise<BankQuestion[]> => {
  const response = await api.post("/learning/questions/import", { questions });
  return response.data.data;
};

export const exportQuestions = async () => {
  const response = await api.get("/learning/questions/export", {
    responseType: "blob",
  });

  const blobUrl = window.URL.createObjectURL(response.data);
  const link = document.createElement("a");
  link.href = blobUrl;
  link.download = "banco-preguntas-pae.json";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(blobUrl);
};

export const getOpenAnswerReviews = async (estado: "pendiente" | "revisado" | "all" = "pendiente"): Promise<OpenAnswerReview[]> => {
  const response = await api.get("/learning/reviews/open", { params: { estado } });
  return response.data.data;
};

export const reviewOpenAnswer = async (
  attemptId: number,
  questionId: number,
  data: { puntaje: number; feedback?: string }
): Promise<OpenAnswerReview> => {
  const response = await api.post(`/learning/reviews/${attemptId}/questions/${questionId}`, data);
  return response.data.data.review;
};
