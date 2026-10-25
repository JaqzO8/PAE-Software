// backend/services/auth-service/src/application/useCases/actualizarPerfil.js

/**
 * Caso de Uso: Actualizar perfil de usuario (RIC-08)
 * - Solo permite modificar campos permitidos
 * - Protege identificador_unico, email, rol y hash de contraseñas contra modificaciones arbitrarias
 */
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

    if (nombres !== undefined) {
        const val = String(nombres).trim();
        if (val.length < 2 || val.length > 100) {
            const error = new Error('Los nombres deben tener entre 2 y 100 caracteres');
            error.statusCode = 400;
            throw error;
        }
        camposActualizables.nombres = val;
    }

    if (apellidos !== undefined) {
        const val = String(apellidos).trim();
        if (val.length < 2 || val.length > 100) {
            const error = new Error('Los apellidos deben tener entre 2 y 100 caracteres');
            error.statusCode = 400;
            throw error;
        }
        camposActualizables.apellidos = val;
    }

    if (institucion !== undefined) {
        camposActualizables.institucion = institucion ? String(institucion).trim() : null;
    }

    if (bio !== undefined) {
        camposActualizables.bio = bio ? String(bio).trim() : null;
    }

    if (carrera_interes !== undefined) {
        camposActualizables.carrera_interes = carrera_interes ? String(carrera_interes).trim() : null;
    }

    const updatedUser = await userRepository.updateProfile(userId, camposActualizables);

    return {
        user: updatedUser,
        success: true,
        message: 'Perfil actualizado exitosamente',
    };
}

module.exports = { actualizarPerfil };
