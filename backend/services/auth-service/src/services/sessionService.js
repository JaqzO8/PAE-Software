const { Sesion, HistorialSesion } = require('../models');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');

const truncate = (value, maxLength) => {
    if (!value) return value;
    return String(value).slice(0, maxLength);
};

const tokenFingerprint = (token) => crypto
    .createHash('sha256')
    .update(String(token || ''))
    .digest('hex');

class SessionService {
    /**
     * Crea una nueva sesión
     */
    static async createSession(userId, deviceInfo, token) {
        try {
            const session = await Sesion.create({
                id_usuario: userId,
                token_sesion: tokenFingerprint(token),
                dispositivo: truncate(deviceInfo.device || 'Desconocido', 100),
                ip_address: truncate(deviceInfo.ip || null, 45),
                user_agent: deviceInfo.userAgent || null,
                fecha_inicio: new Date(),
                fecha_ultimo_acceso: new Date(),
                activa: true,
            });

            // Registrar en historial
            await this.logSessionHistory(userId, deviceInfo, 'login', true);

            return session;
        } catch (error) {
            console.error('Error creando sesión:', error);
            throw error;
        }
    }

    /**
     * Actualiza el último acceso de una sesión
     */
    static async updateLastAccess(token) {
        try {
            await Sesion.update(
                { fecha_ultimo_acceso: new Date() },
                { where: { token_sesion: tokenFingerprint(token), activa: true } }
            );
        } catch (error) {
            console.error('Error actualizando último acceso:', error);
        }
    }

    /**
     * Desactiva una sesión (logout)
     */
    static async deactivateSession(token, deviceInfo) {
        try {
            const session = await Sesion.findOne({
                where: { token_sesion: tokenFingerprint(token), activa: true },
            });

            if (session) {
                await session.update({ activa: false });

                // Registrar en historial
                await this.logSessionHistory(session.id_usuario, deviceInfo, 'logout', true);
            }

            return true;
        } catch (error) {
            console.error('Error desactivando sesión:', error);
            return false;
        }
    }

    /**
     * Desactiva todas las sesiones de un usuario
     */
    static async deactivateAllUserSessions(userId, deviceInfo) {
        try {
            await Sesion.update(
                { activa: false },
                { where: { id_usuario: userId, activa: true } }
            );

            // Registrar en historial
            await this.logSessionHistory(userId, deviceInfo, 'logout', true);

            return true;
        } catch (error) {
            console.error('Error desactivando todas las sesiones:', error);
            return false;
        }
    }

    /**
     * Obtiene sesiones activas de un usuario
     */
    static async getUserActiveSessions(userId) {
        try {
            return await Sesion.findAll({
                where: { id_usuario: userId, activa: true },
                order: [['fecha_ultimo_acceso', 'DESC']],
            });
        } catch (error) {
            console.error('Error obteniendo sesiones activas:', error);
            return [];
        }
    }

    /**
     * Registra una acción en el historial de sesiones
     */
    static async logSessionHistory(userId, deviceInfo, action, success = true) {
        try {
            await HistorialSesion.create({
                id_usuario: userId,
                dispositivo: truncate(deviceInfo.device || 'Desconocido', 100),
                ip_address: truncate(deviceInfo.ip || null, 45),
                fecha_acceso: new Date(),
                accion: action,
                exitoso: success,
            });
        } catch (error) {
            console.error('Error registrando en historial:', error);
        }
    }

    /**
     * Obtiene el historial de sesiones de un usuario
     */
    static async getUserSessionHistory(userId, limit = 20, offset = 0) {
        try {
            const { count, rows } = await HistorialSesion.findAndCountAll({
                where: { id_usuario: userId },
                order: [['fecha_acceso', 'DESC']],
                limit,
                offset,
            });

            return {
                total: count,
                history: rows,
            };
        } catch (error) {
            console.error('Error obteniendo historial:', error);
            return { total: 0, history: [] };
        }
    }

    /**
     * Limpia sesiones inactivas antiguas (más de 30 días)
     */
    static async cleanupOldSessions() {
        try {
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

            const deleted = await Sesion.destroy({
                where: {
                    activa: false,
                    fecha_ultimo_acceso: {
                        [require('sequelize').Op.lt]: thirtyDaysAgo,
                    },
                },
            });

            console.log(`🗑️  Limpiadas ${deleted} sesiones antiguas`);
            return deleted;
        } catch (error) {
            console.error('Error limpiando sesiones antiguas:', error);
            return 0;
        }
    }
}

module.exports = SessionService;
