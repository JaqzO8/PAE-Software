// src/features/groups/components/StudentGroupList.tsx
import { Users } from "lucide-react";
import { Skeleton } from "../../../desingSystem/primitives";
import { GroupCard } from "./GroupCard";
import { useStudentGroups } from "../hooks/useStudentGroups";
import styles from "./groups.module.css";

export function StudentGroupList() {
  const { groups, isLoading } = useStudentGroups();

  if (isLoading) {
    return (
      <div className={styles.groupsGrid}>
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-64 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <div className="p-3 bg-brand-action/10 rounded-xl">
          <Users className="h-6 w-6 text-brand-action" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-primary-contrast">Mis Comunidades</h1>
          <p className="text-muted-foreground">Participa y colabora con tus compañeros.</p>
        </div>
      </div>

      {groups.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground border-2 border-dashed border-neutral-200 rounded-xl bg-neutral-50/50">
          <Users className="h-12 w-12 mx-auto mb-4 text-neutral-300" />
          <p className="text-lg font-medium">No estás en ninguna comunidad</p>
          <p className="text-sm mt-2">Únete a grupos para comenzar a aprender</p>
        </div>
      ) : (
        <div className={styles.groupsGrid}>
          {groups.map((group) => (
            <GroupCard key={group.id} group={group} />
          ))}
        </div>
      )}
    </div>
  );
}