import { Link } from "react-router-dom";
import { Plus, FolderOpen } from "lucide-react";
import { Button } from "../../../desingSystem/primitives";
import { RepositoryList } from "../../../features/repository/components/RepositoryList";
import { useMyRepositories } from "../../../features/repository/hooks/useMyRepositories";
import styles from "../../../features/repository/components/repository.module.css";

const TeacherRepoList = () => {
  // Usamos el hook de "Mis Repos" (trae los propios + delete)
  const { repos, isLoading, remove } = useMyRepositories();

  return (
    <div className={styles.pageContainer}>
      <div className={styles.headerSection}>
        <div>
          <h1 className="text-3xl font-bold text-primary-contrast flex items-center gap-2">
            <FolderOpen className="h-8 w-8 text-brand-action" />
            Mis Repositorios
          </h1>
          <p className="text-muted-foreground">Administra tu contenido educativo.</p>
        </div>
        <Link to="/docente/crear-repositorio">
          <Button className="gap-2 bg-brand-action hover:bg-brand-action/90">
            <Plus className="h-4 w-4" /> Nuevo
          </Button>
        </Link>
      </div>

      {/* ✅ Modo "manage": Activa botones de editar/eliminar */}
      <RepositoryList 
        isLoading={isLoading} 
        repositories={repos} 
        variant="manage" 
        onDelete={remove} 
      />
    </div>
  );
};

export default TeacherRepoList;