const { test, mock } = require('node:test');
const assert = require('node:assert/strict');
const { EventEmitter } = require('node:events');
const requestLogger = require('../../backend/services/auth-service/src/middlewares/requestLogger');

test('request diagnostics never copy attacker-controlled log lines or credentials', () => {
    const logger = mock.method(console, 'log', () => {});
    try {
        const response = new EventEmitter();
        response.statusCode = 401;
        const next = mock.fn();
        requestLogger({ method: 'GET\r\nforged-event', path: '/secret-token\nforged-event',
            headers: { authorization: 'Bearer secret-token' } }, response, next);
        assert.equal(next.mock.callCount(), 1);
        assert.equal(logger.mock.callCount(), 0);
        response.emit('finish');
        response.emit('finish');
        assert.equal(logger.mock.callCount(), 1);
        const line = logger.mock.calls[0].arguments[0];
        assert.doesNotMatch(line, /forged-event|secret-token|[\r\n]/);
        const data = JSON.parse(line);
        assert.equal(data.event, 'http_request');
        assert.equal(data.status, 401);
        assert.ok(data.durationMs >= 0);
    } finally { logger.mock.restore(); }
});
