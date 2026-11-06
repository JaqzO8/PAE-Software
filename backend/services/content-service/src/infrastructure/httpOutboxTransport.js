function createHttpOutboxTransport({ url, fetchImpl = globalThis.fetch }) {
    if (!url || typeof fetchImpl !== 'function') throw new TypeError('url y fetch son requeridos');
    return {
        async publish(event) {
            const payload = event.payload || {};
            const { correlationId, ...data } = payload;
            const response = await fetchImpl(url, {
                method: 'POST',
                headers: { 'content-type': 'application/json', 'x-event-id': event.event_id },
                body: JSON.stringify({
                    eventId: event.event_id,
                    type: event.event_type,
                    schemaVersion: Number(event.schema_version),
                    producer: event.producer,
                    occurredAt: new Date(event.occurred_at).toISOString(),
                    correlationId,
                    data,
                }),
            });
            if (!response.ok) throw new Error(`Outbox transport respondió HTTP ${response.status}`);
        },
    };
}

module.exports = { createHttpOutboxTransport };
