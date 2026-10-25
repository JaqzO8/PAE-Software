import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { isAxiosError } from 'axios';
import { Button, Input } from '../../../desingSystem/primitives';
import { collaborationService as service, type ChatMessage } from '../../community/services/collaborationService';
import { invitationError } from '../../community/services/invitationsService';
import { connectCommunity } from '../../community/services/communityRealtime';

interface CommunityChatProps {
  readonly communityId: string;
  readonly userId: string;
  readonly isOwner: boolean;
}

export function CommunityChat({ communityId, userId, isOwner }: CommunityChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [action, setAction] = useState<{ message: ChatMessage; kind: 'edit' | 'remove' } | null>(null);
  const [value, setValue] = useState('');
  const pending = useRef<{ text: string; id: string } | null>(null);
  const sending = useRef(false);
  const active = useRef(true);
  const initial = useRef(true);
  const [online, setOnline] = useState(false);
  const failure = useCallback((cause: unknown) => {
    if (!active.current) return;
    setError(invitationError(cause));
    if (isAxiosError(cause) && [401, 403, 404].includes(cause.response?.status || 0)) { setMessages([]); setCursor(null); }
  }, []);
  const refresh = useCallback(async (signal?: AbortSignal) => {
    try {
      const page = await service.messages(communityId, undefined, signal);
      if (!active.current || signal?.aborted) return;
      setMessages(current => [...new Map([...current, ...page.messages].map(message => [message.id, message])).values()].sort((a, b) => a.id - b.id));
      if (initial.current) { setCursor(page.nextCursor); initial.current = false; }
      setLoaded(true); setError('');
    } catch (cause) { if (!signal?.aborted) failure(cause); }
  }, [communityId, failure]);
  useEffect(() => {
    active.current = true;
    const controller = new AbortController();
    void refresh(controller.signal);
    const disconnect = connectCommunity(communityId, {
      changed: () => void refresh(controller.signal), status: setOnline,
      revoked: () => { setMessages([]); setCursor(null); setError('El acceso cambió o la sesión terminó. Vuelve a abrir el grupo.'); },
    });
    const timer = window.setInterval(() => { if (!document.hidden) void refresh(controller.signal); }, 5000);
    return () => { active.current = false; controller.abort(); clearInterval(timer); disconnect(); };
  }, [refresh, communityId]);
  const older = async () => {
    if (!cursor || busy) return;
    setBusy(true);
    try {
      const page = await service.messages(communityId, cursor);
      if (!active.current) return;
      setMessages(current => [...new Map([...page.messages, ...current].map(message => [message.id, message])).values()].sort((a, b) => a.id - b.id));
      setCursor(page.nextCursor);
    } catch (cause) { failure(cause); } finally { setBusy(false); }
  };
  const send = async (event: FormEvent) => {
    event.preventDefault();
    if (!text.trim() || sending.current) return;
    sending.current = true; setBusy(true); setError(''); setNotice('');
    if (pending.current?.text !== text.trim()) pending.current = { text: text.trim(), id: crypto.randomUUID() };
    try {
      const message = await service.send(communityId, pending.current.text, pending.current.id);
      if (!active.current) return;
      setMessages(current => [...new Map([...current, message].map(row => [row.id, row])).values()].sort((a, b) => a.id - b.id));
      setText(''); pending.current = null; setNotice('Mensaje guardado.');
    } catch (cause) { failure(cause); } finally { sending.current = false; setBusy(false); }
  };
  const change = async (event: FormEvent) => {
    event.preventDefault();
    if (!action || busy) return;
    setBusy(true); setError('');
    try {
      if (action.kind === 'edit') await service.edit(communityId, action.message, value);
      else await service.remove(communityId, action.message, value);
      setAction(null); await refresh();
    } catch (cause) { failure(cause); } finally { setBusy(false); }
  };
  return <section aria-label="Conversación del grupo" className="space-y-4 p-4">
    <output className="block text-sm">{online ? 'Conversación conectada en tiempo real' : 'Reconectando. Puedes actualizar la conversación y reintentar el envío.'}</output>
    <div className="flex gap-2"><Button variant="outline" onClick={() => void refresh()} disabled={busy}>Actualizar conversación</Button>
      {cursor && <Button variant="outline" onClick={() => void older()} disabled={busy}>Mensajes anteriores</Button>}</div>
    {error && <p role="alert">{error}</p>}
    {notice && <output className="block">{notice}</output>}
    {!loaded && !error && <output className="block">Cargando conversación…</output>}
    {loaded && messages.length === 0 && <p>Escribe el primer mensaje del grupo.</p>}
    <ol className="max-h-[32rem] overflow-auto space-y-3" aria-label="Mensajes">
      {messages.map(message => <li key={message.id} className="rounded-xl border p-3 space-y-2">
        <p className="font-semibold">{message.author} <time className="font-normal text-xs" dateTime={message.timestamp}>{new Date(message.timestamp).toLocaleString('es-PE')}</time></p>
        <p className="whitespace-pre-wrap break-words">{message.content}</p>
        {message.editado && <small>Editado</small>}
        {!message.removed && <div className="flex gap-2">
          {String(message.userId) === userId && <Button variant="ghost" size="sm" disabled={busy} onClick={() => { setAction({ message, kind: 'edit' }); setValue(message.content); }}>Editar mensaje</Button>}
          {(String(message.userId) === userId || isOwner) && <Button variant="ghost" size="sm" disabled={busy} onClick={() => { setAction({ message, kind: 'remove' }); setValue(''); }}>Retirar mensaje</Button>}
        </div>}
      </li>)}
    </ol>
    {action && <form onSubmit={event => void change(event)} className="space-y-2 rounded-lg border p-3">
      <label htmlFor="message-change">{action.kind === 'edit' ? 'Editar texto' : 'Motivo de retirada'}</label>
      <Input id="message-change" value={value} onChange={event => setValue(event.target.value)} maxLength={1000} required={action.kind === 'edit' || String(action.message.userId) !== userId} />
      <Button disabled={busy}>Confirmar {action.kind === 'edit' ? 'edición' : 'retirada'}</Button>{' '}
      <Button type="button" variant="outline" disabled={busy} onClick={() => setAction(null)}>Cancelar</Button>
    </form>}
    <form onSubmit={event => void send(event)} className="flex flex-wrap items-end gap-2">
      <div className="flex-1 min-w-48"><label htmlFor="group-chat-message">Mensaje</label><Input id="group-chat-message" value={text} onChange={event => setText(event.target.value)} disabled={busy} required maxLength={1000} /></div>
      <Button disabled={busy || !text.trim()}>{busy ? 'Guardando…' : 'Enviar mensaje'}</Button>
    </form>
  </section>;
}
