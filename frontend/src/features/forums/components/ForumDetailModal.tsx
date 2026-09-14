// src/features/forums/components/ForumDetailModal.tsx
import { useState } from "react";
import { X, Heart, MessageCircle, Send } from "lucide-react";
import { 
  Button, 
  Input, 
  Avatar, 
  AvatarImage, 
  AvatarFallback,
  Badge,
  Skeleton 
} from "../../../desingSystem/primitives";
import { useForumDetail } from "../hooks/useForums";
import styles from "./forums.module.css";

interface ForumDetailModalProps {
  forumId: string;
  onClose: () => void;
}

export function ForumDetailModal({ forumId, onClose }: ForumDetailModalProps) {
  const { forum, isLoading } = useForumDetail(forumId);
  const [comment, setComment] = useState("");

  const handleSubmitComment = () => {
    if (!comment.trim()) return;
    // Lógica de envío de comentario
    setComment("");
  };

  if (isLoading) {
    return (
      <div className={styles.forumModal} onClick={onClose}>
        <div className={styles.forumModalContent} onClick={(e) => e.stopPropagation()}>
          <div className="p-6 space-y-4">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-64 w-full rounded-xl" />
            <Skeleton className="h-20 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!forum) return null;

  return (
    <div className={styles.forumModal} onClick={onClose}>
      <div className={styles.forumModalContent} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.forumModalHeader}>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-primary-contrast mb-2">
                {forum.title}
              </h2>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={forum.authorAvatar} alt={forum.author} />
                    <AvatarFallback className="bg-neutral-200 text-neutral-600 text-xs font-bold">
                      {forum.author.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="font-medium text-primary-contrast">{forum.author}</span>
                  <Badge 
                    className={forum.authorRole === "docente" ? styles.roleBadgeTeacher : styles.roleBadgeStudent}
                  >
                    {forum.authorRole === "docente" ? "Docente" : "Estudiante"}
                  </Badge>
                </div>
                <span>•</span>
                <span>{forum.createdAt}</span>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Body */}
        <div className={styles.forumModalBody}>
          {/* Imagen */}
          {forum.image && (
            <div className={styles.forumModalImage}>
              <img src={forum.image} alt={forum.title} className="w-full h-auto" />
            </div>
          )}

          {/* Pregunta */}
          <p className={styles.forumModalQuestion}>{forum.question}</p>

          {/* Tags */}
          {forum.tags.length > 0 && (
            <div className={styles.forumTags}>
              {forum.tags.map(tag => (
                <span key={tag} className={styles.forumTag}>{tag}</span>
              ))}
            </div>
          )}

          {/* Stats */}
          <div className="flex items-center gap-6 py-4 border-y border-neutral-200">
            <button className={`${styles.forumStat} ${forum.isLiked ? styles.forumStatActive : ""}`}>
              <Heart className={`h-5 w-5 ${forum.isLiked ? "fill-current" : ""}`} />
              <span>{forum.likes} Me gusta</span>
            </button>
            <div className={styles.forumStat}>
              <MessageCircle className="h-5 w-5" />
              <span>{forum.comments.length} Comentarios</span>
            </div>
          </div>

          {/* Comentarios */}
          <div className={styles.forumComments}>
            <h3 className={styles.forumCommentTitle}>
              <MessageCircle className="h-5 w-5" />
              Respuestas
            </h3>
            {forum.comments.map(comment => (
              <div key={comment.id} className={styles.forumComment}>
                <div className={styles.forumCommentHeader}>
                  <Avatar className={styles.forumCommentAvatar}>
                    <AvatarImage src={comment.authorAvatar} alt={comment.author} />
                    <AvatarFallback className="bg-neutral-200 text-neutral-600 text-xs font-bold">
                      {comment.author.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className={styles.forumCommentAuthor}>{comment.author}</span>
                      <Badge 
                        className={comment.authorRole === "docente" ? styles.roleBadgeTeacher : styles.roleBadgeStudent}
                      >
                        {comment.authorRole === "docente" ? "Docente" : "Estudiante"}
                      </Badge>
                    </div>
                    <span className={styles.forumCommentTime}>{comment.createdAt}</span>
                  </div>
                </div>
                <p className={styles.forumCommentContent}>{comment.content}</p>
                <div className={styles.forumCommentActions}>
                  <button className="hover:text-brand-action transition-colors">
                    <Heart className="h-3 w-3 inline mr-1" />
                    {comment.likes}
                  </button>
                  <button className="hover:text-brand-action transition-colors">
                    Responder
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Input de Comentario */}
        <div className={styles.forumCommentInput}>
          <Input 
            placeholder="Escribe tu respuesta..." 
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSubmitComment()}
            className="flex-1"
          />
          <Button 
            onClick={handleSubmitComment}
            disabled={!comment.trim()}
            className="bg-brand-action hover:bg-brand-action/90"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}