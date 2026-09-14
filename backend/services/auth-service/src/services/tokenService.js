const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const config = require('../config/env');
const { addToBlacklist, isBlacklisted } = require('../config/redis');

class TokenService {
    /**
     * Genera un JWT token
     */
    static generateToken(payload) {
        return jwt.sign({ ...payload, jti: crypto.randomUUID() }, config.JWT_SECRET, {
            expiresIn: config.JWT_EXPIRES_IN,
        });
    }

    /**
     * Genera un refresh token
     */
    static generateRefreshToken(payload) {
        return jwt.sign(payload, config.JWT_SECRET, {
            expiresIn: config.JWT_REFRESH_EXPIRES_IN,
        });
    }

    /**
     * Verifica y decodifica un token
     */
    static async verifyToken(token) {
        try {
            // Verificar si el token está en la blacklist
            const blacklisted = await isBlacklisted(token);
            if (blacklisted) {
                throw new Error('Token revocado');
            }

            // Verificar el token
            const decoded = jwt.verify(token, config.JWT_SECRET);
            return { valid: true, decoded };
        } catch (error) {
            if (error.name === 'TokenExpiredError') {
                return { valid: false, error: 'Token expirado' };
            }
            if (error.name === 'JsonWebTokenError') {
                return { valid: false, error: 'Token inválido' };
            }
            return { valid: false, error: error.message };
        }
    }

    /**
     * Revoca un token añadiéndolo a la blacklist
     */
    static async revokeToken(token) {
        try {
            const decoded = jwt.decode(token);
            if (!decoded || !decoded.exp) {
                throw new Error('Token inválido');
            }

            // Calcular tiempo hasta expiración
            const expiresIn = decoded.exp - Math.floor(Date.now() / 1000);
            if (expiresIn > 0) {
                await addToBlacklist(token, expiresIn);
            }

            return true;
        } catch (error) {
            console.error('Error revocando token:', error);
            return false;
        }
    }

    /**
     * Extrae el token del header Authorization
     */
    static extractTokenFromHeader(authHeader) {
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return null;
        }
        return authHeader.substring(7);
    }
}

module.exports = TokenService;
