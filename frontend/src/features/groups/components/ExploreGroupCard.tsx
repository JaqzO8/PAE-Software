// src/features/groups/components/ExploreGroupCard.tsx
import { useState } from "react";
import { Users, Clock } from "lucide-react";
import { Button, Avatar, AvatarImage, AvatarFallback } from "../../../desingSystem/primitives";
import type { Group } from "../services/groupsService";
import styles from "./groups.module.css";

interface ExploreGroupCardProps {
  group: Group;
  onJoinRequest: (groupId: string) => void;
  isJoining: boolean;
}

export function ExploreGroupCard({ group, onJoinRequest, isJoining }: ExploreGroupCardProps) {
  const [requested, setRequested] = useState(false);

  const handleJoin = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!requested) {
      onJoinRequest(group.id);
      setRequested(true);
    }
  };

  return (
    <div className={styles.groupCard}>
      <div className={styles.groupHeader}>
        <div className={styles.groupAvatar}>
          <Avatar className="w-full h-full">
            <AvatarImage src={group.avatar} alt={group.name} />
            <AvatarFallback className="bg-brand-action/10 text-brand-action font-bold">
              {group.name.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>

      <div>
        <span className={styles.groupSubject}>{group.subject}</span>
        <h3 className={styles.groupTitle}>{group.name}</h3>
      </div>

      <div className={styles.groupMeta}>
        <div className={styles.groupMetaItem}>
          <Users className="h-4 w-4" />
          <span>{group.membersCount} miembros</span>
        </div>
        {group.lastActivity && (
          <div className={styles.groupMetaItem}>
            <Clock className="h-4 w-4" />
            <span>{group.lastActivity}</span>
          </div>
        )}
      </div>

      {group.status && (
        <div className={styles.groupStatus}>
          <div className="w-2 h-2 rounded-full bg-success-progress animate-pulse" />
          {group.status}
        </div>
      )}

      <Button 
      className={`
        !bg-brand-action 
        !hover:bg-brand-action/90 
        !text-white 
        !rounded-lg 
        !py-3 
        w-full 
        ${requested ? "opacity-80 cursor-default" : ""}`   }
          onClick={handleJoin}
        disabled={isJoining || requested}
      >
        {requested ? "Unido" : "Unirse"}
      </Button>
    </div>
  );
}
