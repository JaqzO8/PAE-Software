const jwt = require('jsonwebtoken');
const config = require('../config/env');

/**
 * Middleware para verificar JWT token
 * Reutiliza la misma lógica que auth-service
 */
const verifyToken = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: 'Token no proporcionado',
            });
        }

        const token = authHeader.substring(7);

        try {
            const decoded = jwt.verify(token, config.JWT_SECRET);
            
            // Adjuntar datos del usuario a la request
            req.user = decoded;
            req.token = token;
            next();
        } catch (error) {
            if (error.name === 'TokenExpiredError') {
                return res.status(401).json({
                    success: false,
                    message: 'Token expirado',
                });
            }
            return res.status(401).json({
                success: false,
                message: 'Token inválido',
            });
        }
    } catch (error) {
        console.error('Error en verifyToken middleware:', error);
        return res.status(500).json({
            success: false,
            message: 'Error al verificar token',
        });
    }
};

module.exports = {
    verifyToken,
};