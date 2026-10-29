const jwt = require('jsonwebtoken');
const config = require('../config/env');

async function verifySession(token) {
    let decoded;
    try { decoded = jwt.verify(token, config.JWT_SECRET, { algorithms: ['HS256'] }); }
    catch { throw Object.assign(new Error('Token inválido o expirado'), { status: 401 }); }
    if (decoded.scope === 'mfa_challenge') throw Object.assign(new Error('Se requiere completar MFA'), { status: 401 });
    let response;
    try {
        const endpoint = new URL('/api/auth/verify', process.env.AUTH_SERVICE_URL);
        const localDevelopment = ['development', 'test'].includes(process.env.NODE_ENV);
        if (endpoint.protocol !== 'https:' && !(localDevelopment && endpoint.protocol === 'http:')) {
            throw new Error('Identity transport requires HTTPS outside development and tests');
        }
        response = await fetch(endpoint, {
            headers: { Authorization: 'Bearer ' + token }, signal: AbortSignal.timeout(2500),
        });
    } catch { throw Object.assign(new Error('No se pudo verificar la sesión'), { status: 503 }); }
    if (!response.ok) throw Object.assign(new Error('La sesión no está disponible'), { status: response.status >= 500 ? 503 : 401 });
    const data = await response.json();
    if (data.valid !== true || !data.user?.activo || String(data.user.id) !== String(decoded.id)) throw Object.assign(new Error('La sesión ya no está activa'), { status: 401 });
    return { ...decoded, rol: data.user.rol, nombres: data.user.nombres, apellidos: data.user.apellidos };
}

const verifyToken = async (req, res, next) => {
    const header = req.headers.authorization;
    if (typeof header !== 'string' || !header.startsWith('Bearer ')) return res.status(401).json({ success: false, message: 'Token no proporcionado' });
    try {
        req.token = header.slice(7);
        req.user = await verifySession(req.token);
        return next();
    } catch (error) { return res.status(error.status || 503).json({ success: false, message: error.status ? error.message : 'Servicio de identidad no disponible' }); }
};

const isAuthenticated = (req, res, next) => {
    if (!req.user?.id) {
        return res.status(401).json({
            success: false,
            message: 'Usuario no autenticado',
        });
    }

    return next();
};

const isTeacher = (req, res, next) => {
    const role = req.user?.rol;

    if (role !== 'docente' && role !== 'admin') {
        return res.status(403).json({
            success: false,
            message: 'Se requieren permisos de docente',
        });
    }

    return next();
};

module.exports = {
    verifyToken,
    isAuthenticated,
    isTeacher,
    verifySession,
};
