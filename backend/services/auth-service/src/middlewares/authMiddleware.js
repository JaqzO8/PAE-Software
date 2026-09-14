const TokenService = require('../services/tokenService');
const { Usuario } = require('../models');

/**
 * Middleware para verificar JWT token
 */
const verifyToken = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        const token = TokenService.extractTokenFromHeader(authHeader);

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Token no proporcionado',
            });
        }

        const { valid, decoded, error } = await TokenService.verifyToken(token);

        if (!valid) {
            return res.status(401).json({
                success: false,
                message: error || 'Token inválido',
            });
        }

        // Adjuntar datos del usuario a la request
        req.user = decoded;
        req.token = token;
        next();
    } catch (error) {
        console.error('Error en verifyToken middleware:', error);
        return res.status(500).json({
            success: false,
            message: 'Error al verificar token',
        });
    }
};

/**
 * Middleware para verificar roles
 */
const verifyRole = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user || !req.user.rol) {
            return res.status(403).json({
                success: false,
                message: 'Acceso denegado',
            });
        }

        if (!allowedRoles.includes(req.user.rol)) {
            return res.status(403).json({
                success: false,
                message: 'No tienes permisos para acceder a este recurso',
            });
        }

        next();
    };
};

module.exports = {
    verifyToken,
    verifyRole,
};