// backend/services/auth-service/src/application/useCases/completarMfa.js
const { validarCodigoMfa } = require('../../domain/politicaSesion');

/**
 * Caso de Uso: Completar verificación de dos factores (RIC-06, RIC-AC-02)
 * - Consume el desafío atómicamente
 * - Aplica límite estricto de intentos
 * - Solo emite credencial tras verificación exitosa
 */
async function completarMfa({
    challengeToken,
    code,
    sessionRepository,
    userRepository,
}) {
    if (!challengeToken || !code) {
        const error = new Error('Token de desafío y código son requeridos');
        error.statusCode = 400;
        throw error;
    }

    const challenge = await sessionRepository.getMfaChallenge(challengeToken);
    if (!challenge) {
        const error = new Error('Desafío de verificación inválido o expirado');
        error.statusCode = 400;
        throw error;
    }

    const validacion = validarCodigoMfa(code, challenge.otpCode, challenge.attempts || 0);

    if (!validacion.valido) {
        if (validacion.bloqueado) {
            await sessionRepository.deleteMfaChallenge(challengeToken);
            const error = new Error(validacion.motivo);
            error.statusCode = 429;
            throw error;
        } else {
            await sessionRepository.incrementMfaAttempts(challengeToken);
            const error = new Error(validacion.motivo);
            error.statusCode = 400;
            throw error;
        }
    }

    // Consumir el desafío de forma atómica para prevenir reuso / carreras
    const consumed = await sessionRepository.deleteMfaChallenge(challengeToken);
    if (!consumed) {
        const error = new Error('El código ya fue consumido');
        error.statusCode = 400;
        throw error;
    }

    const user = await userRepository.findById(challenge.userId);
    if (!user || !user.activo) {
        const error = new Error('Usuario no disponible');
        error.statusCode = 403;
        throw error;
    }

    return {
        user,
        success: true,
    };
}

module.exports = { completarMfa };
