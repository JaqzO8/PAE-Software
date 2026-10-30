const DEFAULT_MAX_ATTEMPTS = 5;

/**
 * Publica eventos pendientes usando puertos de persistencia y transporte.
 * El claim debe ser atómico en el adaptador SQL (SELECT ... FOR UPDATE SKIP LOCKED).
 */
function createOutboxPublisher({ repo, transport, clock = { now: () => new Date() }, maxAttempts = DEFAULT_MAX_ATTEMPTS }) {
    if (!repo || !transport?.publish) throw new TypeError('repo y transport.publish son requeridos');

    return {
        async publishBatch(limit = 50) {
            const claimed = await repo.claimPendingEvents(Math.max(1, Math.min(500, Number(limit) || 50)), clock.now());
            const results = [];
            for (const event of claimed) {
                try {
                    await transport.publish(event);
                    await repo.markEventPublished(event.event_id, clock.now());
                    results.push({ eventId: event.event_id, status: 'published' });
                } catch (error) {
                    // claimPendingEvents incrementa attempts al reservar el evento.
                    const attempts = Math.max(1, Number(event.attempts || 0));
                    const status = attempts >= maxAttempts ? 'failed' : 'pending';
                    await repo.markEventFailed(event.event_id, {
                        status,
                        attempts,
                        error: String(error?.message || error).slice(0, 500),
                    });
                    results.push({ eventId: event.event_id, status, error: String(error?.message || error) });
                }
            }
            return results;
        },
    };
}

module.exports = { createOutboxPublisher, DEFAULT_MAX_ATTEMPTS };
