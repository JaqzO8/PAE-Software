// src/features/learning/hooks/useLearning.ts
import { useEffect, useState } from "react";
import {
  createChallengeRoom,
  createTriviaRoom,
  answerChallengeQuestion,
  answerTriviaQuestion,
  getChallengeRooms,
  getTriviaMatch,
  getTriviaRooms,
  getUniversities,
  joinChallengeRoom,
  joinTriviaRoom,
  nextChallengeQuestion,
  nextTriviaQuestion,
  startChallengeMatch,
  startTriviaMatch,
  startSimulacro,
  type ChallengeRoom,
  type CreateTriviaRoomData,
  type LiveChallengeGame,
  type LiveTriviaGame,
  type SimulacroConfig,
  type SimulacroResult,
  type TriviaRoom,
  type University,
} from "../services/learningService";
import { saveActiveExam } from "../services/activeExamCache";
import { connectLearningSocket, subscribeChallengeRoom, subscribeTriviaRoom } from "../services/learningRealtime";
import { useToast } from "../../../hooks/useToast";

const upsertRoom = <T extends { id: string; status: string }>(rooms: T[], room: T) => {
  if (room.status === "finished") return rooms.filter((item) => item.id !== room.id);
  const exists = rooms.some((item) => item.id === room.id);
  if (!exists) return [room, ...rooms];
  return rooms.map((item) => (item.id === room.id ? room : item));
};

export const useSimulacros = () => {
  const [universities, setUniversities] = useState<University[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [simulacro, setSimulacro] = useState<SimulacroResult | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadUniversities();
  }, []);

  const loadUniversities = async () => {
    setIsLoading(true);
    try {
      setUniversities(await getUniversities());
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudieron cargar las universidades.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const startExam = async (config: SimulacroConfig) => {
    setIsLoading(true);
    try {
      const result = await startSimulacro(config);
      setSimulacro(result);
      saveActiveExam({
        simulacro: result,
        answers: new Array(result.questions.length).fill(null),
        currentQuestionIndex: 0,
        timeRemaining: result.timeLimit,
        updatedAt: new Date().toISOString(),
      });
      toast({
        title: "Simulacro iniciado",
        description: "Buena suerte. Recuerda que el tiempo corre.",
      });
      return result;
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo iniciar el simulacro.",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return { universities, simulacro, isLoading, startExam };
};

export const useChallenges = () => {
  const [rooms, setRooms] = useState<ChallengeRoom[]>([]);
  const [activeGame, setActiveGame] = useState<LiveChallengeGame | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadRooms();
  }, []);

  useEffect(() => {
    return connectLearningSocket({
      onChallengeRoomsUpdated: ({ room }) => {
        setRooms((prev) => upsertRoom(prev, room));
      },
      onChallengeRoomUpdated: ({ room }) => {
        setRooms((prev) => upsertRoom(prev, room));
      },
      onChallengeGameUpdated: ({ game }) => {
        setActiveGame((prev) => (prev?.room.id === game.room.id || !prev ? game : prev));
        setRooms((prev) => upsertRoom(prev, game.room));
      },
    });
  }, []);

  const loadRooms = async () => {
    setIsLoading(true);
    try {
      setRooms(await getChallengeRooms());
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudieron cargar las salas.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const createRoom = async (roomData: any) => {
    setIsLoading(true);
    try {
      const newRoom = await createChallengeRoom(roomData);
      subscribeChallengeRoom(newRoom.id);
      setRooms((prev) => upsertRoom(prev, newRoom));
      toast({
        title: "Sala creada",
        description: "Tu sala esta lista. Espera a que se unan otros jugadores.",
      });
      return newRoom;
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo crear la sala.",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const joinRoom = async (roomId: string) => {
    try {
      const updatedRoom = await joinChallengeRoom(roomId);
      subscribeChallengeRoom(roomId);
      setRooms((prev) => upsertRoom(prev, updatedRoom));
      toast({
        title: "Te uniste a la sala",
        description: `${updatedRoom.currentPlayers} / ${updatedRoom.maxPlayers} jugadores conectados.`,
      });
      return updatedRoom;
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "No se pudo unir",
        description: error.response?.data?.message || "La sala ya no esta disponible.",
      });
      throw error;
    }
  };

  const startGame = async (roomId: string) => {
    try {
      subscribeChallengeRoom(roomId);
      const game = await startChallengeMatch(roomId);
      setActiveGame(game);
      setRooms((prev) => upsertRoom(prev, game.room));
      toast({
        title: "Partida iniciada",
        description: `${game.totalQuestions} preguntas con puntaje por velocidad.`,
      });
      return game;
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "No se pudo iniciar",
        description: error.response?.data?.message || "Revisa que estes dentro de la sala.",
      });
      throw error;
    }
  };

  const answerQuestion = async (answer: number) => {
    if (!activeGame?.currentQuestion) return null;
    try {
      const game = await answerChallengeQuestion(activeGame.room.id, activeGame.currentQuestion.id, answer);
      setActiveGame(game);
      setRooms((prev) => upsertRoom(prev, game.room));
      if (game.lastAnswer) {
        toast({
          title: game.lastAnswer.correct ? "Respuesta correcta" : "Respuesta registrada",
          description: `${game.lastAnswer.points} puntos`,
        });
      }
      return game;
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "No se pudo responder",
        description: error.response?.data?.message || "La pregunta ya cambio.",
      });
      throw error;
    }
  };

  const nextQuestion = async () => {
    if (!activeGame) return null;
    const game = await nextChallengeQuestion(activeGame.room.id);
    setActiveGame(game);
    setRooms((prev) => upsertRoom(prev, game.room));
    return game;
  };

  return { rooms, activeGame, isLoading, createRoom, joinRoom, startGame, answerQuestion, nextQuestion, refresh: loadRooms };
};

