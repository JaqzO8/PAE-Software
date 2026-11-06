// backend/services/auth-service/src/application/useCases/recuperarClave.js
const { validarPoliticaPassword, RECUPERACION_CONFIG } = require('../../domain/politicaSesion');

/**
 * Caso de Uso: Recuperación y restablecimiento de contraseña (RIC-07, RIC-AC-03)
 * - Respuestas neutras en solicitud para evitar enumeración
 * - Consumo estrictamente atómico del token para evitar carreras (RIC-AC-03)
 * - Revocación automática e inmediata de todas las sesiones previas
 */
async function solicitarRecuperacion({
    email,
    userRepository,
    tokenStorage,
    cryptoProvider,
}) {
    const normalizedEmail = String(email || '').toLowerCase().trim();
    let resetToken = null;

    if (normalizedEmail) {
        const user = await userRepository.findByEmail(normalizedEmail);
        if (user?.activo) {
            resetToken = cryptoProvider.randomHex(32);
            await tokenStorage.setResetToken(
                resetToken,
                user.id_usuario,
                RECUPERACION_CONFIG.EXPIRACION_SEGUNDOS
            );
        }
    }

    return {
        success: true,
        message: 'Si el correo existe, se enviaron instrucciones para recuperar la cuenta',
        resetToken: (cryptoProvider?.isTestEnv && resetToken) ? resetToken : undefined,
    };
}

async function restablecerClave({
    token,
    newPassword,
    tokenStorage,
    userRepository,
    sessionRepository,
}) {
    if (!token || !newPassword) {
        const error = new Error('Token y nueva contraseña son requeridos');
        error.statusCode = 400;
        throw error;
    }

    const passwordValidation = validarPoliticaPassword(newPassword);
    if (!passwordValidation.valida) {
        const error = new Error(passwordValidation.motivo);
        error.statusCode = 400;
        throw error;
    }

    // Consumo ATÓMICO del token: tokenStorage.consumeResetToken debe retornar el userId
    // y eliminar la clave en una sola operación atómica (ej. GETDEL en Redis)
    const userId = await tokenStorage.consumeResetToken(token);
    if (!userId) {
        const error = new Error('Token expirado, inválido o ya utilizado');
        error.statusCode = 400;
        throw error;
    }

    const user = await userRepository.findById(userId);
    if (!user) {
        const error = new Error('Usuario no encontrado');
        error.statusCode = 404;
        throw error;
    }

    // Actualizar contraseña
    await userRepository.updatePassword(userId, newPassword);

    // Inmediatamente revocar y cerrar todas las sesiones del usuario en todos los dispositivos
    if (sessionRepository) {
        await sessionRepository.deactivateAllUserSessions(userId);
    }

    return {
        success: true,
        message: 'Contraseña restablecida correctamente. Todas las sesiones han sido cerradas.',
    };
}

module.exports = {
    solicitarRecuperacion,
    restablecerClave,
};
