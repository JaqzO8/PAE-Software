const jwt = require('jsonwebtoken');
const config = require('../config/env');

const verifyToken = (req, res, next) => {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

    if (!token) {
        return res.status(401).json({ success: false, message: 'Token no proporcionado' });
    }

    try {
        req.user = jwt.verify(token, config.JWT_SECRET);
        return next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: error.name === 'TokenExpiredError' ? 'Token expirado' : 'Token invalido',
        });
    }
};

const requireTeacher = (req, res, next) => {
    if (!['docente', 'admin'].includes(req.user?.rol)) {
        return res.status(403).json({
            success: false,
            message: 'Se requieren permisos de docente',
        });
    }

    return next();
};

module.exports = { verifyToken, requireTeacher };
