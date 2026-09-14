// src/pages/learning/Trivia.tsx
import { useState } from "react";
import { Zap, Plus, Users, Clock, Trophy, Search, Play } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  Button,
  Input,
  Skeleton,
  Avatar,
  AvatarImage,
  AvatarFallback,
} from "../../desingSystem/primitives";
import { useTrivia } from "../../features/learning/hooks/useLearning";
import { CreateTriviaRoomModal } from "../../features/learning/components/CreateTriviaRoomModal";
import { LiveGamePanel } from "../../features/learning/components/LiveGamePanel";
import styles from "../../features/learning/components/learning.module.css";

const Trivia = () => {
  const { rooms, activeGame, isLoading, createRoom, joinRoom, openGame, answerQuestion, nextQuestion } = useTrivia();
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);

  const filteredRooms = rooms.filter((room) =>
    room.topic.toLowerCase().includes(searchQuery.toLowerCase()) ||
    room.host.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateRoom = async (data: any) => {
    await createRoom(data);
    setShowCreateModal(false);
  };

  return (
    <div className={styles.pageContainer}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-brand-action/10 rounded-xl">
            <Zap className="h-6 w-6 text-brand-action" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-primary-contrast">
              Trivia Colaborativa
            </h1>
            <p className="text-muted-foreground">
              Compite en vivo respondiendo preguntas rápidas • Gana puntos por velocidad
            </p>
          </div>
        </div>
        <Button
          className="gap-2 bg-brand-action hover:bg-brand-action/90"
          onClick={() => setShowCreateModal(true)}
        >
          <Plus className="h-4 w-4" />
          Crear Sala
        </Button>
      </div>

      {/* Información del Juego */}
      <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-white rounded-lg shadow-sm">
                <Zap className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="font-semibold text-primary-contrast mb-1">
                  Preguntas Rápidas
                </p>
                <p className="text-sm text-muted-foreground">
                  5-10 preguntas con límite de tiempo
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="p-2 bg-white rounded-lg shadow-sm">
                <Trophy className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="font-semibold text-primary-contrast mb-1">
                  Puntos por Velocidad
                </p>
                <p className="text-sm text-muted-foreground">
                  Responde rápido para ganar más puntos
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="p-2 bg-white rounded-lg shadow-sm">
                <Clock className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="font-semibold text-primary-contrast mb-1">
                  5-10 Minutos
                </p>
                <p className="text-sm text-muted-foreground">
                  Sesiones cortas y emocionantes
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {activeGame && (
        <LiveGamePanel
          game={activeGame}
          titleIconClassName="text-purple-600"
          optionAccentClassName="bg-purple-50 text-purple-700"
          onAnswer={answerQuestion}
          onNext={nextQuestion}
        />
      )}

      {/* Buscador */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar salas de trivia por tema..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Salas Disponibles */}
      <div>
        <h2 className="text-xl font-bold text-primary-contrast mb-4">
          Salas de Trivia Disponibles
        </h2>

        {isLoading ? (
          <div className={styles.roomsGrid}>
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-64 w-full rounded-xl" />
            ))}
          </div>
        ) : filteredRooms.length === 0 ? (
          <Card className="p-12 text-center border-2 border-dashed">
            <Zap className="h-12 w-12 mx-auto mb-4 text-neutral-300" />
            <p className="text-lg font-medium text-neutral-600 mb-2">
              No hay salas de trivia disponibles
            </p>
            <p className="text-sm text-muted-foreground mb-6">
              {searchQuery
                ? "Intenta con otros términos de búsqueda"
                : "Sé el primero en crear una sala de trivia"}
            </p>
            <Button
              className="bg-brand-action hover:bg-brand-action/90"
              onClick={() => setShowCreateModal(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Crear Primera Sala
            </Button>
          </Card>
        ) : (
          <div className={styles.roomsGrid}>
            {filteredRooms.map((room) => (
              <Card key={room.id} className={styles.roomCard}>
                <CardHeader className={styles.roomHeader}>
                  <Avatar className={styles.roomAvatar}>
                    <AvatarImage src={room.hostAvatar} alt={room.host} />
                    <AvatarFallback className="bg-purple-100 text-purple-600 font-bold">
                      {room.host.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className={styles.roomInfo}>
                    <p className={styles.roomHost}>{room.host}</p>
                    <p className={styles.roomTopic}>{room.topic}</p>
                  </div>
                  <span className={styles.roomStatusText}>
                    {room.status === "waiting"
                      ? "Esperando"
                      : room.status === "playing"
                      ? "En juego"
                      : "Llena"}
                  </span>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className={styles.roomStats}>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span>
                        {room.currentPlayers} / {room.maxPlayers} jugadores
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>{room.createdAt}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-purple-600" />
                    <span className="text-sm font-medium text-purple-600">
                      {room.questionsCount} preguntas
                    </span>
                  </div>

                  <Button
                    variant="brand"
                    className={`
                      ${styles.roomJoinButton}
                      disabled:!bg-brand-action/50
                      disabled:!text-white
                      disabled:cursor-not-allowed
                    `}
                    onClick={() => joinRoom(room.id)}
                    disabled={
                      room.status !== "waiting" ||
                      room.currentPlayers >= room.maxPlayers
                    }
                  >
                    {room.status === "waiting"
                      ? "Unirse a la Sala"
                      : room.status === "playing"
                      ? "Partida en Curso"
                      : "Sala Llena"}
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full gap-2"
                    onClick={() => openGame(room.id)}
                    disabled={room.status === "finished"}
                  >
                    <Play className="h-4 w-4" />
                    {room.status === "playing" ? "Abrir trivia" : "Iniciar trivia"}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Estadísticas Rápidas */}
      <Card className="bg-neutral-50/50">
        <CardHeader>
          <CardTitle>Sobre la Trivia Colaborativa</CardTitle>
          <CardDescription>
            Aprende mientras compites con otros estudiantes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-3xl font-bold text-purple-600 mb-2">
                {rooms.length}
              </p>
              <p className="text-sm text-muted-foreground">Salas activas</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-green-600 mb-2">
                {rooms.reduce((sum, r) => sum + r.currentPlayers, 0)}
              </p>
              <p className="text-sm text-muted-foreground">Jugadores en línea</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-orange-600 mb-2">
                +{Math.floor(Math.random() * 100 + 200)}
              </p>
              <p className="text-sm text-muted-foreground">
                Trivias completadas hoy
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Modal de Creación */}
      {showCreateModal && (
        <CreateTriviaRoomModal
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreateRoom}
        />
      )}
    </div>
  );
};

export default Trivia;
