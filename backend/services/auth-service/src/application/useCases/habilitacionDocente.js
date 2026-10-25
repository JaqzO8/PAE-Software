// backend/services/auth-service/src/application/useCases/habilitacionDocente.js
const { puedeAsignarRol, validarSolicitudDocente } = require('../../domain/politicaRoles');

/**
 * Caso de Uso: Habilitación y asignación de rol docente (RIC-02, RIC-03, M1-S03)
 * - Garantiza que ningún usuario ordinario pueda aprobarse a sí mismo
 * - Permite al administrador asignar o aprobar manualmente el rol de docente
 */
async function solicitarHabilitacion({
    userId,
    institucion,
    evidencia,
    userRepository,
    requestRepository,
}) {
    const user = await userRepository.findById(userId);
    if (!user) {
        const error = new Error('Usuario no encontrado');
        error.statusCode = 404;
        throw error;
    }

    if (user.rol?.nombre_rol === 'docente' || user.rol === 'docente') {
        const error = new Error('El usuario ya cuenta con rol docente');
        error.statusCode = 400;
        throw error;
    }

    const validacion = validarSolicitudDocente({ institucion });
    if (!validacion.valida) {
        const error = new Error(validacion.motivo);
        error.statusCode = 400;
        throw error;
    }

    const solicitud = await requestRepository.create({
        usuario_id: userId,
        institucion: institucion.trim(),
        evidencia: evidencia ? String(evidencia).trim() : null,
        estado: 'pendiente',
        fecha_solicitud: new Date(),
    });

    return {
        success: true,
        message: 'Solicitud de habilitación docente registrada para revisión administrativa',
        solicitud,
    };
}

async function aprobarHabilitacion({
    adminUser,
    solicitudId,
    requestRepository,
    userRepository,
    roleRepository,
}) {
    if (!puedeAsignarRol(adminUser.rol, 'docente')) {
        const error = new Error('Solo administradores pueden aprobar roles docentes');
        error.statusCode = 403;
        throw error;
    }

    const solicitud = await requestRepository.findById(solicitudId);
    if (!solicitud) {
        const error = new Error('Solicitud no encontrada');
        error.statusCode = 404;
        throw error;
    }

    const roleDocente = await roleRepository.findByName('docente');
    if (!roleDocente) {
        const error = new Error('Rol docente no configurado');
        error.statusCode = 500;
        throw error;
    }

    // Actualizar usuario
    await userRepository.updateRole(solicitud.usuario_id, roleDocente.id_rol);

    // Actualizar solicitud
    await requestRepository.updateStatus(solicitudId, 'aprobada', adminUser.id);

    return {
        success: true,
        message: 'Habilitación docente aprobada exitosamente',
    };
}

async function asignarRolDocenteDirecto({
    adminUser,
    targetUserId,
    userRepository,
    roleRepository,
}) {
    if (!puedeAsignarRol(adminUser.rol, 'docente')) {
        const error = new Error('Solo administradores pueden asignar rol docente');
        error.statusCode = 403;
        throw error;
    }

    const targetUser = await userRepository.findById(targetUserId);
    if (!targetUser) {
        const error = new Error('Usuario destino no encontrado');
        error.statusCode = 404;
        throw error;
    }

    const roleDocente = await roleRepository.findByName('docente');
    await userRepository.updateRole(targetUserId, roleDocente.id_rol);

    return {
        success: true,
        message: 'Rol docente asignado correctamente por el administrador',
    };
}

module.exports = {
    solicitarHabilitacion,
    aprobarHabilitacion,
    asignarRolDocenteDirecto,
};
