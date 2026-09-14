import { Plus } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Button, Input, Textarea, Checkbox, Skeleton } from "../../../desingSystem/primitives";
import { GroupCard } from "./GroupCard";
import { useTeacherGroups } from "../hooks/useTeacherGroups";
import styles from "./groups.module.css";

export function TeacherGroupList() {
  const { groups, isLoading, createGroup, deleteGroup } = useTeacherGroups();
  const [showForm, setShowForm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    subject: "",
    description: "",
    isPublic: true,
  });

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.name.trim()) return;

    setIsSaving(true);
    try {
      await createGroup({
        name: form.name.trim(),
        subject: form.subject.trim() || undefined,
        description: form.description.trim() || undefined,
        isPublic: form.isPublic,
      });
      setForm({ name: "", subject: "", description: "", isPublic: true });
      setShowForm(false);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className={styles.groupsGrid}>
        <Skeleton className="h-48 w-full rounded-xl" />
        <Skeleton className="h-48 w-full rounded-xl" />
        <Skeleton className="h-48 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-primary-contrast">Mis Grupos de Estudio</h1>
          <p className="text-muted-foreground">Administra tus comunidades y alumnos.</p>
        </div>
        <Button className={styles.createButton} onClick={() => setShowForm((value) => !value)}>
          <Plus className="h-4 w-4" /> Crear Grupo
        </Button>
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="grid gap-4 rounded-lg border border-neutral-200 bg-white p-5 shadow-sm md:grid-cols-2"
        >
          <div className="space-y-2">
            <label className="text-sm font-medium text-neutral-700" htmlFor="community-name">
              Nombre
            </label>
            <Input
              id="community-name"
              value={form.name}
              onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
              placeholder="Comunidad de Algebra"
              maxLength={100}
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-neutral-700" htmlFor="community-subject">
              Materia
            </label>
            <Input
              id="community-subject"
              value={form.subject}
              onChange={(event) => setForm((prev) => ({ ...prev, subject: event.target.value }))}
              placeholder="Matematicas"
              maxLength={100}
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-medium text-neutral-700" htmlFor="community-description">
              Descripcion
            </label>
            <Textarea
              id="community-description"
              value={form.description}
              onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
              placeholder="Espacio para compartir dudas, recursos y avisos."
              rows={3}
            />
          </div>

          <label className="flex items-center gap-3 text-sm text-neutral-700">
            <Checkbox
              checked={form.isPublic}
              onCheckedChange={(checked) => setForm((prev) => ({ ...prev, isPublic: checked === true }))}
            />
            Comunidad publica
          </label>

          <div className="flex justify-end gap-2 md:col-span-2">
            <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSaving || !form.name.trim()}>
              {isSaving ? "Creando..." : "Crear comunidad"}
            </Button>
          </div>
        </form>
      )}

      {groups.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-xl">
          No tienes grupos activos. ¡Crea uno para empezar!
        </div>
      ) : (
        <div className={styles.groupsGrid}>
          {groups.map((group) => (
            <GroupCard 
              key={group.id} 
              group={group} 
              role="docente" 
              onDelete={deleteGroup} 
            />
          ))}
        </div>
      )}
    </div>
  );
}
