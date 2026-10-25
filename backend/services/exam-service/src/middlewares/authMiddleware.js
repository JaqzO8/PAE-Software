const jwt = require('jsonwebtoken');
const config = require('../config/env');

const localRevocationCache = new Set();

const verifyToken = (req, res, next) => {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;

    if (!token) {
        return res.status(401).json({ success: false, message: 'Token no proporcionado' });
    }

    if (localRevocationCache.has(token)) {
        return res.status(401).json({ success: false, message: 'Token revocado o sesión cerrada' });
    }

    try {
        const decoded = jwt.verify(token, config.JWT_SECRET);
        if (decoded.scope === 'mfa_challenge') {
            return res.status(401).json({ success: false, message: 'Token de alcance restringido: se requiere verificación MFA' });
        }
        req.user = decoded;
        req.token = token;
        return next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: error.name === 'TokenExpiredError' ? 'Token expirado' : 'Token invalido',
        });
    }
};

const isTeacher = (req, res, next) => {
    if (req.user?.rol !== 'docente' && req.user?.rol !== 'admin') {
        return res.status(403).json({ success: false, message: 'Se requieren permisos de docente' });
    }

    return next();
};

module.exports = {
    verifyToken,
    isTeacher,
    localRevocationCache,
};
