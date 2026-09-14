import { useState } from "react";
import { Globe, Search } from "lucide-react";
import { Input, Skeleton } from "../../../desingSystem/primitives";
import { ExploreGroupCard } from "../../../features/groups/components/ExploreGroupCard";
import { useExploreGroups } from "../../../features/groups/hooks/useExploreGroups";
import styles from "../../../features/groups/components/groups.module.css";

const ExploreGroups = () => {
  const { groups, isLoading, isJoining, requestJoin } = useExploreGroups();
  const [searchQuery, setSearchQuery] = useState("");

  // Filtrar grupos según búsqueda
  const filteredGroups = groups.filter(group =>
    group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    group.subject.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleJoinRequest = (groupId: string) => {
    requestJoin({ groupId });
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-brand-action/10 rounded-xl">
            <Globe className="h-6 w-6 text-brand-action" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-primary-contrast">Explorar Comunidades</h1>
            <p className="text-muted-foreground">Descubre grupos públicos y únete a la conversación.</p>
          </div>
        </div>

        {/* Buscador */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Buscar comunidades..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Loading State */}
      {isLoading ? (
        <div className={styles.groupsGrid}>
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-64 w-full rounded-xl" />
          ))}
        </div>
      ) : filteredGroups.length === 0 ? (
        /* Empty State */
        <div className="text-center py-16 text-muted-foreground border-2 border-dashed border-neutral-200 rounded-xl bg-neutral-50/50">
          <Globe className="h-12 w-12 mx-auto mb-4 text-neutral-300" />
          <p className="text-lg font-medium">No se encontraron comunidades</p>
          <p className="text-sm mt-2">Intenta con otros términos de búsqueda</p>
        </div>
      ) : (
        /* Grid de Grupos */
        <div className={styles.groupsGrid}>
          {filteredGroups.map((group) => (
            <ExploreGroupCard 
              key={group.id} 
              group={group}
              onJoinRequest={handleJoinRequest}
              isJoining={isJoining}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default ExploreGroups;