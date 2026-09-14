const { Comunidad, MiembroComunidad, MensajeCanal, DesafioSemanal } = require('../models');
const { Op } = require('sequelize');
const axios = require('axios');
const config = require('../config/env');
const { buildCommunityPerformance } = require('../services/communityPerformanceService');

const sameId = (left, right) => String(left) === String(right);

class CommunityController {
    /**
     * POST /api/community/create
     * Crear una nueva comunidad (solo docentes)
     */
    static async create(req, res, next) {
        try {
            const { nombre, descripcion, icono_url, materia, es_publica } = req.body;
            const profesorId = req.user.id;

            // Validar que el usuario es docente
            if (req.user.rol !== 'docente') {
                return res.status(403).json({
                    success: false,
                    message: 'Solo los docentes pueden crear comunidades',
                });
            }

            // Crear comunidad
            const comunidad = await Comunidad.create({
                nombre: nombre.trim(),
                descripcion: descripcion?.trim() || null,
                icono_url: icono_url || null,
                materia: materia?.trim() || null,
                profesor_id: profesorId,
                es_publica: es_publica !== false,
                puntos_prestigio: 0,
                proximo_hito: 100,
                activa: true,
            });

            // Agregar al profesor como miembro automáticamente
            await MiembroComunidad.create({
                comunidad_id: comunidad.id_comunidad,
                usuario_id: profesorId,
                rol_comunidad: 'profesor',
                puntos_individuales: 0,
                activo: true,
            });

            res.status(201).json({
                success: true,
                message: 'Comunidad creada exitosamente',
                community: {
                    id: comunidad.id_comunidad,
                    nombre: comunidad.nombre,
                    descripcion: comunidad.descripcion,
                    icono_url: comunidad.icono_url,
                    materia: comunidad.materia,
                    profesor_id: comunidad.profesor_id,
                    puntos_prestigio: comunidad.puntos_prestigio,
                    proximo_hito: comunidad.proximo_hito,
                    es_publica: comunidad.es_publica,
                    fecha_creacion: comunidad.fecha_creacion,
                },
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/community/my-communities
     * Obtener comunidades del usuario (estudiante o docente)
     */
    static async getMyCommunities(req, res, next) {
        try {
            const userId = req.user.id;
            const rol = req.user.rol;

            let communities;

            if (rol === 'docente') {
                // Obtener comunidades creadas por el docente
                communities = await Comunidad.findAll({
                    where: {
                        profesor_id: userId,
                        activa: true,
                    },
                    include: [
                        {
                            model: MiembroComunidad,
                            as: 'miembros',
                            where: { activo: true },
                            required: false,
                        },
                        {
                            model: DesafioSemanal,
                            as: 'desafios',
                            where: { activo: true },
                            required: false,
                            limit: 1,
                            order: [['fecha_inicio', 'DESC']],
                        },
                    ],
                    order: [['fecha_creacion', 'DESC']],
                });
            } else {
                // Obtener comunidades en las que el estudiante es miembro
                const memberships = await MiembroComunidad.findAll({
                    where: {
                        usuario_id: userId,
                        activo: true,
                    },
                    include: [
                        {
                            model: Comunidad,
                            as: 'comunidad',
                            where: { activa: true },
                            include: [
                                {
                                    model: MiembroComunidad,
                                    as: 'miembros',
                                    where: { activo: true },
                                    required: false,
                                },
                                {
                                    model: DesafioSemanal,
                                    as: 'desafios',
                                    where: { activo: true },
                                    required: false,
                                    limit: 1,
                                    order: [['fecha_inicio', 'DESC']],
                                },
                            ],
                        },
                    ],
                });

                communities = memberships.map(m => m.comunidad);
            }

            // Obtener información de usuarios del auth-service
            const communityData = await Promise.all(
                communities.map(async (community) => {
                    let profesorInfo = null;
                    try {
                        // Llamar a auth-service para obtener info del profesor
                        const response = await axios.get(
                            `${config.AUTH_SERVICE_URL}/api/auth/user/${community.profesor_id}`,
                            { headers: { Authorization: `Bearer ${req.token}` } }
                        );
                        profesorInfo = response.data.user;
                    } catch (error) {
                        console.error('Error obteniendo info del profesor:', error.message);
                    }

                    return {
                        id: community.id_comunidad,
                        nombre: community.nombre,
                        descripcion: community.descripcion,
                        icono_url: community.icono_url,
                        materia: community.materia,
                        profesor: profesorInfo ? {
                            id: profesorInfo.id,
                            nombres: profesorInfo.nombres,
                            apellidos: profesorInfo.apellidos,
                            avatar: profesorInfo.avatar,
                        } : null,
                        puntos_prestigio: community.puntos_prestigio,
                        proximo_hito: community.proximo_hito,
                        miembros_count: community.miembros?.length || 0,
                        desafio_activo: community.desafios?.[0] || null,
                        fecha_creacion: community.fecha_creacion,
                    };
                })
            );

            res.status(200).json({
                success: true,
                communities: communityData,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/community/explore
     * Explorar comunidades públicas
     */
    static async explore(req, res, next) {
        try {
            const userId = req.user.id;
            const { search, materia } = req.query;

            // Obtener IDs de comunidades en las que ya es miembro
            const userMemberships = await MiembroComunidad.findAll({
                where: { usuario_id: userId, activo: true },
                attributes: ['comunidad_id'],
            });
            const memberCommunityIds = userMemberships.map(m => m.comunidad_id);

            // Construir filtros
            const where = {
                activa: true,
                es_publica: true,
                id_comunidad: { [Op.notIn]: memberCommunityIds.length > 0 ? memberCommunityIds : [-1] },
            };

            if (search) {
                where[Op.or] = [
                    { nombre: { [Op.iLike]: `%${search}%` } },
                    { descripcion: { [Op.iLike]: `%${search}%` } },
                ];
            }

            if (materia) {
                where.materia = { [Op.iLike]: `%${materia}%` };
            }

            const communities = await Comunidad.findAll({
                where,
                include: [
                    {
                        model: MiembroComunidad,
                        as: 'miembros',
                        where: { activo: true },
                        required: false,
                    },
                ],
                order: [['puntos_prestigio', 'DESC'], ['fecha_creacion', 'DESC']],
                limit: 50,
            });

            // Obtener info de profesores
            const communityData = await Promise.all(
                communities.map(async (community) => {
                    let profesorInfo = null;
                    try {
                        const response = await axios.get(
                            `${config.AUTH_SERVICE_URL}/api/auth/user/${community.profesor_id}`,
                            { headers: { Authorization: `Bearer ${req.token}` } }
                        );
                        profesorInfo = response.data.user;
                    } catch (error) {
                        console.error('Error obteniendo info del profesor:', error.message);
                    }

                    return {
                        id: community.id_comunidad,
                        nombre: community.nombre,
                        descripcion: community.descripcion,
                        icono_url: community.icono_url,
                        materia: community.materia,
                        profesor: profesorInfo ? {
                            id: profesorInfo.id,
                            nombres: profesorInfo.nombres,
                            apellidos: profesorInfo.apellidos,
                        } : null,
                        puntos_prestigio: community.puntos_prestigio,
                        miembros_count: community.miembros?.length || 0,
                    };
                })
            );

            res.status(200).json({
                success: true,
                communities: communityData,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/community/:id
     * Obtener detalle de una comunidad
     */
    static async getDetail(req, res, next) {
        try {
            const { id } = req.params;
            const userId = req.user.id;

            const community = await Comunidad.findOne({
                where: { id_comunidad: id, activa: true },
                include: [
                    {
                        model: MiembroComunidad,
                        as: 'miembros',
                        where: { activo: true },
                        required: false,
                    },
                    {
                        model: DesafioSemanal,
                        as: 'desafios',
                        where: { activo: true },
                        required: false,
                    },
                ],
            });

            if (!community) {
                return res.status(404).json({
                    success: false,
                    message: 'Comunidad no encontrada',
                });
            }

            // Verificar si el usuario es miembro
            const isMember = community.miembros.some(m => sameId(m.usuario_id, userId));

            if (!isMember && !community.es_publica) {
                return res.status(403).json({
                    success: false,
                    message: 'Esta comunidad es privada',
                });
            }

            // Obtener información del profesor
            let profesorInfo = null;
            try {
                const response = await axios.get(
                    `${config.AUTH_SERVICE_URL}/api/auth/user/${community.profesor_id}`,
                    { headers: { Authorization: `Bearer ${req.token}` } }
                );
                profesorInfo = response.data.user;
            } catch (error) {
                console.error('Error obteniendo info del profesor:', error.message);
            }

            // Obtener últimos mensajes
            const messages = await MensajeCanal.findAll({
                where: { comunidad_id: id },
                order: [['fecha_envio', 'DESC']],
                limit: 50,
            });

            // Obtener info de usuarios de los mensajes
            const userIds = [...new Set(messages.map(m => m.usuario_id))];
            const usersInfo = {};

            for (const uid of userIds) {
                try {
                    const response = await axios.get(
                        `${config.AUTH_SERVICE_URL}/api/auth/user/${uid}`,
                        { headers: { Authorization: `Bearer ${req.token}` } }
                    );
                    usersInfo[uid] = response.data.user;
                } catch (error) {
                    console.error(`Error obteniendo info del usuario ${uid}:`, error.message);
                }
            }

            const messagesData = messages.reverse().map(msg => ({
                id: msg.id_mensaje,
                content: msg.contenido,
                author: usersInfo[msg.usuario_id] ? 
                    `${usersInfo[msg.usuario_id].nombres} ${usersInfo[msg.usuario_id].apellidos}` : 
                    'Usuario desconocido',
                avatar: usersInfo[msg.usuario_id]?.avatar || null,
                authorRole: usersInfo[msg.usuario_id]?.rol || 'estudiante',
                timestamp: msg.fecha_envio,
                editado: msg.editado,
            }));

            const participants = await Promise.all(
                community.miembros.map(async (member) => {
                    let userInfo = null;
                    try {
                        const response = await axios.get(
                            `${config.AUTH_SERVICE_URL}/api/auth/user/${member.usuario_id}`,
                            { headers: { Authorization: `Bearer ${req.token}` } }
                        );
                        userInfo = response.data.user;
                    } catch (error) {
                        console.error(`Error obteniendo participante ${member.usuario_id}:`, error.message);
                    }

                    return {
                        id: member.usuario_id.toString(),
                        name: userInfo
                            ? `${userInfo.nombres} ${userInfo.apellidos}`
                            : 'Usuario desconocido',
                        role: member.rol_comunidad === 'profesor' ? 'docente' : 'estudiante',
                        avatar: userInfo?.avatar || null,
                        email: userInfo?.email || '',
                        joinedAt: member.fecha_union,
                    };
                })
            );

            const totalMessages = await MensajeCanal.count({ where: { comunidad_id: id } });
            const activeMemberIds = new Set(messages.map((msg) => String(msg.usuario_id)));
            let performance = null;

            if (isMember || sameId(community.profesor_id, userId) || req.user.rol === 'admin') {
                try {
                    performance = await buildCommunityPerformance({
                        communityId: id,
                        user: req.user,
                        token: req.token,
                    });
                } catch (error) {
                    console.error('Error calculando rendimiento comunitario:', error.message);
                }
            }

            res.status(200).json({
                success: true,
                community: {
                    id: community.id_comunidad,
                    nombre: community.nombre,
                    descripcion: community.descripcion,
                    icono_url: community.icono_url,
                    materia: community.materia,
                    profesor: profesorInfo ? {
                        id: profesorInfo.id,
                        nombres: profesorInfo.nombres,
                        apellidos: profesorInfo.apellidos,
                        avatar: profesorInfo.avatar,
                    } : null,
                    puntos_prestigio: community.puntos_prestigio,
                    proximo_hito: community.proximo_hito,
                    miembros_count: community.miembros?.length || 0,
                    desafios: community.desafios || [],
                    is_member: isMember,
                    messages: messagesData,
                    participants,
                    forums: [],
                    analytics: {
                        totalMessages,
                        activeMembers: performance?.totals?.activeMembers ?? activeMemberIds.size,
                        avgResponseTime: 'Calculado por actividad reciente',
                        participationRate: performance?.rates?.participation ?? (
                            community.miembros?.length
                                ? Math.round((activeMemberIds.size / community.miembros.length) * 100)
                                : 0
                        ),
                        topContributors: performance?.topContributors || [],
                        performance,
                    },
                },
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * POST /api/community/:id/join
     * Unirse a una comunidad pública
     */
    static async join(req, res, next) {
        try {
            const { id } = req.params;
            const userId = req.user.id;

            const community = await Comunidad.findOne({
                where: { id_comunidad: id, activa: true },
            });

            if (!community) {
                return res.status(404).json({
                    success: false,
                    message: 'Comunidad no encontrada',
                });
            }

            if (!community.es_publica) {
                return res.status(403).json({
                    success: false,
                    message: 'Esta comunidad requiere invitación',
                });
            }

            // Verificar si ya es miembro
            const existingMember = await MiembroComunidad.findOne({
                where: {
                    comunidad_id: id,
                    usuario_id: userId,
                },
            });

            if (existingMember) {
                if (existingMember.activo) {
                    return res.status(400).json({
                        success: false,
                        message: 'Ya eres miembro de esta comunidad',
                    });
                } else {
                    // Reactivar membresía
                    await existingMember.update({
                        activo: true,
                        fecha_union: new Date(),
                    });
                }
            } else {
                // Crear nueva membresía
                await MiembroComunidad.create({
                    comunidad_id: id,
                    usuario_id: userId,
                    rol_comunidad: 'miembro',
                    puntos_individuales: 0,
                    activo: true,
                });
            }

            res.status(200).json({
                success: true,
                message: 'Te has unido a la comunidad exitosamente',
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * POST /api/community/:id/leave
     * Salir de una comunidad
     */
    static async leave(req, res, next) {
        try {
            const { id } = req.params;
            const userId = req.user.id;

            const member = await MiembroComunidad.findOne({
                where: {
                    comunidad_id: id,
                    usuario_id: userId,
                    activo: true,
                },
            });

            if (!member) {
                return res.status(404).json({
                    success: false,
                    message: 'No eres miembro de esta comunidad',
                });
            }

            // No permitir que el profesor salga de su propia comunidad
            if (member.rol_comunidad === 'profesor') {
                return res.status(403).json({
                    success: false,
                    message: 'Como profesor, no puedes salir de tu propia comunidad. Elimínala si deseas cerrarla.',
                });
            }

            await member.update({ activo: false });

            res.status(200).json({
                success: true,
                message: 'Has salido de la comunidad',
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * DELETE /api/community/:id
     * Eliminar comunidad (solo profesor creador)
     */
    static async delete(req, res, next) {
        try {
            const { id } = req.params;
            const userId = req.user.id;

            const community = await Comunidad.findOne({
                where: { id_comunidad: id, activa: true },
            });

            if (!community) {
                return res.status(404).json({
                    success: false,
                    message: 'Comunidad no encontrada',
                });
            }

            if (!sameId(community.profesor_id, userId) && req.user.rol !== 'admin') {
                return res.status(403).json({
                    success: false,
                    message: 'Solo el profesor creador puede eliminar esta comunidad',
                });
            }

            // Soft delete
            await community.update({
                activa: false,
                fecha_eliminacion: new Date(),
            });

            // Desactivar todas las membresías
            await MiembroComunidad.update(
                { activo: false },
                { where: { comunidad_id: id } }
            );

            res.status(200).json({
                success: true,
                message: 'Comunidad eliminada exitosamente',
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * POST /api/community/:id/kick/:userId
     * Expulsar miembro (solo profesor)
     */
    static async kickMember(req, res, next) {
        try {
            const { id, userId } = req.params;
            const { motivo } = req.body;
            const profesorId = req.user.id;

            const community = await Comunidad.findOne({
                where: { id_comunidad: id, activa: true },
            });

            if (!community) {
                return res.status(404).json({
                    success: false,
                    message: 'Comunidad no encontrada',
                });
            }

            if (!sameId(community.profesor_id, profesorId)) {
                return res.status(403).json({
                    success: false,
                    message: 'Solo el profesor puede expulsar miembros',
                });
            }

            const member = await MiembroComunidad.findOne({
                where: {
                    comunidad_id: id,
                    usuario_id: userId,
                    activo: true,
                },
            });

            if (!member) {
                return res.status(404).json({
                    success: false,
                    message: 'El usuario no es miembro de esta comunidad',
                });
            }

            if (member.rol_comunidad === 'profesor') {
                return res.status(403).json({
                    success: false,
                    message: 'No puedes expulsar al profesor creador',
                });
            }

            await member.update({
                activo: false,
                fecha_expulsion: new Date(),
                motivo_expulsion: motivo || 'No especificado',
            });

            res.status(200).json({
                success: true,
                message: 'Miembro expulsado exitosamente',
            });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = CommunityController;
