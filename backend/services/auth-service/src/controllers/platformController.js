const { Usuario, Rol, Sesion, HistorialSesion, UserPreference, SupportTicket } = require('../models');
const config = require('../config/env');
const { redis } = require('../config/redis');

const DEFAULT_PREFERENCES = {
    theme: 'light',
    fontSize: 'medium',
    reduceMotion: false,
    highContrast: false,
    emailReminders: true,
    challengeNotifications: true,
    communityMessages: false,
};

const PREFERENCE_MAP = {
    theme: 'tema',
    fontSize: 'tamano_fuente',
    reduceMotion: 'reducir_movimiento',
    highContrast: 'alto_contraste',
    emailReminders: 'notificaciones_email',
    challengeNotifications: 'notificaciones_desafios',
    communityMessages: 'notificaciones_comunidad',
};

const ALLOWED_VALUES = {
    theme: ['light', 'dark'],
    fontSize: ['small', 'medium', 'large'],
};

const toClientPreferences = (preference) => {
    if (!preference) {
        return DEFAULT_PREFERENCES;
    }

    return {
        theme: preference.tema,
        fontSize: preference.tamano_fuente,
        reduceMotion: preference.reducir_movimiento,
        highContrast: preference.alto_contraste,
        emailReminders: preference.notificaciones_email,
        challengeNotifications: preference.notificaciones_desafios,
        communityMessages: preference.notificaciones_comunidad,
    };
};

const preferencesCacheKey = (userId) => `auth:preferences:${userId}`;

const readCachedPreferences = async (userId) => {
    try {
        const cached = await redis.get(preferencesCacheKey(userId));
        return cached ? JSON.parse(cached) : null;
    } catch (error) {
        console.error('Error leyendo cache de preferencias:', error.message);
        return null;
    }
};

const writeCachedPreferences = async (userId, preferences) => {
    try {
        await redis.setex(
            preferencesCacheKey(userId),
            config.PREFERENCES_CACHE_TTL_SECONDS,
            JSON.stringify(preferences)
        );
    } catch (error) {
        console.error('Error guardando cache de preferencias:', error.message);
    }
};

const clearCachedPreferences = async (userId) => {
    try {
        await redis.del(preferencesCacheKey(userId));
    } catch (error) {
        console.error('Error invalidando cache de preferencias:', error.message);
    }
};

const toClientTicket = (ticket) => ({
    id: ticket.id_ticket.toString(),
    subject: ticket.asunto,
    description: ticket.descripcion,
    category: ticket.categoria,
    priority: ticket.prioridad,
    status: ticket.estado,
    response: ticket.respuesta,
    createdAt: ticket.created_at,
    updatedAt: ticket.updated_at,
});

class PlatformController {
    static async getPreferences(req, res, next) {
        try {
            const cached = await readCachedPreferences(req.user.id);
            if (cached) {
                return res.status(200).json({
                    success: true,
                    preferences: cached,
                });
            }

            const [preference] = await UserPreference.findOrCreate({
                where: { id_usuario: req.user.id },
                defaults: { id_usuario: req.user.id },
            });

            const preferences = toClientPreferences(preference);
            await writeCachedPreferences(req.user.id, preferences);

            res.status(200).json({
                success: true,
                preferences,
            });
        } catch (error) {
            next(error);
        }
    }

    static async updatePreferences(req, res, next) {
        try {
            const update = {};

            for (const [clientKey, column] of Object.entries(PREFERENCE_MAP)) {
                if (req.body[clientKey] === undefined) {
                    continue;
                }

                const value = req.body[clientKey];
                if (ALLOWED_VALUES[clientKey] && !ALLOWED_VALUES[clientKey].includes(value)) {
                    return res.status(400).json({
                        success: false,
                        message: `Valor no permitido para ${clientKey}`,
                    });
                }

                if (!ALLOWED_VALUES[clientKey] && typeof value !== 'boolean') {
                    return res.status(400).json({
                        success: false,
                        message: `El valor de ${clientKey} debe ser booleano`,
                    });
                }

                update[column] = value;
            }

            const [preference] = await UserPreference.findOrCreate({
                where: { id_usuario: req.user.id },
                defaults: { id_usuario: req.user.id },
            });

            await preference.update(update);
            const preferences = toClientPreferences(preference);
            await clearCachedPreferences(req.user.id);
            await writeCachedPreferences(req.user.id, preferences);

            res.status(200).json({
                success: true,
                preferences,
            });
        } catch (error) {
            next(error);
        }
    }

