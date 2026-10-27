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
     * Genera un token de desafío MFA de alcance restringido (RIC-06, RIC-AC-02)
     */
    static generateChallengeToken(payload) {
        return jwt.sign(
            { ...payload, scope: 'mfa_challenge', jti: crypto.randomUUID() },
            config.JWT_SECRET,
            { expiresIn: '5m' }
        );
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
    static async verifyToken(token, { allowChallenge = false } = {}) {
        try {
            // Verificar si el token está en la blacklist
            const blacklisted = await isBlacklisted(token);
            if (blacklisted) {
                return { valid: false, error: 'Token revocado' };
            }

            // Verificar el token
            const decoded = jwt.verify(token, config.JWT_SECRET, { algorithms: ['HS256'] });

            // Tokens de desafío MFA no tienen acceso a rutas normales
            if (!allowChallenge && decoded.scope === 'mfa_challenge') {
                return {
                    valid: false,
                    error: 'Token de alcance restringido: debe completar la verificación de dos factores',
                };
            }

            return { valid: true, decoded };
        } catch (error) {
            if (error.name === 'TokenExpiredError') {
                return { valid: false, error: 'Token expirado' };
            }
            if (error.name === 'JsonWebTokenError') {
                return { valid: false, error: 'Token inválido' };
            }
            return { valid: false, error: 'No se pudo verificar la sesión', status: error.status || 503 };
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
