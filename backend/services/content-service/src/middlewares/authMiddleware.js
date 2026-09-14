const jwt = require('jsonwebtoken');
const config = require('../config/env');

const extractToken = (authHeader) => {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return null;
    }

    return authHeader.substring(7);
};

const verifyToken = (req, res, next) => {
    const token = extractToken(req.headers.authorization);

    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Token no proporcionado',
        });
    }

    try {
        const decoded = jwt.verify(token, config.JWT_SECRET);
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
};
