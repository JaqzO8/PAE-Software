import { io, type Socket } from "socket.io-client";
import type { ChallengeRoom, LiveChallengeGame, LiveTriviaGame, TriviaRoom } from "./learningService";

type ChallengeRoomsPayload = {
  action: "created" | "joined" | "left" | "started" | "finished";
  room: ChallengeRoom;
};

type ChallengeGamePayload = {
  action: "started" | "answered" | "next" | "finished";
  game: LiveChallengeGame;
};

type TriviaRoomsPayload = {
  action: "created" | "joined" | "started" | "finished";
  room: TriviaRoom;
};

type TriviaGamePayload = {
  action: "started" | "answered" | "next" | "finished";
  game: LiveTriviaGame;
};

const apiUrl = import.meta.env.VITE_API_URL || "/api";
const socketUrl = apiUrl.startsWith("http")
  ? apiUrl.replace(/\/api\/?$/, "")
  : window.location.origin;

let socket: Socket | null = null;

export const connectLearningSocket = (handlers: {
  onChallengeRoomsUpdated?: (payload: ChallengeRoomsPayload) => void;
  onChallengeRoomUpdated?: (payload: ChallengeRoomsPayload) => void;
  onChallengeGameUpdated?: (payload: ChallengeGamePayload) => void;
  onTriviaRoomsUpdated?: (payload: TriviaRoomsPayload) => void;
  onTriviaRoomUpdated?: (payload: TriviaRoomsPayload) => void;
  onTriviaGameUpdated?: (payload: TriviaGamePayload) => void;
}) => {
  const token = localStorage.getItem("token");
  if (!token) return () => {};

  socket = io(socketUrl, {
    path: "/learning-socket",
    auth: { token },
    transports: ["websocket", "polling"],
  });

  if (handlers.onChallengeRoomsUpdated) {
    socket.on("challenge:rooms-updated", handlers.onChallengeRoomsUpdated);
  }

  if (handlers.onChallengeRoomUpdated) {
    socket.on("challenge:room-updated", handlers.onChallengeRoomUpdated);
  }

  if (handlers.onChallengeGameUpdated) {
    socket.on("challenge:game-updated", handlers.onChallengeGameUpdated);
  }

  if (handlers.onTriviaRoomsUpdated) {
    socket.on("trivia:rooms-updated", handlers.onTriviaRoomsUpdated);
  }

  if (handlers.onTriviaRoomUpdated) {
    socket.on("trivia:room-updated", handlers.onTriviaRoomUpdated);
  }

  if (handlers.onTriviaGameUpdated) {
    socket.on("trivia:game-updated", handlers.onTriviaGameUpdated);
  }

  return () => {
    socket?.off("challenge:rooms-updated");
    socket?.off("challenge:room-updated");
    socket?.off("challenge:game-updated");
    socket?.off("trivia:rooms-updated");
    socket?.off("trivia:room-updated");
    socket?.off("trivia:game-updated");
    socket?.disconnect();
    socket = null;
  };
};

export const subscribeChallengeRoom = (roomId: string) => {
  socket?.emit("challenge:join-room", roomId);
};

export const unsubscribeChallengeRoom = (roomId: string) => {
  socket?.emit("challenge:leave-room", roomId);
};

export const subscribeTriviaRoom = (roomId: string) => {
  socket?.emit("trivia:join-room", roomId);
};

export const unsubscribeTriviaRoom = (roomId: string) => {
  socket?.emit("trivia:leave-room", roomId);
};
