import { RepositoryList } from "../../../features/repository/components/RepositoryList";
import { useGroupResources } from "../../../features/groups/hooks/useGroupResources";
import { FolderOpen } from "lucide-react";

const GroupResources = () => {
  const { resources, isLoading } = useGroupResources();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-3 bg-brand-action/10 rounded-xl">
          <FolderOpen className="h-6 w-6 text-brand-action" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-primary-contrast">Recursos de mis Grupos</h1>
          <p className="text-muted-foreground">Material compartido en todas tus comunidades.</p>
        </div>
      </div>

      {/* Reutilizamos el componente de lista del Repositorio (¡Modularidad!) */}
      <RepositoryList isLoading={isLoading} repositories={resources} />
    </div>
  );
};

export default GroupResources;