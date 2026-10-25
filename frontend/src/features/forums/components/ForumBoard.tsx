import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { Button, Input } from '../../../desingSystem/primitives';
import { useAuth } from '../../../context/AuthContext';
import { invitationError } from '../../community/services/invitationsService';
import * as forums from '../services/forumsService';

interface ForumBoardProps {
  readonly mine?: boolean;
  readonly groupId?: string;
}

function getForumBoardTitle(groupId?: string | null, mine?: boolean): string {
  if (groupId) return 'Conversaciones del foro del grupo';
  if (mine) return 'Mis publicaciones';
  return 'Foros públicos';
}

function getDetailStateText(removed?: boolean, isResolved?: boolean): string {
  if (removed) return 'Retirada';
  return isResolved ? 'Resuelta' : 'Abierta';
}

export function ForumBoard({ mine = false, groupId }: ForumBoardProps) {
  const { user } = useAuth();
  const [items, setItems] = useState<forums.ForumPost[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [search, setSearch] = useState('');
  const [detail, setDetail] = useState<forums.ForumDetail | null>(null);
  const [reports, setReports] = useState<forums.ForumReport[]>([]);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [moderation, setModeration] = useState(false);
  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [tags, setTags] = useState('');
  const [reply, setReply] = useState('');
  const [reason, setReason] = useState('');
  const [editMode, setEditMode] = useState(false);
  const requestId = useRef<{ text: string; id: string } | null>(null);
  const active = useRef(true);
  const lock = useRef(false);
  const load = useCallback(async (before?: string) => {
    const page = await forums.getForumPage({ mine: mine && !moderation, moderation, groupId, search, before });
    if (active.current) { setItems(current => before ? [...current, ...page.forums] : page.forums); setCursor(page.nextCursor); }
  }, [mine, moderation, groupId, search]);
  useEffect(() => {
    active.current = true; setLoading(true); setError('');
    void load().catch(cause => { if (active.current) setError(invitationError(cause)); }).finally(() => { if (active.current) setLoading(false); });
    return () => { active.current = false; };
  }, [load]);
  const run = async (work: () => Promise<void>) => {
    if (lock.current) return;
    lock.current = true; setBusy(true); setError(''); setNotice('');
    try { await work(); }
    catch (cause) { if (active.current) setError(invitationError(cause)); }
    finally { lock.current = false; if (active.current) setBusy(false); }
  };
  const open = async (id: string, after?: string) => {
    const data = await forums.getForumDetail(id, after);
    setDetail(current => after && current ? { ...data, comments: [...current.comments, ...data.comments] } : data);
    setReports(data.canModerate ? await forums.forumReports(id) : []);
  };
  const create = (event: FormEvent) => {
    event.preventDefault();
    void run(async () => {
      const item = await forums.createForum({ title, question: body, groupId: groupId || '', tags: tags.split(',').map(tag => tag.trim()).filter(Boolean) });
      setCreating(false); setTitle(''); setBody(''); setTags(''); setNotice('Publicación guardada.'); await load(); await open(item.id);
    });
  };
  const respond = (event: FormEvent) => {
    event.preventDefault(); if (!detail) return;
    void run(async () => {
      if (requestId.current?.text !== reply.trim()) requestId.current = { text: reply.trim(), id: crypto.randomUUID() };
      await forums.commentForum(detail.id, requestId.current.text, requestId.current.id);
      requestId.current = null; setReply(''); setNotice('Respuesta guardada.'); await open(detail.id); await load();
    });
  };
  const change = (action: string) => {
    if (!detail) return;
    void run(async () => {
      await forums.updateForum(detail.id, { action, version: detail.version || 1, reason, ...(action === 'edit' ? { title, question: body } : {}) });
      setEditMode(false); setReason(''); setNotice('Publicación actualizada.'); await open(detail.id); await load();
    });
  };
  return <section className="space-y-5" aria-label={groupId ? 'Foros del grupo' : 'Foros públicos'}>
    <div className="flex flex-wrap gap-3 items-center justify-between"><h1 className="text-2xl font-bold">{getForumBoardTitle(groupId, mine)}</h1>
      <Button disabled={busy} onClick={() => { setCreating(!creating); setTitle(''); setBody(''); }}>Nueva publicación</Button></div>
    <p>{groupId ? 'Solo los miembros vigentes pueden leer y participar aquí.' : 'Comparte conocimientos con la comunidad. No publiques información personal ni respuestas de evaluaciones activas.'}</p>
    {error && <p role="alert">{error}</p>}{notice && <output className="block">{notice}</output>}
    {['docente', 'admin'].includes(user?.rol || '') && <label className="flex gap-2"><input type="checkbox" checked={moderation} onChange={event => { setModeration(event.target.checked); setDetail(null); }} />Ver reportes pendientes y publicaciones retiradas que puedo moderar</label>}
    <form onSubmit={event => { event.preventDefault(); setSearch(query); }} className="flex items-end gap-2"><div className="flex-1"><label htmlFor="forum-search">Buscar por título o contenido</label><Input id="forum-search" value={query} maxLength={100} onChange={event => setQuery(event.target.value)} /></div><Button disabled={busy}>Buscar</Button><Button type="button" variant="outline" disabled={busy} onClick={() => void run(() => load())}>Actualizar</Button></form>
    {creating && <form onSubmit={create} className="border rounded-xl p-4 space-y-3">
      <label htmlFor="forum-title">Título</label><Input id="forum-title" value={title} onChange={event => setTitle(event.target.value)} minLength={3} maxLength={160} required />
      <label htmlFor="forum-body">Contenido</label><textarea id="forum-body" className="w-full border rounded p-2" rows={4} value={body} onChange={event => setBody(event.target.value)} minLength={3} maxLength={4000} required />
      <label htmlFor="forum-tags">Etiquetas separadas por comas (hasta cinco)</label><Input id="forum-tags" value={tags} onChange={event => setTags(event.target.value)} maxLength={154} />
      <Button disabled={busy}>Publicar</Button>{' '}<Button type="button" variant="outline" onClick={() => setCreating(false)}>Cancelar</Button>
    </form>}
    {loading ? <output className="block">Cargando publicaciones…</output> : !items.length && <p>No hay publicaciones para esta búsqueda.</p>}
    <ul className="space-y-3">{items.map(item => <li key={item.id} className="border rounded-xl p-4 space-y-2">
      <button className="text-lg font-semibold underline text-left" onClick={() => void run(async () => { setEditMode(false); setReason(''); await open(item.id); })}>{item.title}</button>
      <p className="whitespace-pre-wrap break-words">{item.question.slice(0, 240)}</p><p className="text-sm">{item.author} · {item.createdAt} · {item.comments} respuestas · {item.isResolved ? 'Resuelto' : 'Abierto'}</p>
      <Button variant="outline" disabled={busy || item.removed} aria-pressed={item.isLiked} onClick={() => void run(async () => { await forums.likeForum(item.id, !item.isLiked); await load(); })}>{item.isLiked ? 'Quitar me gusta' : 'Me gusta'} ({item.likes})</Button>
    </li>)}</ul>
    {cursor && <Button disabled={busy} variant="outline" onClick={() => void run(() => load(cursor))}>Más publicaciones</Button>}
    {detail && <article className="border-2 rounded-xl p-5 space-y-4" aria-label="Detalle de la publicación">
      <div className="flex justify-between gap-2"><h2 className="text-xl font-bold">{detail.title}</h2><Button variant="outline" onClick={() => { setDetail(null); setEditMode(false); }}>Cerrar detalle</Button></div>
      <p className="whitespace-pre-wrap break-words">{detail.question}</p>
      <p>{detail.author} · {detail.createdAt} · {getDetailStateText(detail.removed, detail.isResolved)}</p>
      <label htmlFor="forum-reason">Motivo del reporte o de la acción de moderación</label><Input id="forum-reason" value={reason} onChange={event => setReason(event.target.value)} maxLength={1000} />
      <div className="flex flex-wrap gap-2"><Button variant="outline" disabled={busy || reason.trim().length < 3} onClick={() => void run(async () => { await forums.reportForum(detail.id, reason); setReason(''); setNotice('Reporte enviado para revisión.'); })}>Reportar contenido</Button>
        {(detail.canEdit || detail.canModerate) && <>
          {!detail.removed && <Button variant="outline" disabled={busy || reason.trim().length < 3} onClick={() => change(detail.isResolved ? 'reopen' : 'resolve')}>{detail.isResolved ? 'Reabrir' : 'Marcar resuelta'}</Button>}
          {!detail.removed && <Button variant="destructive" disabled={busy || reason.trim().length < 3} onClick={() => change('remove')}>Retirar publicación</Button>}
          {detail.removed && detail.canModerate && <Button disabled={busy || reason.trim().length < 3} onClick={() => change('restore')}>Restituir tras revisión</Button>}
          {detail.canEdit && !detail.removed && <Button variant="outline" disabled={busy} onClick={() => { setTitle(detail.title); setBody(detail.question); setEditMode(!editMode); }}>Editar publicación</Button>}
        </>}
      </div>
      {editMode && <form onSubmit={event => { event.preventDefault(); change('edit'); }} className="space-y-2"><label htmlFor="forum-edit-title">Título corregido</label><Input id="forum-edit-title" value={title} onChange={event => setTitle(event.target.value)} minLength={3} maxLength={160} required /><label htmlFor="forum-edit-body">Contenido corregido</label><textarea id="forum-edit-body" className="w-full border rounded p-2" rows={4} value={body} onChange={event => setBody(event.target.value)} minLength={3} maxLength={4000} required /><Button disabled={busy}>Guardar edición</Button></form>}
      <h3 className="font-semibold">Respuestas</h3><ol className="space-y-2">{detail.comments.map(comment => <li key={comment.id} className="border rounded-lg p-3 space-y-2"><p className="text-sm">{comment.author} · {comment.createdAt}</p><p className="whitespace-pre-wrap break-words">{comment.content}</p>
        {!comment.removed && (comment.authorId === String(user?.id) || detail.canModerate) && <Button variant="outline" disabled={busy || reason.trim().length < 3} onClick={() => void run(async () => { await forums.removeComment(detail.id, comment.id, reason); await open(detail.id); })}>Retirar respuesta con motivo</Button>}
      </li>)}</ol>
      {detail.nextCommentsCursor && <Button variant="outline" disabled={busy} onClick={() => void run(() => open(detail.id, detail.nextCommentsCursor || undefined))}>Más respuestas</Button>}
      {!detail.removed && !detail.isResolved && <form onSubmit={respond} className="space-y-2"><label htmlFor="forum-reply">Tu respuesta</label><textarea id="forum-reply" className="w-full border rounded p-2" rows={3} required maxLength={4000} value={reply} onChange={event => setReply(event.target.value)} /><Button disabled={busy || !reply.trim()}>Responder</Button></form>}
      {detail.canModerate && <section className="space-y-2"><h3 className="font-semibold">Reportes de moderación</h3>{!reports.length && <p>No hay reportes.</p>}{reports.map(report => <div key={report.id} className="border p-3 rounded"><p>{report.reason} · {report.status === 'pending' ? 'Pendiente' : 'Resuelto'}</p>{report.resolution && <p>{report.resolution}</p>}{report.status === 'pending' && <Button disabled={busy || reason.trim().length < 3} onClick={() => void run(async () => { await forums.resolveForumReport(detail.id, report.id, reason); await open(detail.id); })}>Resolver con el motivo indicado</Button>}</div>)}</section>}
    </article>}
  </section>;
}
