// src/pages/teacher/groups/Detail.tsx
import { useCallback, useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Send,
  MessageSquare,
  HelpCircle,
  BarChart3,
  CheckCircle,
  TrendingUp,
} from "lucide-react";
import {
  Button,
  Input,
  Avatar,
  AvatarImage,
  AvatarFallback,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  Card,
  Skeleton,
  ScrollArea,
} from "../../../desingSystem/primitives";
import { ParticipantsSheet } from "../components/ParticipantsSheet";
import {
  getGroupDetail,
  leaveGroup,
  sendGroupMessage,
  type GroupDetail as GroupDetailType,
} from "../services/groupsService";
import { useToast } from "../../../hooks/useToast";
import { useAuth } from "../../../context/AuthContext";
import styles from "../components/groups.module.css";

export default function GroupDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth(); // ✅ Obtener usuario del contexto

  const [group, setGroup] = useState<GroupDetailType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showParticipants, setShowParticipants] = useState(false);
  const [message, setMessage] = useState("");

  // ✅ Determinar si el usuario es docente
  const isTeacher = user?.rol === "docente";
  const basePath = isTeacher ? "/docente" : "/estudiante";
  const performance = group?.analytics.performance;

  const loadGroupDetail = useCallback(async () => {
    if (!id) return;
    try {
      const data = await getGroupDetail(id);
      setGroup(data);
    } catch (error) {
      console.error("No se pudo cargar el detalle del grupo", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo cargar el grupo.",
      });
    } finally {
      setIsLoading(false);
    }
  }, [id, toast]);

  useEffect(() => {
    if (!id) return;

    let isActive = true;
    getGroupDetail(id)
      .then((data) => {
        if (isActive) setGroup(data);
      })
      .catch((error) => {
        if (!isActive) return;
        console.error("No se pudo cargar el detalle del grupo", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "No se pudo cargar el grupo.",
        });
      })
      .finally(() => {
        if (isActive) setIsLoading(false);
      });

    return () => {
      isActive = false;
    };
  }, [id, toast]);

  const handleSendMessage = async () => {
    if (!message.trim()) return;
    await sendGroupMessage(id!, message.trim());
    setMessage("");
    await loadGroupDetail();
  };

  const handleLeaveGroup = async () => {
    if (id) await leaveGroup(id);
    toast({
      title: "Saliste del grupo",
      description: "Has abandonado esta comunidad.",
    });
    navigate(`${basePath}/grupos`);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 w-full rounded-xl" />
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    );
  }

  if (!group) {
    return (
      <div className="text-center py-12">
        <p>No se encontró el grupo</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Botón de Regreso */}
      <Button
        variant="ghost"
        className="gap-2 pl-0 hover:bg-transparent text-neutral-600 hover:text-brand-action"
        onClick={() => navigate(`${basePath}/grupos`)}
      >
        <ArrowLeft className="h-4 w-4" />
        Volver a Mis Comunidades
      </Button>

      {/* Contenedor Principal estilo Chat */}
      <div className={styles.chatContainer}>
        {/* Header Clickeable */}
        <button
          type="button"
          className={styles.chatHeader}
          onClick={() => setShowParticipants(true)}
          aria-label={`Ver participantes de ${group.name}`}
        >
          <Avatar className={styles.chatHeaderAvatar}>
            <AvatarImage src={group.avatar} alt={group.name} />
            <AvatarFallback className="bg-white/30 text-white font-bold">
              {group.name.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className={styles.chatHeaderInfo}>
            <h1 className={styles.chatHeaderTitle}>{group.name}</h1>
            <p className={styles.chatHeaderStatus}>
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              {group.status}
            </p>
          </div>
        </button>

        {/* Tabs de Navegación */}
        <Tabs defaultValue="chat" className="flex-1 flex flex-col">
          <TabsList className={styles.chatTabs}>
            <TabsTrigger value="chat" className="gap-2">
              <MessageSquare className="h-4 w-4" />
              Chat
            </TabsTrigger>
            <TabsTrigger value="forums" className="gap-2">
              <HelpCircle className="h-4 w-4" />
              Foros
            </TabsTrigger>
            <TabsTrigger value="analytics" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              Rendimiento
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: Chat */}
          <TabsContent value="chat" className="flex-1 flex flex-col m-0">
            <ScrollArea className={styles.chatMessages}>
              {group.messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`${styles.messageBubble} ${
                    msg.authorRole === "docente" ? styles.messageBubbleTeacher : ""
                  }`}
                >
                  <Avatar className={styles.messageAvatar}>
                    <AvatarImage src={msg.avatar} alt={msg.author} />
                    <AvatarFallback className="bg-neutral-200 text-neutral-600 text-xs font-bold">
                      {msg.author.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className={styles.messageContent}>
                    <span className={styles.messageAuthor}>{msg.author}</span>
                    <div
                      className={`${styles.messageText} ${
                        msg.authorRole === "docente" ? styles.messageTextTeacher : ""
                      }`}
                    >
                      {msg.content}
                    </div>
                    <span className={styles.messageTime}>{msg.timestamp}</span>
                  </div>
                </div>
              ))}
            </ScrollArea>

            {/* Input de Mensaje */}
            <div className={styles.chatInput}>
              <Input
                placeholder="Escribe un mensaje..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                className={styles.chatInputField}
              />
              <Button
                onClick={handleSendMessage}
                disabled={!message.trim()}
                className={styles.chatSendButton}
              >
                <Send className="h-5 w-5" />
              </Button>
            </div>
          </TabsContent>

          {/* TAB 2: Foros */}
          <TabsContent value="forums" className="flex-1 m-0">
            <div className={styles.forumList}>
              {group.forums.map((forum) => (
                <div key={forum.id} className={styles.forumItem}>
                  <div className={styles.forumHeader}>
                    <Avatar className={styles.forumAvatar}>
                      <AvatarImage src={forum.authorAvatar} alt={forum.author} />
                      <AvatarFallback className="bg-neutral-100 text-neutral-600 font-bold text-xs">
                        {forum.author.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <h3 className={styles.forumTitle}>{forum.title}</h3>
                      <div className={styles.forumMeta}>
                        <span>Por {forum.author}</span>
                        <span>•</span>
                        <span>{forum.replies} respuestas</span>
                        <span>•</span>
                        <span>{forum.lastReply}</span>
                      </div>
                    </div>
                    {forum.isResolved && (
                      <div className={styles.forumResolved}>
                        <CheckCircle className="h-4 w-4" />
                        Resuelto
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* TAB 3: Analítica (Solo Docente) */}
          <TabsContent value="analytics" className="flex-1 m-0">
              <div className={styles.analyticsGrid}>
                {performance && (
                  <Card className={`${styles.analyticsCard} md:col-span-2`}>
                    <h3 className={styles.analyticsTitle}>Perfil de Rendimiento Comunitario</h3>
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                      <div>
                        <p className={styles.analyticsStat}>{performance.score}/100</p>
                        <p className={styles.analyticsSubtext}>
                          Estado: {performance.status === "en_riesgo" ? "en riesgo" : performance.status}
                        </p>
                      </div>
                      <div className="grid gap-2 text-sm text-neutral-600 sm:grid-cols-2">
                        <span>Participacion: {performance.rates.participation}%</span>
                        <span>Mensajes: {performance.rates.messages}%</span>
                        <span>Recursos: {performance.rates.resources}%</span>
                        <span>Desafios: {performance.rates.challenges}%</span>
                      </div>
                    </div>
                  </Card>
                )}
                <Card className={styles.analyticsCard}>
                  <h3 className={styles.analyticsTitle}>Mensajes Totales</h3>
                  <p className={styles.analyticsStat}>{group.analytics.totalMessages}</p>
                  <p className={styles.analyticsSubtext}>En los últimos 30 días</p>
                </Card>

                <Card className={styles.analyticsCard}>
                  <h3 className={styles.analyticsTitle}>Miembros Activos</h3>
                  <p className={styles.analyticsStat}>{group.analytics.activeMembers}</p>
                  <p className={styles.analyticsSubtext}>
                    de {group.membersCount} totales
                  </p>
                </Card>

                <Card className={styles.analyticsCard}>
                  <h3 className={styles.analyticsTitle}>Tiempo de Respuesta Promedio</h3>
                  <p className={styles.analyticsStat}>{group.analytics.avgResponseTime}</p>
                  <p className={styles.analyticsSubtext}>Entre mensajes</p>
                </Card>

                <Card className={styles.analyticsCard}>
                  <h3 className={styles.analyticsTitle}>Tasa de Participación</h3>
                  <div className="flex items-center gap-2">
                    <p className={styles.analyticsStat}>
                      {group.analytics.participationRate}%
                    </p>
                    <TrendingUp className="h-5 w-5 text-success-progress" />
                  </div>
                  <p className={styles.analyticsSubtext}>+5% vs mes anterior</p>
                </Card>

                {/* Top Contributors */}
                <Card className={`${styles.analyticsCard} md:col-span-2`}>
                  <h3 className={styles.analyticsTitle}>Principales Contribuidores</h3>
                  <div className={styles.contributorsList}>
                    {group.analytics.topContributors.length === 0 ? (
                      <p className="text-sm text-neutral-600">Aun no hay contribuciones suficientes en la ventana actual.</p>
                    ) : group.analytics.topContributors.map((contributor) => (
                      <div key={`${contributor.name}-${contributor.avatar}`} className={styles.contributorItem}>
                        <Avatar className={styles.contributorAvatar}>
                          <AvatarImage src={contributor.avatar} alt={contributor.name} />
                          <AvatarFallback className="bg-brand-action/10 text-brand-action font-bold text-xs">
                            {contributor.name.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className={styles.contributorInfo}>
                          <p className={styles.contributorName}>{contributor.name}</p>
                          <p className={styles.contributorMessages}>
                            {contributor.messages} mensajes
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
                {performance && (
                  <Card className={`${styles.analyticsCard} md:col-span-2`}>
                    <h3 className={styles.analyticsTitle}>Acciones Recomendadas</h3>
                    <div className="space-y-2">
                      {performance.recommendedActions.map((action) => (
                        <p key={action} className="rounded-lg bg-neutral-50 px-3 py-2 text-sm text-neutral-700">
                          {action}
                        </p>
                      ))}
                    </div>
                  </Card>
                )}
              </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Sheet de Participantes */}
      <ParticipantsSheet
        open={showParticipants}
        onOpenChange={setShowParticipants}
        participants={group.participants}
        groupName={group.name}
        onLeave={handleLeaveGroup}
      />
    </div>
  );
}
