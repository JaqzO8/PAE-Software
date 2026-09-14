const jwt = require('jsonwebtoken');
const config = require('../config/env');

const verifyToken = (req, res, next) => {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;

    if (!token) {
        return res.status(401).json({ success: false, message: 'Token no proporcionado' });
    }

    try {
        req.user = jwt.verify(token, config.JWT_SECRET);
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
};
