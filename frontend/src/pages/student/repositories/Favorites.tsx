// src/pages/student/repositories/Favorites.tsx
import { Star } from "lucide-react";
import { RepositoryList } from "../../../features/repository/components/RepositoryList";
import { useFavorites } from "../../../features/repository/hooks/useFavorites";
import styles from "../../../features/repository/components/repository.module.css";

const Favorites = () => {
  const { favorites, isLoading, toggleFavorite } = useFavorites();

  return (
    <div className={styles.pageContainer}>
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-brand-action/10 rounded-xl">
          <Star className="h-6 w-6 text-brand-action fill-brand-action" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-primary-contrast">Mis Favoritos</h1>
          <p className="text-muted-foreground">Recursos que has guardado para estudiar más tarde.</p>
        </div>
      </div>

      <RepositoryList 
        isLoading={isLoading} 
        repositories={favorites}
        variant="view"
        onToggleFavorite={toggleFavorite}
      />
    </div>
  );
};

export default Favorites;