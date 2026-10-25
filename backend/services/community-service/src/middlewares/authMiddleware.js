const jwt = require('jsonwebtoken');
const config = require('../config/env');
const { redis } = require('../config/redis');

/**
 * Middleware para verificar JWT token y validar revocación inmediata en Redis (RIC-04, RIC-11, RIC-AC-04)
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
            // Comprobar si el token fue revocado en Redis blacklist
            try {
                const isRevoked = await redis.get(`blacklist:${token}`);
                if (isRevoked) {
                    return res.status(401).json({
                        success: false,
                        message: 'Token revocado o sesión finalizada',
                    });
                }
            } catch {
                // Redis degradado; continuar con validación criptográfica
            }

            const decoded = jwt.verify(token, config.JWT_SECRET);

            // Tokens de desafío MFA no tienen acceso a rutas de la comunidad
            if (decoded.scope === 'mfa_challenge') {
                return res.status(401).json({
                    success: false,
                    message: 'Token de alcance restringido: se requiere verificación MFA previa',
                });
            }

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