export const useTrivia = () => {
  const [rooms, setRooms] = useState<TriviaRoom[]>([]);
  const [activeGame, setActiveGame] = useState<LiveTriviaGame | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadRooms();
  }, []);

  useEffect(() => {
    return connectLearningSocket({
      onTriviaRoomsUpdated: ({ room }) => {
        setRooms((prev) => upsertRoom(prev, room));
      },
      onTriviaRoomUpdated: ({ room }) => {
        setRooms((prev) => upsertRoom(prev, room));
      },
      onTriviaGameUpdated: ({ game }) => {
        setActiveGame((prev) => (prev?.room.id === game.room.id || !prev ? game : prev));
        setRooms((prev) => upsertRoom(prev, game.room));
      },
    });
  }, []);

  const loadRooms = async () => {
    setIsLoading(true);
    try {
      setRooms(await getTriviaRooms());
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudieron cargar las salas de trivia.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const createRoom = async (roomData: CreateTriviaRoomData) => {
    setIsLoading(true);
    try {
      const newRoom = await createTriviaRoom(roomData);
      subscribeTriviaRoom(newRoom.id);
      setRooms((prev) => upsertRoom(prev, newRoom));
      toast({
        title: "Sala creada",
        description: "Tu sala de trivia esta lista. Espera a que se unan otros jugadores.",
      });
      return newRoom;
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo crear la sala de trivia.",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const joinRoom = async (roomId: string) => {
    try {
      const updatedRoom = await joinTriviaRoom(roomId);
      subscribeTriviaRoom(roomId);
      setRooms((prev) => upsertRoom(prev, updatedRoom));
      toast({
        title: "Te uniste a la trivia",
        description: `${updatedRoom.currentPlayers} / ${updatedRoom.maxPlayers} jugadores conectados.`,
      });
      return updatedRoom;
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "No se pudo unir",
        description: error.response?.data?.message || "La sala ya no esta disponible.",
      });
      throw error;
    }
  };

  const startGame = async (roomId: string) => {
    try {
      subscribeTriviaRoom(roomId);
      const game = await startTriviaMatch(roomId);
      setActiveGame(game);
      setRooms((prev) => upsertRoom(prev, game.room));
      toast({
        title: "Trivia iniciada",
        description: `${game.totalQuestions} preguntas con puntaje por velocidad.`,
      });
      return game;
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "No se pudo iniciar",
        description: error.response?.data?.message || "Revisa que estes dentro de la sala.",
      });
      throw error;
    }
  };

  const openGame = async (roomId: string) => {
    try {
      subscribeTriviaRoom(roomId);
      const game = await getTriviaMatch(roomId);
      setActiveGame(game);
      return game;
    } catch (error: any) {
      if (error.response?.status === 404) return startGame(roomId);
      throw error;
    }
  };

  const answerQuestion = async (answer: number) => {
    if (!activeGame?.currentQuestion) return null;
    try {
      const game = await answerTriviaQuestion(activeGame.room.id, activeGame.currentQuestion.id, answer);
      setActiveGame(game);
      setRooms((prev) => upsertRoom(prev, game.room));
      if (game.lastAnswer) {
        toast({
          title: game.lastAnswer.correct ? "Respuesta correcta" : "Respuesta registrada",
          description: `${game.lastAnswer.points} puntos`,
        });
      }
      return game;
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "No se pudo responder",
        description: error.response?.data?.message || "La pregunta ya cambio.",
      });
      throw error;
    }
  };

  const nextQuestion = async () => {
    if (!activeGame) return null;
    const game = await nextTriviaQuestion(activeGame.room.id);
    setActiveGame(game);
    setRooms((prev) => upsertRoom(prev, game.room));
    return game;
  };

  return { rooms, activeGame, isLoading, createRoom, joinRoom, startGame, openGame, answerQuestion, nextQuestion, refresh: loadRooms };
};
