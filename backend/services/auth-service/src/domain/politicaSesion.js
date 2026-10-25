// backend/services/auth-service/src/domain/politicaSesion.js
// Reglas puras de dominio para sesiones, tokens, MFA y revocación (RIC-04, RIC-06, RIC-07, RIC-11)

const ESTADOS_AUTENTICACION = Object.freeze({
    ANONIMO: 'anonimo',
    DESAFIO_MFA_PENDIENTE: 'desafio_mfa_pendiente',
    SESION_COMPLETA: 'sesion_completa',
});

const MFA_CONFIG = Object.freeze({
    EXPIRACION_SEGUNDOS: 300, // 5 minutos
    MAX_INTENTOS: 3,
    LONGITUD_CODIGO: 6,
    ALCANCE_DESAFIO: 'mfa_challenge',
});

const RECUPERACION_CONFIG = Object.freeze({
    EXPIRACION_SEGUNDOS: 900, // 15 minutos
    LONGITUD_MINIMA_PASSWORD: 8,
});

/**
 * Valida un código OTP de dos factores
 */
function validarCodigoMfa(codigoIngresado, codigoEsperado, intentosRealizados) {
    if (intentosRealizados >= MFA_CONFIG.MAX_INTENTOS) {
        return { valido: false, bloqueado: true, motivo: 'Número máximo de intentos excedido' };
    }
    const sanitized = String(codigoIngresado || '').trim();
    if (!/^\d{6}$/.test(sanitized)) {
        return { valido: false, bloqueado: false, motivo: 'El código debe tener 6 dígitos numéricos' };
    }
    if (sanitized !== String(codigoEsperado).trim()) {
        const nuevosIntentos = intentosRealizados + 1;
        const bloqueado = nuevosIntentos >= MFA_CONFIG.MAX_INTENTOS;
        return {
            valido: false,
            bloqueado,
            intentosRestantes: Math.max(0, MFA_CONFIG.MAX_INTENTOS - nuevosIntentos),
            motivo: bloqueado ? 'Desafío bloqueado por intentos' : 'Código de verificación incorrecto',
        };
    }
    return { valido: true, bloqueado: false };
}

/**
 * Valida que una contraseña cumpla con las políticas mínimas de seguridad
 */
function validarPoliticaPassword(password) {
    if (!password || typeof password !== 'string') {
        return { valida: false, motivo: 'La contraseña es requerida' };
    }
    if (password.length < RECUPERACION_CONFIG.LONGITUD_MINIMA_PASSWORD) {
        return { valida: false, motivo: `La contraseña debe tener al menos ${RECUPERACION_CONFIG.LONGITUD_MINIMA_PASSWORD} caracteres` };
    }
    const tieneLetra = /[a-zA-Z]/.test(password);
    const tieneNumero = /[0-9]/.test(password);
    if (!tieneLetra || !tieneNumero) {
        return { valida: false, motivo: 'La contraseña debe contener al menos una letra y un número' };
    }
    return { valida: true };
}

/**
 * Determina si un token con cierto scope puede acceder a un recurso protegido regular
 */
function tokenPermiteAccesoRegular(tokenScope) {
    // Si el token solo tiene scope de desafío MFA, NO tiene acceso regular
    return tokenScope !== MFA_CONFIG.ALCANCE_DESAFIO;
}

module.exports = {
    ESTADOS_AUTENTICACION,
    MFA_CONFIG,
    RECUPERACION_CONFIG,
    validarCodigoMfa,
    validarPoliticaPassword,
    tokenPermiteAccesoRegular,
};
