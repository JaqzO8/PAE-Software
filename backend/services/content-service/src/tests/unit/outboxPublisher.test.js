const { createOutboxPublisher } = require('../../application/outboxPublisher');

describe('outboxPublisher', () => {
    test('publica eventos y marca el estado', async () => {
        const repo = {
            claimPendingEvents: jest.fn().mockResolvedValue([{ event_id: 'e1', attempts: 0 }]),
            markEventPublished: jest.fn().mockResolvedValue(undefined),
            markEventFailed: jest.fn(),
        };
        const transport = { publish: jest.fn().mockResolvedValue(undefined) };
        const result = await createOutboxPublisher({ repo, transport }).publishBatch(10);
        expect(result).toEqual([{ eventId: 'e1', status: 'published' }]);
        expect(repo.markEventPublished).toHaveBeenCalled();
    });

    test('reintenta y pasa a fallido al agotar intentos', async () => {
        const repo = {
            claimPendingEvents: jest.fn().mockResolvedValue([{ event_id: 'e2', attempts: 5 }]),
            markEventPublished: jest.fn(),
            markEventFailed: jest.fn().mockResolvedValue(undefined),
        };
        const transport = { publish: jest.fn().mockRejectedValue(new Error('provider down')) };
        const result = await createOutboxPublisher({ repo, transport, maxAttempts: 5 }).publishBatch();
        expect(result[0].status).toBe('failed');
        expect(repo.markEventFailed).toHaveBeenCalledWith('e2', expect.objectContaining({ attempts: 5, status: 'failed' }));
    });
});
