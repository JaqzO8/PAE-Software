// src/pages/student/groups/Forums.tsx
import { useState } from "react";
import { MessageSquare, Search, Filter, Plus } from "lucide-react";
import { Input, Button, Skeleton, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../desingSystem/primitives";
import { ForumCard } from "../components/ForumCard";
import { ForumDetailModal } from "../components/ForumDetailModal";
import { useForums } from "../hooks/useForums";
import styles from "../components/forums.module.css";

const forumSkeletonIds = Array.from(
  { length: 6 },
  (_, index) => `forum-skeleton-${index + 1}`,
);

const ForumsPage = () => {
  const { forums, isLoading, toggleLike, report } = useForums(false); // false = todos los foros
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedForumId, setSelectedForumId] = useState<string | null>(null);
  const [filterBy, setFilterBy] = useState<"all" | "resolved" | "unresolved">("all");
  const [sortBy, setSortBy] = useState<"recent" | "popular">("recent");

  // Filtrado avanzado
  const filteredForums = forums
    .filter(forum => {
      const matchesSearch = forum.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        forum.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        forum.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
      
      return matchesSearch;
    })
    .sort((a, b) => {
      if (sortBy === "popular") {
        return b.likes - a.likes;
      }
      return b.id.localeCompare(a.id);
    });

  const handleReport = (forumId: string) => {
    const reason = prompt("¿Por qué deseas reportar este foro?");
    if (reason) {
      report(forumId, reason);
    }
  };

  const handleCreateForum = () => {
    alert("Función de crear foro próximamente");
  };

  const renderForumList = () => {
    if (isLoading) {
      return (
        <div className={styles.forumsGrid}>
          {forumSkeletonIds.map((skeletonId) => (
            <Skeleton key={skeletonId} className="h-96 w-full rounded-xl" />
          ))}
        </div>
      );
    }

    if (filteredForums.length === 0) {
      const emptyMessage = searchQuery
        ? "Intenta con otros términos de búsqueda"
        : "Sé el primero en hacer una pregunta";

      return (
        <div className="text-center py-16 text-muted-foreground border-2 border-dashed border-neutral-200 rounded-xl bg-neutral-50/50">
          <MessageSquare className="h-12 w-12 mx-auto mb-4 text-neutral-300" />
          <p className="text-lg font-medium">No se encontraron foros</p>
          <p className="text-sm mt-2">{emptyMessage}</p>
          <Button
            className="mt-6 gap-2 bg-brand-action hover:bg-brand-action/90"
            onClick={handleCreateForum}
          >
            <Plus className="h-4 w-4" />
            Crear Primer Foro
          </Button>
        </div>
      );
    }

    return (
      <div className={styles.forumsGrid}>
        {filteredForums.map((forum) => (
          <ForumCard
            key={forum.id}
            forum={forum}
            onLike={toggleLike}
            onReport={handleReport}
            onClick={setSelectedForumId}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-brand-action/10 rounded-xl">
              <MessageSquare className="h-6 w-6 text-brand-action" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-primary-contrast">Foros Públicos</h1>
              <p className="text-muted-foreground">
                Pregunta, aprende y colabora con otros estudiantes.
              </p>
            </div>
          </div>

          {/* Botón de Crear Foro */}
          <Button 
            className="gap-2 bg-brand-action hover:bg-brand-action/90"
            onClick={handleCreateForum}
          >
            <Plus className="h-4 w-4" />
            Nueva Pregunta
          </Button>
        </div>

        {/* Barra de Búsqueda y Filtros */}
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Buscar por tema, pregunta o etiqueta..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Filtro por Estado */}
          <Select
            value={filterBy}
            onValueChange={(value: "all" | "resolved" | "unresolved") => setFilterBy(value)}
          >
            <SelectTrigger className="w-full md:w-[180px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filtrar" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="unresolved">Sin resolver</SelectItem>
              <SelectItem value="resolved">Resueltos</SelectItem>
            </SelectContent>
          </Select>

          {/* Ordenamiento */}
          <Select
            value={sortBy}
            onValueChange={(value: "recent" | "popular") => setSortBy(value)}
          >
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue placeholder="Ordenar" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">Más recientes</SelectItem>
              <SelectItem value="popular">Más populares</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Estadísticas Rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-neutral-200 rounded-xl p-4">
          <p className="text-sm text-muted-foreground mb-1">Total de Foros</p>
          <p className="text-2xl font-bold text-primary-contrast">{forums.length}</p>
        </div>
        <div className="bg-white border border-neutral-200 rounded-xl p-4">
          <p className="text-sm text-muted-foreground mb-1">Tu Participación</p>
          <p className="text-2xl font-bold text-brand-action">
            {forums.filter(f => f.isLiked).length}
          </p>
        </div>
        <div className="bg-white border border-neutral-200 rounded-xl p-4">
          <p className="text-sm text-muted-foreground mb-1">Comentarios Totales</p>
          <p className="text-2xl font-bold text-primary-contrast">
            {forums.reduce((sum, f) => sum + f.comments, 0)}
          </p>
        </div>
      </div>

      {/* Lista de Foros */}
      {renderForumList()}

      {/* Modal de Detalle */}
      {selectedForumId && (
        <ForumDetailModal 
          forumId={selectedForumId}
          onClose={() => setSelectedForumId(null)}
        />
      )}
    </div>
  );
};

export default ForumsPage;
