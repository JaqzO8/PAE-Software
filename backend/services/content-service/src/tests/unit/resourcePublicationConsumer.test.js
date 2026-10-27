const { createResourcePublicationConsumer } = require('../../application/resourcePublicationConsumer');

describe('resourcePublicationConsumer', () => {
    test('notifica a la audiencia una sola vez aunque el evento se repita', async () => {
        const processed = new Set();
        const notifications = [];
        const consumer = createResourcePublicationConsumer({
            inbox: {
                hasProcessed: async (id) => processed.has(id),
                markProcessed: async (id) => processed.add(id),
            },
            audience: { studentsForRepository: async () => [11, 12] },
            notifications: { createInternal: async (notification) => notifications.push(notification) },
        });
        const event = {
            eventId: 'evt-1', type: 'RecursoPublicado.v1', schemaVersion: 1,
            producer: 'content', occurredAt: '2026-10-25T12:00:00.000Z', correlationId: 'corr-1',
            data: { resourceId: '7', repositoryId: '3', title: 'Álgebra' },
        };

        await expect(consumer.consume(event)).resolves.toEqual({ status: 'processed', notified: 2 });
        await expect(consumer.consume(event)).resolves.toEqual({ status: 'duplicate' });
        expect(notifications).toHaveLength(2);
        expect(notifications[0].idempotencyKey).toBe('evt-1:11');
    });
});
