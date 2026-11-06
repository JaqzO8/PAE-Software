const TokenService = require('../services/tokenService');
const { Usuario, Rol, Sesion } = require('../models');
const { createHash } = require('node:crypto');

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

        const { valid, decoded, error, status } = await TokenService.verifyToken(token);

        if (!valid) {
            return res.status(status || 401).json({
                success: false,
                message: error || 'Token inválido',
            });
        }

        const user = await Usuario.findByPk(decoded.id, { include: [{ model: Rol, as: 'rol' }] });
        const fingerprint = createHash('sha256').update(token).digest('hex');
        const session = await Sesion.findOne({ where: { id_usuario: decoded.id, token_sesion: fingerprint, activa: true } });
        if (!user?.activo || !session) return res.status(401).json({ success: false, message: 'La sesión ya no está activa' });
        req.user = { ...decoded, rol: user.rol.nombre_rol };
        req.token = token;
        next();
    } catch (error) {
        console.error('Session verification unavailable', { name: error.name });
        return res.status(503).json({
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
