import { Star } from "lucide-react";
import { RepositoryList } from "../../../features/repository/components/RepositoryList";
import { useFavorites } from "../../../features/repository/hooks/useFavorites";
import styles from "../../../features/repository/components/repository.module.css";

const TeacherFavorites = () => {
  // Usamos el hook de favoritos
  const { favorites, isLoading } = useFavorites();

  return (
    <div className={styles.pageContainer}>
      <div className={styles.headerSection}>
        <div>
          <h1 className="text-3xl font-bold text-primary-contrast flex items-center gap-2">
            <Star className="h-8 w-8 text-brand-action fill-brand-action" />
            Mis Favoritos
          </h1>
          <p className="text-muted-foreground">
            Recursos que has guardado para consulta rápida.
          </p>
        </div>
      </div>

      {/* Modo "view" */}
      <RepositoryList isLoading={isLoading} repositories={favorites} variant="view" />
    </div>
  );
};

export default TeacherFavorites;