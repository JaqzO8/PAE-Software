const { startOutboxWorker } = require('../../application/outboxWorker');

afterEach(() => jest.useRealTimers());

test('worker publishes immediately and never overlaps an unfinished delivery', async () => {
    jest.useFakeTimers();
    let finish;
    const publishBatch = jest.fn(() => new Promise(resolve => { finish = resolve; }));
    const stop = startOutboxWorker({ publisher: { publishBatch }, intervalMs: 1000 });
    expect(publishBatch).toHaveBeenCalledTimes(1);
    await jest.advanceTimersByTimeAsync(3000);
    expect(publishBatch).toHaveBeenCalledTimes(1);
    finish();
    await jest.advanceTimersByTimeAsync(1000);
    expect(publishBatch).toHaveBeenCalledTimes(2);
    finish(); stop();
    await jest.advanceTimersByTimeAsync(5000);
    expect(publishBatch).toHaveBeenCalledTimes(2);
});

test('worker reports failure and retries on the following tick', async () => {
    jest.useFakeTimers();
    const error = new Error('transport unavailable');
    const publishBatch = jest.fn().mockRejectedValueOnce(error).mockResolvedValueOnce(undefined);
    const logger = { error: jest.fn() };
    const stop = startOutboxWorker({ publisher: { publishBatch }, intervalMs: 1, logger });
    await jest.advanceTimersByTimeAsync(1000);
    expect(logger.error).toHaveBeenCalledWith('Error publicando Outbox', error);
    expect(publishBatch).toHaveBeenCalledTimes(2);
    stop();
});

test('worker rejects missing publisher instead of simulating delivery', () => {
    expect(() => startOutboxWorker({ publisher: {} })).toThrow(TypeError);
});