    static async listSupportTickets(req, res, next) {
        try {
            const tickets = await SupportTicket.findAll({
                where: { id_usuario: req.user.id },
                order: [['created_at', 'DESC']],
                limit: 25,
            });

            res.status(200).json({
                success: true,
                tickets: tickets.map(toClientTicket),
            });
        } catch (error) {
            next(error);
        }
    }

    static async createSupportTicket(req, res, next) {
        try {
            const subject = String(req.body.subject || '').trim();
            const description = String(req.body.description || '').trim();
            const category = String(req.body.category || 'tecnico').trim();
            const priority = String(req.body.priority || 'media').trim();

            if (subject.length < 5 || subject.length > 160) {
                return res.status(400).json({
                    success: false,
                    message: 'El asunto debe tener entre 5 y 160 caracteres',
                });
            }

            if (description.length < 10 || description.length > 2000) {
                return res.status(400).json({
                    success: false,
                    message: 'La descripcion debe tener entre 10 y 2000 caracteres',
                });
            }

            const ticket = await SupportTicket.create({
                id_usuario: req.user.id,
                asunto: subject,
                descripcion: description,
                categoria: category,
                prioridad: priority,
            });

            res.status(201).json({
                success: true,
                ticket: toClientTicket(ticket),
            });
        } catch (error) {
            next(error);
        }
    }

    static async exportPrivacyData(req, res, next) {
        try {
            const [usuario, preference, sessions, history, tickets] = await Promise.all([
                Usuario.findByPk(req.user.id, {
                    include: [{ model: Rol, as: 'rol' }],
                    attributes: { exclude: ['password_hash'] },
                }),
                UserPreference.findOne({ where: { id_usuario: req.user.id } }),
                Sesion.findAll({
                    where: { id_usuario: req.user.id },
                    attributes: ['id_sesion', 'dispositivo', 'ip_address', 'fecha_inicio', 'fecha_ultimo_acceso', 'activa'],
                    order: [['fecha_ultimo_acceso', 'DESC']],
                    limit: 20,
                }),
                HistorialSesion.findAll({
                    where: { id_usuario: req.user.id },
                    attributes: ['id_historial', 'dispositivo', 'ip_address', 'fecha_acceso', 'accion', 'exitoso'],
                    order: [['fecha_acceso', 'DESC']],
                    limit: 50,
                }),
                SupportTicket.findAll({
                    where: { id_usuario: req.user.id },
                    order: [['created_at', 'DESC']],
                }),
            ]);

            if (!usuario) {
                return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
            }

            res.status(200).json({
                success: true,
                generatedAt: new Date().toISOString(),
                data: {
                    profile: usuario,
                    preferences: toClientPreferences(preference),
                    sessions,
                    sessionHistory: history,
                    supportTickets: tickets.map(toClientTicket),
                },
            });
        } catch (error) {
            next(error);
        }
    }

    static async requestAccountDeletion(req, res, next) {
        try {
            const reason = String(req.body.reason || 'Solicitud de eliminacion de datos personales').trim();
            const ticket = await SupportTicket.create({
                id_usuario: req.user.id,
                asunto: 'Solicitud de eliminacion de datos personales',
                descripcion: reason.slice(0, 2000),
                categoria: 'privacidad',
                prioridad: 'alta',
            });

            res.status(202).json({
                success: true,
                message: 'Solicitud registrada para revision administrativa',
                ticket: toClientTicket(ticket),
            });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = PlatformController;
