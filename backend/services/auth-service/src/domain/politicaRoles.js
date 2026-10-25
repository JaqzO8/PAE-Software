// backend/services/auth-service/src/domain/politicaRoles.js
// Reglas puras de dominio para asignación y validación de roles en Identidad (RIC-01, RIC-02, RIC-03)

const ROLES_VALIDOS = Object.freeze(['estudiante', 'docente', 'admin']);
const ROLES_PRIVILEGIADOS = Object.freeze(['docente', 'admin']);
const ROL_PREDETERMINADO = 'estudiante';

/**
 * Valida si un rol es válido en el sistema
 */
function esRolValido(rol) {
    return ROLES_VALIDOS.includes(rol);
}

/**
 * Determina el rol inicial para un nuevo registro público.
 * REGLA INMUTABLE: El registro público NUNCA otorga roles privilegiados (docente o admin),
 * sin importar los flags enviados por el cliente (isTeacher, role, etc.).
 */
function determinarRolInicial() {
    return ROL_PREDETERMINADO;
}

/**
 * Determina si un rol es privilegiado
 */
function esRolPrivilegiado(rol) {
    return ROLES_PRIVILEGIADOS.includes(rol);
}

/**
 * Valida si un usuario actor puede asignar un rol a otro usuario
 */
function puedeAsignarRol(actorRol, rolDestino) {
    if (!esRolValido(rolDestino)) {
        return false;
    }
    // Solo administradores pueden otorgar roles privilegiados
    if (esRolPrivilegiado(rolDestino)) {
        return actorRol === 'admin';
    }
    return actorRol === 'admin';
}

/**
 * Evalúa si una solicitud de rol docente es admisible para revisión
 */
function validarSolicitudDocente(datos) {
    if (!datos) {
        return { valida: false, motivo: 'Datos de solicitud requeridos' };
    }
    const institucion = String(datos.institucion || '').trim();
    if (institucion.length < 3) {
        return { valida: false, motivo: 'Institución académica es requerida (mínimo 3 caracteres)' };
    }
    return { valida: true };
}

module.exports = {
    ROLES_VALIDOS,
    ROLES_PRIVILEGIADOS,
    ROL_PREDETERMINADO,
    esRolValido,
    determinarRolInicial,
    esRolPrivilegiado,
    puedeAsignarRol,
    validarSolicitudDocente,
};
