import { useEffect, useRef, useState, type FormEvent } from "react";
import { Button, Input } from "../../../desingSystem/primitives";
import { invitationsService, invitationError, type PublicStudent } from "../../community/services/invitationsService";

export function InviteStudent({ communityId }: { communityId: string }) {
  const [query, setQuery] = useState("");
  const [students, setStudents] = useState<PublicStudent[]>([]);
  const [busy, setBusy] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const request = useRef<AbortController | null>(null);
  useEffect(() => () => request.current?.abort(), []);
  const search = async (event: FormEvent) => {
    event.preventDefault();
    request.current?.abort();
    const controller = new AbortController();
    request.current = controller;
    setBusy(true); setError(""); setNotice(""); setStudents([]);
    try { setStudents(await invitationsService.search(query.trim(), controller.signal)); setSearched(true); }
    catch (cause) { if (!controller.signal.aborted) setError(invitationError(cause)); }
    finally { if (!controller.signal.aborted) setBusy(false); }
  };
  const invite = async (student: PublicStudent) => {
    setBusy(true); setError(""); setNotice("");
    try {
      await invitationsService.send(communityId, student.id);
      setNotice(`Invitación enviada a ${student.nombres} ${student.apellidos}.`);
      setStudents(current => current.filter(item => item.id !== student.id));
    } catch (cause) { setError(invitationError(cause)); }
    finally { setBusy(false); }
  };
  return (
    <section aria-labelledby="invite-student-title" className="rounded-xl border border-neutral-200 p-5 space-y-3">
      <h2 id="invite-student-title" className="font-semibold text-lg">Invitar estudiantes</h2>
      <form onSubmit={event => void search(event)} className="flex flex-wrap gap-2 items-end">
        <div className="flex-1 min-w-48"><label htmlFor="invite-search" className="text-sm">Nombre o identificador del estudiante</label>
          <Input id="invite-search" value={query} onChange={event => setQuery(event.target.value)} minLength={2} maxLength={100} required />
        </div>
        <Button type="submit" disabled={busy || query.trim().length < 2}>{busy ? "Procesando…" : "Buscar estudiantes"}</Button>
      </form>
      {error && <p role="alert">{error}</p>}
      {notice && <p role="status">{notice}</p>}
      {searched && !busy && !notice && !error && students.length === 0 && <p>No se encontraron estudiantes.</p>}
      <ul className="space-y-2">{students.map(student => (
        <li key={student.id} className="flex items-center justify-between gap-3">
          <span>{student.nombres} {student.apellidos} <small>({student.identificador_unico})</small></span>
          <Button variant="outline" disabled={busy} onClick={() => void invite(student)}>Invitar</Button>
        </li>
      ))}</ul>
    </section>
  );
}
