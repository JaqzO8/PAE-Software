// src/features/repository/components/RepositoryCard.tsx
import { FolderGit2, Trash2, Settings, Star, Eye, Download } from "lucide-react";
import { Card, Button, Badge } from "../../../desingSystem/primitives";
import type { Repository } from "../services/repositoryService";
import { BRAND_CONFIG } from "../../../config/brandConfig";
import styles from "./repository.module.css";
import { useNavigate } from "react-router-dom";

interface Props {
  repo: Repository;
  variant?: "view" | "manage";
  onDelete?: (id: string) => void;
  onToggleFavorite?: (id: string) => void;
}

export function RepositoryCard({ repo, variant = "view", onDelete, onToggleFavorite }: Props) {
  const displayTags = repo.tags.slice(0, 3);
  const navigate = useNavigate();

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleFavorite?.(repo.id);
  };

  const handleViewDetails = () => {
    if (variant === "view") {
      navigate(`/estudiante/repositorios/${repo.id}`);
    }
  };

  const handleManage = () => {
    navigate(`/docente/repositorios/gestionar/${repo.id}`);
  };

  // La URL ya viene procesada del servicio
  const coverUrl = repo.coverImage;

  return (
    <Card className={`${styles.cardHorizontal} group hover:shadow-xl transition-all duration-300`}>
      {/* Imagen de portada a la izquierda */}
      <div className="flex-shrink-0 w-32 h-32 rounded-lg overflow-hidden bg-neutral-100">
        {coverUrl ? (
          <img 
            src={coverUrl} 
            alt={repo.title}
            className="w-full h-full object-cover"
            onError={(e) => {
              console.error("Error cargando imagen:", coverUrl);
              // Fallback si la imagen falla
              const parent = e.currentTarget.parentElement!;
              e.currentTarget.style.display = 'none';
              parent.innerHTML = `
                <div class="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600">
                  <svg class="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              `;
            }}
          />
        ) : (
          <div 
            className="w-full h-full flex items-center justify-center"
            style={{ backgroundColor: `${BRAND_CONFIG.colors.primary}15` }}
          >
            <FolderGit2 
              className="h-12 w-12" 
              style={{ color: BRAND_CONFIG.colors.primary }} 
            />
          </div>
        )}
      </div>

      {/* Contenido Central */}
      <div className={styles.contentContainer}>
        <div className="flex justify-between items-start pr-4">
          <h3 className={styles.cardTitle} title={repo.title}>
            {repo.title}
          </h3>
          
          {/* Botón de Favorito (solo en vista estudiante) */}
          {variant === "view" && onToggleFavorite && (
            <button
              onClick={handleFavoriteClick}
              className="flex-shrink-0 p-2 rounded-lg hover:bg-neutral-100 transition-colors group/fav"
              title={repo.isFavorite ? "Quitar de favoritos" : "Agregar a favoritos"}
            >
              <Star 
                className={`h-5 w-5 transition-all ${
                  repo.isFavorite 
                    ? 'fill-current' 
                    : 'group-hover/fav:scale-110'
                }`}
                style={{ 
                  color: repo.isFavorite 
                    ? BRAND_CONFIG.colors.primary 
                    : '#9CA3AF' 
                }}
              />
            </button>
          )}
        </div>
        
        {/* Descripción corta */}
        {repo.description && (
          <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
            {repo.description}
          </p>
        )}
        
        {/* Tags */}
        {displayTags.length > 0 && (
          <div className={styles.cardTags}>
            {displayTags.map((tag, index) => (
              <span key={tag} className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  {tag}
                </Badge>
                {index < displayTags.length - 1 && (
                  <span className={styles.tagSeparator} />
                )}
              </span>
            ))}
          </div>
        )}

        {/* Meta Info */}
        <div className={styles.cardMeta}>
          {repo.category && (
            <>
              <span className="font-medium text-primary-contrast">{repo.category}</span>
              <span>•</span>
            </>
          )}
          <span>Por {repo.author}</span>
          <span>•</span>
          <span>{repo.updatedAt}</span>
        </div>

        {/* Estadísticas (Solo en modo view) */}
        {variant === "view" && (
          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-1" title="Vistas">
              <Eye className="h-3 w-3" />
              <span>{repo.views}</span>
            </div>
            <div className="flex items-center gap-1" title="Descargas">
              <Download className="h-3 w-3" />
              <span>{repo.downloads}</span>
            </div>
            {repo.rating > 0 && (
              <div className="flex items-center gap-1" title="Calificación">
                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                <span>{repo.rating.toFixed(1)}/10</span>
              </div>
            )}
          </div>
        )}

        {/* Contador de recursos (modo manage) */}
        {variant === "manage" && repo.resourceCount !== undefined && (
          <div className="text-xs text-muted-foreground mt-2">
            {repo.resourceCount} {repo.resourceCount === 1 ? 'recurso' : 'recursos'}
          </div>
        )}
      </div>

      {/* Acciones */}
      <div className={styles.actionContainer}>
        {variant === "manage" ? (
          <>
            <Button 
              size="sm" 
              variant="outline" 
              className="gap-2 text-xs h-9"
              onClick={handleManage}
            >
              <Settings className="h-3 w-3" /> Gestionar
            </Button>
            {onDelete && (
              <Button
                variant="ghost"
                size="icon"
                className={styles.deleteIconButton}
                onClick={() => onDelete(repo.id)}
                title="Eliminar repositorio"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </>
        ) : (
          <Button 
            className={styles.viewButton} 
            size="sm"
            style={{ 
              backgroundColor: BRAND_CONFIG.colors.primary,
            }}
            onClick={handleViewDetails}
          >
            Ingresar
          </Button>
        )}
      </div>
    </Card>
  );
}