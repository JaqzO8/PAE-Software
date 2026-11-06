function startOutboxWorker({ publisher, intervalMs = 5000, logger = console }) {
    if (!publisher?.publishBatch) throw new TypeError('publisher.publishBatch es requerido');
    let running = false;
    const tick = async () => {
        if (running) return;
        running = true;
        try { await publisher.publishBatch(); }
        catch (error) { logger.error?.('Error publicando Outbox', error); }
        finally { running = false; }
    };
    const timer = setInterval(tick, Math.max(1000, Number(intervalMs) || 5000));
    timer.unref?.();
    void tick();
    return () => clearInterval(timer);
}

module.exports = { startOutboxWorker };
