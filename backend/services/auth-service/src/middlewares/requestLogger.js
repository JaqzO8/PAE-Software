// Record server-generated diagnostics without copying untrusted request fields.
module.exports = function requestLogger(_req, res, next) {
    const started = performance.now();
    res.once('finish', () => {
        console.log(JSON.stringify({
            event: 'http_request',
            status: res.statusCode,
            durationMs: Math.round(performance.now() - started),
        }));
    });
    next();
};
