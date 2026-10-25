const express = require('express');

function createApp({ checkReady } = {}) {
    const app = express();
    app.disable('x-powered-by');
    app.get('/health', (req, res) => res.json({ service: 'learning-service', status: 'alive', mode: 'pilot' }));
    app.get('/ready', async (req, res) => {
        try {
            if (!checkReady) throw new Error('Persistence not configured');
            await checkReady();
            res.json({ service: 'learning-service', status: 'ready', mode: 'pilot' });
        } catch {
            res.status(503).json({ service: 'learning-service', status: 'not-ready' });
        }
    });
    // No public award endpoint: only an authenticated future event transport may call the consumer.
    app.use((req, res) => res.status(404).json({ success: false, message: 'Ruta no encontrada' }));
    return app;
}
module.exports = { createApp };
