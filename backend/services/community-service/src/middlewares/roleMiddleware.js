/**
 * Middleware para verificar roles específicos
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

/**
 * Middleware para verificar si el usuario es profesor de una comunidad
 */
const verifyTeacherOfCommunity = async (req, res, next) => {
    try {
        const { Comunidad } = require('../models');
        const communityId = req.params.id || req.body.comunidad_id;
        const userId = req.user.id;

        const community = await Comunidad.findByPk(communityId);

        if (!community) {
            return res.status(404).json({
                success: false,
                message: 'Comunidad no encontrada',
            });
        }

        if (String(community.profesor_id) !== String(userId) && req.user.rol !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Solo el profesor creador puede realizar esta acción',
            });
        }

        req.community = community;
        next();
    } catch (error) {
        console.error('Error en verifyTeacherOfCommunity:', error);
        return res.status(500).json({
            success: false,
            message: 'Error al verificar permisos',
        });
    }
};

/**
 * Middleware para verificar si el usuario es miembro de una comunidad
 */
const verifyMemberOfCommunity = async (req, res, next) => {
    try {
        const { MiembroComunidad } = require('../models');
        const communityId = req.params.id || req.body.comunidad_id;
        const userId = req.user.id;

        const member = await MiembroComunidad.findOne({
            where: {
                comunidad_id: communityId,
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

        req.membership = member;
        next();
    } catch (error) {
        console.error('Error en verifyMemberOfCommunity:', error);
        return res.status(500).json({
            success: false,
            message: 'Error al verificar membresía',
        });
    }
};

module.exports = {
    verifyRole,
    verifyTeacherOfCommunity,
    verifyMemberOfCommunity,
};
