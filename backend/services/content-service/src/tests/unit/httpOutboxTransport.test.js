const { createHttpOutboxTransport } = require('../../infrastructure/httpOutboxTransport');

test('httpOutboxTransport: publica envelope contractual sin perder correlación', async () => {
    const calls = [];
    const transport = createHttpOutboxTransport({
        url: 'http://notifications.test/events',
        fetchImpl: async (...args) => { calls.push(args); return { ok: true, status: 202 }; },
    });
    await transport.publish({
        event_id: 'evt', event_type: 'RecursoPublicado.v1', schema_version: 1,
        producer: 'content', occurred_at: '2026-10-25T12:00:00.000Z',
        payload: { correlationId: 'corr', resourceId: '7', repositoryId: '3' },
    });
    const body = JSON.parse(calls[0][1].body);
    expect(body).toEqual(expect.objectContaining({ eventId: 'evt', type: 'RecursoPublicado.v1', schemaVersion: 1, correlationId: 'corr' }));
    expect(body.data).toEqual({ resourceId: '7', repositoryId: '3' });
});
