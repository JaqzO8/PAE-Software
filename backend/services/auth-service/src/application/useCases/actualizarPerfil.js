// backend/services/auth-service/src/application/useCases/actualizarPerfil.js

/**
 * Caso de Uso: Actualizar perfil de usuario (RIC-08)
 * - Solo permite modificar campos permitidos
 * - Protege identificador_unico, email, rol y hash de contraseñas contra modificaciones arbitrarias
 */
function validateNameField(value, fieldLabel) {
    const val = String(value).trim();
    if (val.length < 2 || val.length > 100) {
        const error = new Error(`Los ${fieldLabel} deben tener entre 2 y 100 caracteres`);
        error.statusCode = 400;
        throw error;
    }
    return val;
}

function sanitizeOptionalText(value) {
    if (!value) return null;
    const trimmed = String(value).trim();
    return trimmed.length > 0 ? trimmed : null;
}

async function actualizarPerfil({
    userId,
    nombres,
    apellidos,
    institucion,
    bio,
    carrera_interes,
    userRepository,
}) {
    if (!userId) {
        const error = new Error('Usuario no identificado');
        error.statusCode = 401;
        throw error;
    }

    const user = await userRepository.findById(userId);
    if (!user) {
        const error = new Error('Usuario no encontrado');
        error.statusCode = 404;
        throw error;
    }

    const camposActualizables = {};
    if (nombres !== undefined) camposActualizables.nombres = validateNameField(nombres, 'nombres');
    if (apellidos !== undefined) camposActualizables.apellidos = validateNameField(apellidos, 'apellidos');
    if (institucion !== undefined) camposActualizables.institucion = sanitizeOptionalText(institucion);
    if (bio !== undefined) camposActualizables.bio = sanitizeOptionalText(bio);
    if (carrera_interes !== undefined) camposActualizables.carrera_interes = sanitizeOptionalText(carrera_interes);

    const updatedUser = await userRepository.updateProfile(userId, camposActualizables);

    return {
        user: updatedUser,
        success: true,
        message: 'Perfil actualizado exitosamente',
    };
}

module.exports = { actualizarPerfil };
