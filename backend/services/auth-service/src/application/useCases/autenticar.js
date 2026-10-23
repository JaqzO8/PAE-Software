// backend/services/auth-service/src/application/useCases/autenticar.js
const { ESTADOS_AUTENTICACION, MFA_CONFIG } = require('../../domain/politicaSesion');

/**
 * Caso de Uso: Autenticar usuario con correo y contraseña (RIC-01, RIC-04, RIC-06, RIC-AC-02)
 * - Respuestas neutras ante credenciales incorrectas para evitar enumeración (RIC-01)
 * - Protección contra fuerza bruta mediante registro de intentos (RIC-04)
 * - Soporte para desafío MFA de alcance restringido (RIC-06, RIC-AC-02)
 */
async function autenticar({
    email,
    password,
    deviceInfo,
    userRepository,
    sessionRepository,
    rateLimiter,
    cryptoProvider,
    mfaEnforced = false,
}) {
    const normalizedEmail = String(email || '').toLowerCase().trim();

    if (!normalizedEmail || !password) {
        const error = new Error('Credenciales incorrectas');
        error.statusCode = 401;
        throw error;
    }

    // Verificar límite de intentos
    if (rateLimiter) {
        const attempts = await rateLimiter.getAttempts(normalizedEmail);
        if (attempts >= 5) {
            const error = new Error('Demasiados intentos fallidos. Intenta más tarde.');
            error.statusCode = 429;
            throw error;
        }
    }

    const user = await userRepository.findByEmail(normalizedEmail);

    if (!user) {
        if (rateLimiter) {
            await rateLimiter.recordFailedAttempt(normalizedEmail);
        }
        const error = new Error('Credenciales incorrectas');
        error.statusCode = 401;
        throw error;
    }

    if (!user.activo) {
        const error = new Error('Cuenta desactivada. Contacta al administrador.');
        error.statusCode = 403;
        throw error;
    }

    const isValid = await user.validarPassword(password);
    if (!isValid) {
        if (rateLimiter) {
            await rateLimiter.recordFailedAttempt(normalizedEmail);
        }
        if (sessionRepository?.logHistory) {
            await sessionRepository.logHistory(user.id_usuario, deviceInfo, 'login', false);
        }
        const error = new Error('Credenciales incorrectas');
        error.statusCode = 401;
        throw error;
    }

    // Limpiar intentos fallidos tras login exitoso
    if (rateLimiter) {
        await rateLimiter.clearAttempts(normalizedEmail);
    }

    // Verificar si se requiere MFA
    const requiresMfa = mfaEnforced || Boolean(user.mfa_enabled);
    if (requiresMfa) {
        const challengeId = cryptoProvider.randomUUID();
        const otpCode = cryptoProvider.generateNumericOtp(MFA_CONFIG.LONGITUD_CODIGO);

        await sessionRepository.storeMfaChallenge({
            challengeId,
            userId: user.id_usuario,
            otpCode,
            attempts: 0,
            expiresInSeconds: MFA_CONFIG.EXPIRACION_SEGUNDOS,
        });

        return {
            estado: ESTADOS_AUTENTICACION.DESAFIO_MFA_PENDIENTE,
            challengeToken: challengeId,
            expiresIn: MFA_CONFIG.EXPIRACION_SEGUNDOS,
            // Solo en ambiente de prueba se expone el código generado si el provider lo permite
            testOtp: cryptoProvider.isTestEnv ? otpCode : undefined,
        };
    }

    // Sesión completa
    return {
        estado: ESTADOS_AUTENTICACION.SESION_COMPLETA,
        user,
    };
}

module.exports = { autenticar };
