// Identity owns signature validation, MFA completion, revocation and current roles.
async function authenticate(req, res, next) {
    const authorization = req.headers.authorization;
    if (typeof authorization !== 'string' || !/^Bearer \S+$/.test(authorization)) {
        return res.status(401).json({ success: false, message: 'Autenticación requerida' });
    }
    try {
        const endpoint = new URL('/api/auth/verify', process.env.AUTH_SERVICE_URL);
        const localDevelopment = ['development', 'test'].includes(process.env.NODE_ENV);
        if (endpoint.protocol !== 'https:' && !(localDevelopment && endpoint.protocol === 'http:')) {
            throw new Error('Identity transport requires HTTPS outside development and tests');
        }
        const response = await fetch(endpoint, {
            headers: { Authorization: authorization }, signal: AbortSignal.timeout(2500),
        });
        if (!response.ok) return res.status(response.status >= 500 ? 503 : 401).json({ success: false, message: 'Sesión no disponible' });
        const data = await response.json();
        if (data.valid !== true || !data.user?.activo || !Number.isSafeInteger(Number(data.user.id)) || Number(data.user.id) <= 0) {
            return res.status(401).json({ success: false, message: 'Sesión inválida' });
        }
        req.user = { id: Number(data.user.id), rol: data.user.rol };
        return next();
    } catch {
        return res.status(503).json({ success: false, message: 'Servicio de identidad no disponible' });
    }
}

module.exports = { authenticate };
