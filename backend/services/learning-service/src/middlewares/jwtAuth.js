// Identity owns signature validation, MFA completion, revocation and current roles.
async function authenticate(req, res, next) {
    const authorization = req.headers.authorization;
    if (typeof authorization !== 'string' || !/^Bearer \S+$/.test(authorization)) {
        return res.status(401).json({ success: false, message: 'Autenticación requerida' });
    }
    try {
        const response = await fetch(`${process.env.AUTH_SERVICE_URL || 'http://auth-service:3001'}/api/auth/verify`, {
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
