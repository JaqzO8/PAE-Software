// src/features/groups/components/ParticipantsSheet.tsx
import { LogOut, Crown } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  Button,
  Avatar,
  AvatarImage,
  AvatarFallback,
  Badge,
  ScrollArea,
} from "../../../desingSystem/primitives";
import type { GroupParticipant } from "../services/groupsService";
import styles from "./groups.module.css";

interface ParticipantsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  participants: GroupParticipant[];
  groupName: string;
  onLeave: () => void;
}

export function ParticipantsSheet({
  open,
  onOpenChange,
  participants,
  groupName,
  onLeave,
}: ParticipantsSheetProps) {
  const teachers = participants.filter((p) => p.role === "docente");
  const students = participants.filter((p) => p.role === "estudiante");

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-96 p-0">
        <SheetHeader className="p-6 pb-4 border-b border-neutral-200">
          <SheetTitle className="text-xl">Participantes</SheetTitle>
          <SheetDescription>
            {participants.length} miembros en {groupName}
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-200px)]">
          <div className="p-6 space-y-6">
            {/* Docentes */}
            {teachers.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-neutral-600 mb-3 flex items-center gap-2">
                  <Crown className="h-4 w-4 text-brand-action" />
                  Docentes ({teachers.length})
                </h3>
                <div className={styles.participantsList}>
                  {teachers.map((participant) => (
                    <ParticipantItem key={participant.id} participant={participant} />
                  ))}
                </div>
              </div>
            )}

            {/* Estudiantes */}
            {students.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-neutral-600 mb-3">
                  Estudiantes ({students.length})
                </h3>
                <div className={styles.participantsList}>
                  {students.map((participant) => (
                    <ParticipantItem key={participant.id} participant={participant} />
                  ))}
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Botón de Salir (zona peligrosa) */}
        <div className="p-6 border-t border-neutral-200 bg-neutral-50/50">
          <Button
            variant="destructive"
            className={styles.leaveButton}
            onClick={onLeave}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Salir del Grupo
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function ParticipantItem({ participant }: { participant: GroupParticipant }) {
  return (
    <div className={styles.participantItem}>
      <Avatar className={styles.participantAvatar}>
        <AvatarImage src={participant.avatar} alt={participant.name} />
        <AvatarFallback className="bg-brand-action/10 text-brand-action font-bold">
          {participant.name.substring(0, 2).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <div className={styles.participantInfo}>
        <div className="flex items-center gap-2">
          <span className={styles.participantName}>{participant.name}</span>
          {participant.role === "docente" && (
            <Badge className={styles.participantBadge}>Docente</Badge>
          )}
        </div>
        <p className={styles.participantEmail}>{participant.email}</p>
        <p className={styles.participantRole}>Unido {participant.joinedAt}</p>
      </div>
    </div>
  );
}