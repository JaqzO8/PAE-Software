import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Button, Input } from '../../../desingSystem/primitives';
import { InviteStudent } from './InviteStudent';
import { collaborationService as service, type InvitationRecord } from '../../community/services/collaborationService';
import { invitationError } from '../../community/services/invitationsService';
import { communityService } from '../../community/services/communityService';
import type { GroupParticipant } from '../services/groupsService';

export function CommunityOwnerTools({ communityId, ownerId, participants, onChanged, onClosed }: { communityId: string; ownerId: string; participants: GroupParticipant[]; onChanged: () => Promise<void>; onClosed: () => void }) {
  const [items, setItems] = useState<InvitationRecord[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [member, setMember] = useState('');
  const [reason, setReason] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const load = useCallback(async (before?: string, signal?: AbortSignal) => {
    try {
      const page = await service.invitations(communityId, before, signal);
      if (signal?.aborted) return;
      setItems(current => before ? [...current, ...page.invitations] : page.invitations); setCursor(page.nextCursor);
    } catch (cause) { if (!signal?.aborted) setError(invitationError(cause)); }
  }, [communityId]);
  useEffect(() => { const controller = new AbortController(); void load(undefined, controller.signal); return () => controller.abort(); }, [load]);
  const act = async (work: () => Promise<void>) => {
    if (busy) return;
    setBusy(true); setError(''); setNotice('');
    try { await work(); setNotice('Cambio guardado.'); await load(); await onChanged(); }
    catch (cause) { setError(invitationError(cause)); } finally { setBusy(false); }
  };
  const kick = (event: FormEvent) => { event.preventDefault(); void act(async () => { await service.kick(communityId, member, reason); setMember(''); setReason(''); }); };
  return <div className="space-y-4">
    <InviteStudent communityId={communityId} onSent={() => void load()} />
    <details className="border rounded-xl p-4 space-y-4">
      <summary className="cursor-pointer font-semibold">Administrar participantes e invitaciones</summary>
      {error && <p role="alert">{error}</p>}{notice && <p role="status">{notice}</p>}
      <h2 className="font-semibold">Historial de invitaciones</h2>
      <Button variant="outline" disabled={busy} onClick={() => void load()}>Actualizar historial</Button>
      <ul>{items.map(item => <li key={item.id_invitacion} className="flex flex-wrap justify-between gap-2 py-2 border-b">
        <span>Estudiante #{item.estudiante_id} · {item.estado === 'pendiente' && new Date(item.expires_at).getTime() <= Date.now() ? 'expirada' : item.estado} · Enviada {new Date(item.fecha_invitacion).toLocaleString('es-PE')}</span>
        {item.estado === 'pendiente' && <Button disabled={busy} variant="outline" onClick={() => void act(() => service.revokeInvitation(communityId, item.id_invitacion))}>Revocar invitación #{item.id_invitacion}</Button>}
      </li>)}</ul>
      {!items.length && <p>No se han enviado invitaciones.</p>}
      {cursor && <Button disabled={busy} variant="outline" onClick={() => void load(cursor)}>Invitaciones anteriores</Button>}
      <form onSubmit={kick} className="space-y-2">
        <label htmlFor="kick-member">Participante a expulsar</label>
        <select id="kick-member" className="block border rounded p-2 w-full" required value={member} onChange={event => setMember(event.target.value)}>
          <option value="">Seleccionar participante</option>{participants.filter(item => item.id !== ownerId).map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
        </select>
        <label htmlFor="kick-reason">Motivo de expulsión</label><Input id="kick-reason" required maxLength={1000} value={reason} onChange={event => setReason(event.target.value)} />
        <p className="text-sm">La expulsión retira el acceso y bloquea el reingreso a este grupo.</p>
        <Button variant="destructive" disabled={busy || !member || !reason.trim()}>Expulsar participante</Button>
      </form>
      <div className="border-t pt-4 space-y-2">
        <label className="flex gap-2"><input type="checkbox" checked={confirmed} onChange={event => setConfirmed(event.target.checked)} />Confirmo cerrar el grupo y retirar el acceso de sus miembros.</label>
        <Button variant="destructive" disabled={busy || !confirmed} onClick={() => void act(async () => { await communityService.delete(communityId); onClosed(); })}>Cerrar grupo</Button>
      </div>
    </details>
  </div>;
}
