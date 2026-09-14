import { Globe, Search } from "lucide-react";
import { Input } from "../../../desingSystem/primitives";
import { RepositoryList } from "../../../features/repository/components/RepositoryList";
import { useRepository } from "../../../features/repository/hooks/useRepository";
import styles from "../../../features/repository/components/repository.module.css";

const TeacherExplore = () => {
  // Usamos el hook general (trae los populares)
  const { repositories, isLoading } = useRepository();

  return (
    <div className={styles.pageContainer}>
      <div className={styles.headerSection}>
        <div>
          <h1 className="text-3xl font-bold text-primary-contrast flex items-center gap-2">
            <Globe className="h-8 w-8 text-brand-action" />
            Repositorios Públicos
          </h1>
          <p className="text-muted-foreground">
            Explora recursos compartidos por toda la comunidad.
          </p>
        </div>
        
        <div className={styles.searchContainer}>
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar materia..." className="pl-10" />
        </div>
      </div>

      {/* Modo "view" (por defecto) */}
      <RepositoryList isLoading={isLoading} repositories={repositories} variant="view" />
    </div>
  );
};

export default TeacherExplore;