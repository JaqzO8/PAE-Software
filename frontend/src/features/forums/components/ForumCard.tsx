// src/features/forums/components/ForumCard.tsx
import { Heart, MessageCircle, Flag } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback, Badge } from "../../../desingSystem/primitives";
import type { ForumPost } from "../services/forumsService";
import styles from "./forums.module.css";

interface ForumCardProps {
  forum: ForumPost;
  onLike: (forumId: string) => void;
  onReport: (forumId: string) => void;
  onClick: (forumId: string) => void;
}

export function ForumCard({ forum, onLike, onReport, onClick }: ForumCardProps) {
  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    onLike(forum.id);
  };

  const handleReport = (e: React.MouseEvent) => {
    e.stopPropagation();
    onReport(forum.id);
  };

  return (
    <div className={styles.forumCard} onClick={() => onClick(forum.id)}>
      {/* Imagen del Foro */}
      {forum.image && (
        <img 
          src={forum.image} 
          alt={forum.title} 
          className={styles.forumImage}
        />
      )}

      {/* Contenido */}
      <div className={styles.forumContent}>
        <h3 className={styles.forumTitle}>{forum.title}</h3>
        <p className={styles.forumQuestion}>{forum.question}</p>

        {/* Meta: Autor y Grupo */}
        <div className={styles.forumMeta}>
          <div className={styles.forumAuthor}>
            <Avatar className={styles.forumAvatar}>
              <AvatarImage src={forum.authorAvatar} alt={forum.author} />
              <AvatarFallback className="bg-neutral-200 text-neutral-600 text-xs font-bold">
                {forum.author.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="font-medium">{forum.author}</span>
            <Badge 
              className={forum.authorRole === "docente" ? styles.roleBadgeTeacher : styles.roleBadgeStudent}
            >
              {forum.authorRole === "docente" ? "Docente" : "Estudiante"}
            </Badge>
          </div>
        </div>

        <div className="text-xs text-muted-foreground">
          En {forum.groupName} • {forum.createdAt}
        </div>

        {/* Tags */}
        {forum.tags.length > 0 && (
          <div className={styles.forumTags}>
            {forum.tags.map(tag => (
              <span key={tag} className={styles.forumTag}>{tag}</span>
            ))}
          </div>
        )}
      </div>

      {/* Acciones */}
      <div className={styles.forumActions}>
        <div className={styles.forumStats}>
          <button 
            className={`${styles.forumStat} ${forum.isLiked ? styles.forumStatActive : ""}`}
            onClick={handleLike}
          >
            <Heart className={`h-4 w-4 ${forum.isLiked ? "fill-current" : ""}`} />
            <span>{forum.likes}</span>
          </button>
          <div className={styles.forumStat}>
            <MessageCircle className="h-4 w-4" />
            <span>{forum.comments}</span>
          </div>
        </div>
        <button className={styles.reportButton} onClick={handleReport}>
          <Flag className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}