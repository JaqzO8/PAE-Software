// src/features/repository/components/RepositoryList.tsx
import { Search } from "lucide-react";
import { Skeleton } from "../../../desingSystem/primitives";
import { RepositoryCard } from "./RepositoryCard";
import type { Repository } from "../services/repositoryService";
import styles from "./repository.module.css";

interface Props {
  isLoading: boolean;
  repositories: Repository[];
  variant?: "view" | "manage";
  onDelete?: (id: string) => void;
  onToggleFavorite?: (id: string) => void;
}

export function RepositoryList({ 
  isLoading, 
  repositories, 
  variant = "view", 
  onDelete,
  onToggleFavorite 
}: Props) {
  
  // 1. Loading State
  if (isLoading) {
    return (
      <div className={styles.gridContainer}>
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  // 2. Empty State
  if (repositories.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center border border-dashed border-neutral-200 rounded-xl bg-neutral-50/50">
        <div className="bg-white p-3 rounded-full mb-3 shadow-sm">
          <Search className="h-6 w-6 text-neutral-400" />
        </div>
        <p className="text-muted-foreground text-sm">
          No se encontraron repositorios en esta sección.
        </p>
      </div>
    );
  }

  // 3. Renderizado de Lista
  return (
    <div className={styles.gridContainer}>
      {repositories.map((repo) => (
        <RepositoryCard 
          key={repo.id} 
          repo={repo} 
          variant={variant}
          onDelete={onDelete}
          onToggleFavorite={onToggleFavorite}
        />
      ))}
    </div>
  );
}