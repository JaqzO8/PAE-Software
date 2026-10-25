import { useEffect, useState } from "react";
import { Button } from "../../../desingSystem/primitives";
import { invitationsService, invitationError, type CommunityInvitation } from "../../community/services/invitationsService";

interface CommunityInvitationsProps {
  readonly onAccepted: () => void;
}

export function CommunityInvitations({ onAccepted }: CommunityInvitationsProps) {
  const [invitations, setInvitations] = useState<CommunityInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [reload, setReload] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    invitationsService.list(controller.signal)
      .then(setInvitations)
      .catch((cause: unknown) => { if (!controller.signal.aborted) setError(invitationError(cause)); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [reload]);
  const respond = async (id: number, action: "accept" | "reject") => {
    setPending(id); setError(""); setNotice("");
    try {
      await invitationsService.respond(id, action);
      setInvitations(current => current.filter(item => item.id_invitacion !== id));
      setNotice(action === "accept" ? "Invitación aceptada. Ya puedes entrar a la comunidad." : "Invitación rechazada.");
      if (action === "accept") onAccepted();
    } catch (cause) { setError(invitationError(cause)); }
    finally { setPending(null); }
  };
  return (
    <section aria-labelledby="community-invitations-title" className="rounded-xl border border-neutral-200 p-5 space-y-3">
      <h2 id="community-invitations-title" className="text-xl font-semibold">Invitaciones a comunidades</h2>
      {loading && <output className="block">Cargando invitaciones…</output>}
      {error && <div role="alert"><p>{error}</p><Button variant="outline" onClick={() => { setError(""); setLoading(true); setReload(value => value + 1); }}>Actualizar invitaciones</Button></div>}
      {notice && <output className="block">{notice}</output>}
      {!loading && !error && invitations.length === 0 && <p className="text-muted-foreground">No tienes invitaciones pendientes.</p>}
      <ul className="space-y-3">
        {invitations.map(invitation => (
          <li key={invitation.id_invitacion} className="flex flex-wrap items-center justify-between gap-3 border-t pt-3">
            <div><p className="font-medium">{invitation.comunidad.nombre}</p><p className="text-sm text-muted-foreground">Vence el {new Date(invitation.expires_at).toLocaleString("es-PE")}</p></div>
            <div className="flex gap-2">
              <Button disabled={pending !== null} onClick={() => void respond(invitation.id_invitacion, "accept")}>{pending === invitation.id_invitacion ? "Procesando…" : "Aceptar"}</Button>
              <Button variant="outline" disabled={pending !== null} onClick={() => void respond(invitation.id_invitacion, "reject")}>Rechazar</Button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
