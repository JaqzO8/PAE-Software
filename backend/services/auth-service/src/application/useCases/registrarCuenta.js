// backend/services/auth-service/src/application/useCases/registrarCuenta.js
const { determinarRolInicial } = require('../../domain/politicaRoles');
const { validarPoliticaPassword } = require('../../domain/politicaSesion');

/**
 * Caso de Uso: Registrar una nueva cuenta
 * - Aplica invariante de seguridad: NUNCA otorga rol docente o admin en registro público (RIC-01, RIC-AC-01)
 * - Si el usuario indica intención docente, se crea como estudiante y se marca la solicitud pendiente (RIC-02)
 */
async function registrarCuenta({
    nombres,
    apellidos,
    email,
    password,
    isTeacher = false,
    userRepository,
    roleRepository,
    teacherRequestRepository,
}) {
    if (!nombres || !apellidos || !email || !password) {
        const error = new Error('Todos los campos son requeridos');
        error.statusCode = 400;
        throw error;
    }

    const passwordValidation = validarPoliticaPassword(password);
    if (!passwordValidation.valida) {
        const error = new Error(passwordValidation.motivo);
        error.statusCode = 400;
        throw error;
    }

    const normalizedEmail = String(email).toLowerCase().trim();
    const existing = await userRepository.findByEmail(normalizedEmail);
    if (existing) {
        const error = new Error('Este correo ya está registrado');
        error.statusCode = 409;
        throw error;
    }

    // Regla de dominio: Rol inicial SIEMPRE es estudiante
    const initialRoleName = determinarRolInicial();
    const role = await roleRepository.findByName(initialRoleName);
    if (!role) {
        const error = new Error('Error de configuración de roles del sistema');
        error.statusCode = 500;
        throw error;
    }

    const user = await userRepository.create({
        nombres: String(nombres).trim(),
        apellidos: String(apellidos).trim(),
        email: normalizedEmail,
        password_hash: password,
        rol_id: role.id_rol,
        carrera_interes: null,
        primer_ingreso: true,
        activo: true,
    });

    // Si el usuario solicitó ser docente en registro, registrar solicitud pendiente
    let teacherRequestPending = false;
    if (Boolean(isTeacher) && teacherRequestRepository) {
        try {
            await teacherRequestRepository.create({
                usuario_id: user.id_usuario,
                institucion: 'Pendiente de verificación',
                estado: 'pendiente',
            });
            teacherRequestPending = true;
        } catch {
            teacherRequestPending = false;
        }
    }

    return {
        user,
        roleName: initialRoleName,
        teacherRequestPending,
    };
}

module.exports = { registrarCuenta };
