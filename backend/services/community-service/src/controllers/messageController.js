const { MensajeCanal, MiembroComunidad, Comunidad } = require('../models');
const axios = require('axios');
const config = require('../config/env');
const { redis } = require('../config/redis');

const clampNumber = (value, min, max, fallback) => {
    const number = Number(value);
    if (!Number.isFinite(number)) return fallback;
    return Math.min(max, Math.max(min, Math.trunc(number)));
};

const getCachedUserInfo = async (userId, token) => {
    const cacheKey = `auth:user:${userId}:public`;
    try {
        const cached = await redis.get(cacheKey);
        if (cached) return JSON.parse(cached);
    } catch (error) {
        console.error('Error leyendo cache de usuario:', error.message);
    }

    try {
        const response = await axios.get(
            `${config.AUTH_SERVICE_URL}/api/auth/user/${userId}`,
            {
                headers: { Authorization: `Bearer ${token}` },
                timeout: 2500,
            }
        );
        const user = response.data.user;
        try {
            await redis.setex(cacheKey, config.USER_CACHE_TTL_SECONDS, JSON.stringify(user));
        } catch (error) {
            console.error('Error guardando cache de usuario:', error.message);
        }
        return user;
    } catch (error) {
        console.error(`Error obteniendo info del usuario ${userId}:`, error.message);
        return null;
    }
};

const checkMessageRate = async (userId) => {
    const key = `rate:community:message:${userId}`;
    try {
        const count = await redis.incr(key);
        if (count === 1) {
            await redis.expire(key, config.MESSAGE_RATE_LIMIT_WINDOW_SECONDS);
        }
        return count <= config.MESSAGE_RATE_LIMIT_MAX;
    } catch (error) {
        console.error('Error validando rate limit de mensajes:', error.message);
        return true;
    }
};

class MessageController {
    /**
     * GET /api/community/:id/messages
     * Obtener mensajes de una comunidad
     */
    static async getMessages(req, res, next) {
        try {
            const { id } = req.params;
            const limit = clampNumber(req.query.limit, 1, 80, 50);
            const offset = clampNumber(req.query.offset, 0, 5000, 0);
            const userId = req.user.id;

            // Verificar que el usuario es miembro
            const member = await MiembroComunidad.findOne({
                where: {
                    comunidad_id: id,
                    usuario_id: userId,
                    activo: true,
                },
            });

            if (!member) {
                return res.status(403).json({
                    success: false,
                    message: 'No eres miembro de esta comunidad',
                });
            }

            const messages = await MensajeCanal.findAll({
                where: { comunidad_id: id },
                order: [['fecha_envio', 'DESC']],
                limit,
                offset,
            });
            messages.reverse();

            // Obtener info de usuarios
            const userIds = [...new Set(messages.map(m => m.usuario_id))];
            const usersInfo = {};

            const users = await Promise.all(userIds.map((uid) => getCachedUserInfo(uid, req.token)));
            userIds.forEach((uid, index) => {
                if (users[index]) usersInfo[uid] = users[index];
            });

            const messagesData = messages.map(msg => ({
                id: msg.id_mensaje,
                content: msg.contenido,
                author: usersInfo[msg.usuario_id] ? 
                    `${usersInfo[msg.usuario_id].nombres} ${usersInfo[msg.usuario_id].apellidos}` : 
                    'Usuario desconocido',
                avatar: usersInfo[msg.usuario_id]?.avatar || null,
                authorRole: usersInfo[msg.usuario_id]?.rol || 'estudiante',
                userId: msg.usuario_id,
                timestamp: msg.fecha_envio,
                editado: msg.editado,
            }));

            res.status(200).json({
                success: true,
                messages: messagesData,
                total: messages.length,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * POST /api/community/:id/messages
     * Enviar mensaje en una comunidad
     */
    static async sendMessage(req, res, next) {
        try {
            const { id } = req.params;
            const contenido = String(req.body.contenido || '').trim();
            const userId = req.user.id;

            if (!contenido) {
                return res.status(400).json({
                    success: false,
                    message: 'El mensaje no puede estar vacío',
                });
            }
            if (contenido.length > 1000) {
                return res.status(400).json({
                    success: false,
                    message: 'El mensaje no puede superar 1000 caracteres',
                });
            }

            const withinRateLimit = await checkMessageRate(userId);
            if (!withinRateLimit) {
                return res.status(429).json({
                    success: false,
                    message: 'Estas enviando mensajes demasiado rapido',
                });
            }

            // Verificar que la comunidad existe y esta activa
            const community = await Comunidad.findOne({
                where: { id_comunidad: id, activa: true },
            });

        if (!community) {
            return res.status(404).json({
                success: false,
                message: 'Comunidad no encontrada o eliminada',
            });
        }

        // Verificar que el usuario es miembro activo
        const member = await MiembroComunidad.findOne({
            where: {
                comunidad_id: id,
                usuario_id: userId,
                activo: true,
            },
        });

        if (!member) {
            return res.status(403).json({
                success: false,
                message: 'No puedes enviar mensajes en esta comunidad',
            });
        }

        const message = await MensajeCanal.create({
            comunidad_id: id,
            usuario_id: userId,
            contenido,
            fecha_envio: new Date(),
        });

        const userInfo = await getCachedUserInfo(userId, req.token);

        res.status(201).json({
            success: true,
            message: {
                id: message.id_mensaje,
                content: message.contenido,
                author: userInfo ? `${userInfo.nombres} ${userInfo.apellidos}` : 'Usuario',
                avatar: userInfo?.avatar || null,
                authorRole: userInfo?.rol || 'estudiante',
                userId: userId,
                timestamp: message.fecha_envio,
                editado: false,
            },
        });
    } catch (error) {
        next(error);
    }
}

/**
 * DELETE /api/community/:id/messages/:messageId
 * Eliminar mensaje (solo el autor o profesor)
 */
static async deleteMessage(req, res, next) {
    try {
        const { id, messageId } = req.params;
        const userId = req.user.id;

        const message = await MensajeCanal.findOne({
            where: {
                id_mensaje: messageId,
                comunidad_id: id,
            },
        });

        if (!message) {
            return res.status(404).json({
                success: false,
                message: 'Mensaje no encontrado',
            });
        }

        // Verificar permisos
        const community = await Comunidad.findByPk(id);
        const isAuthor = String(message.usuario_id) === String(userId);
        const isTeacher = String(community.profesor_id) === String(userId);

        if (!isAuthor && !isTeacher) {
            return res.status(403).json({
                success: false,
                message: 'No tienes permisos para eliminar este mensaje',
            });
        }

        await message.destroy();

        res.status(200).json({
            success: true,
            message: 'Mensaje eliminado',
        });
    } catch (error) {
        next(error);
    }
}
}
module.exports = MessageController;
