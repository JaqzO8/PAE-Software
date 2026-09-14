import { Users, Clock, Trash2, MoreVertical } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { 
  Button, 
  Avatar, 
  AvatarImage, 
  AvatarFallback,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../../desingSystem/primitives";
import type { Group } from "../services/groupsService";
import styles from "./groups.module.css";

interface GroupCardProps {
  group: Group;
  role?: "docente" | "estudiante";
  onDelete?: (id: string) => void; // Prop opcional para eliminar
}

export function GroupCard({ group, role, onDelete }: GroupCardProps) {
  const navigate = useNavigate();
  
  // Determinar el rol desde localStorage si no se proporciona
  const storedUser = localStorage.getItem("user");
  const storedRole = storedUser ? JSON.parse(storedUser).rol : undefined;
  const userRole = role || (storedRole as "docente" | "estudiante") || "estudiante";

  const handleEnter = () => {
    const basePath = userRole === "docente" ? "/docente" : "/estudiante";
    navigate(`${basePath}/grupos/${group.id}`);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (window.confirm(`¿Estás seguro de eliminar "${group.name}"?`)) {
      onDelete?.(group.id);
    }
  };

  return (
    <div className={styles.groupCard} onClick={handleEnter}>
      <div className={styles.groupHeader}>
        <div className={styles.groupAvatar}>
          <Avatar className="w-full h-full">
            <AvatarImage src={group.avatar} alt={group.name} />
            <AvatarFallback className="bg-brand-action/10 text-brand-action font-bold">
              {group.name.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </div>

        {/* Menú de opciones solo para docentes */}
        {userRole === "docente" && onDelete && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="absolute top-4 right-4"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem 
                className="text-red-600 focus:text-red-600 focus:bg-red-50"
                onClick={handleDelete}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Eliminar Grupo
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
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

      <button 
      className="
        bg-brand-action       
        text-white            
        font-medium           
        w-full                
        py-3                  
        rounded-lg            
        shadow-sm             
        hover:bg-brand-action/90 
        active:scale-95       
        transition-all
      "
      >
        Ingresar al Grupo
      </button>
    </div>
  );
}
