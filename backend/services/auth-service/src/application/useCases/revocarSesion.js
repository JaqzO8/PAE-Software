// backend/services/auth-service/src/application/useCases/revocarSesion.js

/**
 * Caso de Uso: Revocación de sesiones activas (RIC-08, RIC-11, RIC-AC-04)
 * - Revoca token en blacklist inmediata
 * - Invalida sesión en persistencia
 * - Emite o registra estado de revocación para que todos los dominios la rechacen
 */
async function revocarSesionActual({
    token,
    userId,
    deviceInfo,
    tokenService,
    sessionService,
}) {
    if (!token) {
        const error = new Error('Token no proporcionado');
        error.statusCode = 400;
        throw error;
    }

    // Revocar en blacklist (Redis)
    await tokenService.revokeToken(token);

    // Desactivar sesión en base de datos
    if (sessionService) {
        await sessionService.deactivateSession(token, deviceInfo);
    }

    return {
        success: true,
        message: 'Sesión cerrada exitosamente',
    };
}

async function revocarTodasLasSesiones({
    userId,
    deviceInfo,
    tokenService,
    sessionService,
}) {
    if (!userId) {
        const error = new Error('Identificador de usuario requerido');
        error.statusCode = 400;
        throw error;
    }

    // Obtener sesiones activas y revocar cada token
    if (sessionService && tokenService) {
        const activeSessions = await sessionService.getUserActiveSessions(userId);
        await Promise.all(
            activeSessions.map(session => tokenService.revokeToken(session.token_sesion))
        );
        await sessionService.deactivateAllUserSessions(userId, deviceInfo);
    }

    return {
        success: true,
        message: 'Todas las sesiones fueron cerradas',
    };
}

module.exports = {
    revocarSesionActual,
    revocarTodasLasSesiones,
};
