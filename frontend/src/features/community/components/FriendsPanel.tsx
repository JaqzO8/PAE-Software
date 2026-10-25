import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Button, Input } from '../../../desingSystem/primitives';
import { collaborationService as service, type Friendship } from '../services/collaborationService';
import { invitationError, type PublicStudent } from '../services/invitationsService';

interface FriendsPanelProps {
  readonly userId: string;
}

function getRelationshipStatus(estado: string, direction: string): string {
  if (estado === 'aceptada') return 'Amigos';
  return direction === 'incoming' ? 'Solicitud recibida' : 'Solicitud enviada';
}

function getAvailableActions(estado: string, direction: string): readonly ('remove' | 'accept' | 'reject' | 'cancel')[] {
  if (estado === 'aceptada') return ['remove'] as const;
  if (direction === 'incoming') return ['accept', 'reject'] as const;
  return ['cancel'] as const;
}

export function FriendsPanel({ userId }: FriendsPanelProps) {
  const [items, setItems] = useState<Friendship[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [users, setUsers] = useState<PublicStudent[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const load = useCallback(async (before?: string, signal?: AbortSignal) => {
    try {
      const data = await service.friends(before, signal);
      if (signal?.aborted) return;
      setItems(current => before ? [...current, ...data.friends, ...data.requests] : [...data.friends, ...data.requests]); setCursor(data.nextCursor);
    } catch (cause) { if (!signal?.aborted) setError(invitationError(cause)); }
  }, []);
  useEffect(() => { const controller = new AbortController(); void load(undefined, controller.signal); return () => controller.abort(); }, [load]);
  const search = async (event: FormEvent) => {
    event.preventDefault(); setBusy(true); setError(''); setUsers([]); setNotice('');
    try { const result = (await service.search(query)).filter(user => String(user.id) !== userId); setUsers(result); if (!result.length) setNotice('No se encontraron otros usuarios.'); }
    catch (cause) { setError(invitationError(cause)); } finally { setBusy(false); }
  };
  const act = async (work: () => Promise<void>, message: string) => {
    if (busy) return;
    setBusy(true); setError(''); setNotice('');
    try { await work(); setNotice(message); await load(); }
    catch (cause) { setError(invitationError(cause)); } finally { setBusy(false); }
  };
  return <section className="rounded-xl border p-5 space-y-4" aria-labelledby="friends-title">
    <h2 id="friends-title" className="text-xl font-semibold">Amigos y solicitudes</h2>
    <p>Una solicitud se convierte en amistad cuando el destinatario la acepta.</p>
    <form onSubmit={event => void search(event)} className="flex flex-wrap gap-2 items-end">
      <div className="flex-1"><label htmlFor="friend-search">Nombre o identificador</label><Input id="friend-search" value={query} onChange={event => setQuery(event.target.value)} minLength={2} maxLength={100} required /></div>
      <Button disabled={busy}>Buscar personas</Button>
    </form>
    {error && <p role="alert">{error}</p>}{notice && <output className="block">{notice}</output>}
    <ul>{users.map(user => <li key={user.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
      <span>{user.nombres} {user.apellidos} ({user.identificador_unico})</span>
      <Button variant="outline" disabled={busy} onClick={() => void act(() => service.requestFriend(user.id), 'Solicitud enviada.')}>Solicitar amistad</Button>
    </li>)}</ul>
    <Button variant="outline" disabled={busy} onClick={() => void load()}>Actualizar solicitudes</Button>
    {!items.length && <p>Aún no tienes amistades ni solicitudes pendientes.</p>}
    <ul className="space-y-3">{items.map(item => <li key={item.id_amistad} className="rounded-lg border p-3 flex flex-wrap justify-between gap-2">
      <span>{item.peer.nombres} {item.peer.apellidos} · {getRelationshipStatus(item.estado, item.direction)}</span>
      <div className="flex gap-2 flex-wrap">{getAvailableActions(item.estado, item.direction).map(action =>
        <Button key={action} variant="outline" disabled={busy} onClick={() => void act(() => service.respondFriend(item.id_amistad, action), 'Relación actualizada.')}>{{ remove: 'Eliminar amistad', accept: 'Aceptar solicitud', reject: 'Rechazar solicitud', cancel: 'Cancelar solicitud' }[action]}</Button>)}</div>
    </li>)}</ul>
    {cursor && <Button variant="outline" disabled={busy} onClick={() => void load(cursor)}>Ver más relaciones</Button>}
  </section>;
}
