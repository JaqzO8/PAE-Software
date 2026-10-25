const jwt = require('jsonwebtoken');
const config = require('../config/env');

const extractToken = (authHeader) => {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return null;
    }

    return authHeader.substring(7);
};

// Cache en memoria para tokens revocados localmente con TTL corto (RIC-11)
const localRevocationCache = new Set();

const verifyToken = async (req, res, next) => {
    const token = extractToken(req.headers.authorization);

    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Token no proporcionado',
        });
    }

    if (localRevocationCache.has(token)) {
        return res.status(401).json({
            success: false,
            message: 'Token revocado o sesión cerrada',
        });
    }

    try {
        const decoded = jwt.verify(token, config.JWT_SECRET);

        // Tokens de alcance restringido no tienen acceso a recursos de contenido
        if (decoded.scope === 'mfa_challenge') {
            return res.status(401).json({
                success: false,
                message: 'Token de alcance restringido: se requiere verificación MFA',
            });
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
    localRevocationCache,
};
