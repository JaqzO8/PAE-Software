// tests/auth/roleSecurity.test.cjs
// Pruebas automatizadas de seguridad de roles y prevención de autoasignación docente (RIC-01, RIC-02, RIC-03, RIC-AC-01)

const { test } = require('node:test');
const assert = require('node:assert/strict');
const {
    determinarRolInicial,
    esRolPrivilegiado,
    puedeAsignarRol,
    esRolValido,
} = require('../../backend/services/auth-service/src/domain/politicaRoles');
const { registrarCuenta } = require('../../backend/services/auth-service/src/application/useCases/registrarCuenta');
const { solicitarHabilitacion, aprobarHabilitacion, asignarRolDocenteDirecto } = require('../../backend/services/auth-service/src/application/useCases/habilitacionDocente');

test('RIC-01 / RIC-AC-01: política de dominio nunca otorga rol docente o admin en registro', () => {
    assert.equal(determinarRolInicial(), 'estudiante');
    assert.equal(esRolPrivilegiado('docente'), true);
    assert.equal(esRolPrivilegiado('admin'), true);
    assert.equal(esRolPrivilegiado('estudiante'), false);
    assert.equal(esRolValido('estudiante'), true);
    assert.equal(esRolValido('docente'), true);
    assert.equal(esRolValido('admin'), true);
    assert.equal(esRolValido('superusuario'), false);
});

test('RIC-01 / RIC-AC-01: registrarCuenta ignora isTeacher=true y crea usuario como estudiante', async () => {
    let createdPayload = null;
    let requestRecorded = false;

    const fakeUserRepo = {
        findByEmail: async () => null,
        create: async (data) => {
            createdPayload = data;
            return { id_usuario: 101, ...data };
        },
    };

    const fakeRoleRepo = {
        findByName: async (name) => ({ id_rol: name === 'estudiante' ? 1 : 2, nombre_rol: name }),
    };

    const fakeTeacherRequestRepo = {
        create: async () => {
            requestRecorded = true;
            return { id_solicitud: 1 };
        },
    };

    const result = await registrarCuenta({
        nombres: 'Estudiante',
        apellidos: 'Prueba',
        email: 'estudiante.hacker@pae.edu',
        password: 'Password123!',
        isTeacher: true, // Intento de autoasignarse rol docente
        userRepository: fakeUserRepo,
        roleRepository: fakeRoleRepo,
        teacherRequestRepository: fakeTeacherRequestRepo,
    });

    assert.equal(result.roleName, 'estudiante', 'El rol asignado debe ser estudiante');
    assert.equal(createdPayload.rol_id, 1, 'rol_id debe corresponder a estudiante');
    assert.equal(result.teacherRequestPending, true, 'Se registra solicitud docente pendiente de verificación');
});

test('RIC-02 / RIC-03: solo un administrador puede aprobar o asignar rol docente', async () => {
    assert.equal(puedeAsignarRol('estudiante', 'docente'), false, 'Estudiante no puede asignar docente');
    assert.equal(puedeAsignarRol('docente', 'docente'), false, 'Docente no puede auto-aprobarse');
    assert.equal(puedeAsignarRol('admin', 'docente'), true, 'Admin sí puede asignar docente');
    assert.equal(puedeAsignarRol('admin', 'admin'), true, 'Admin puede asignar admin');
});

test('RIC-02 / M1-S03: flujo completo de solicitud y aprobación docente', async () => {
    let updatedRoleId = null;
    let requestStatus = null;

    const fakeUserRepo = {
        findById: async (id) => ({ id_usuario: id, rol: 'estudiante', activo: true }),
        updateRole: async (id, rolId) => { updatedRoleId = rolId; },
    };

    const fakeRequestRepo = {
        create: async (data) => ({ id_solicitud: 55, ...data }),
        findById: async (id) => ({ id_solicitud: id, usuario_id: 101, estado: 'pendiente' }),
        updateStatus: async (id, status, reviewer) => { requestStatus = status; },
    };

    const fakeRoleRepo = {
        findByName: async (name) => ({ id_rol: name === 'docente' ? 2 : 1, nombre_rol: name }),
    };

    // 1. Estudiante solicita rol docente con institución válida
    const solResult = await solicitarHabilitacion({
        userId: 101,
        institucion: 'Colegio Nacional Amazonas',
        evidencia: 'Constancia docente 2026.pdf',
        userRepository: fakeUserRepo,
        requestRepository: fakeRequestRepo,
    });
    assert.equal(solResult.success, true);

    // 2. Intento de aprobación por un estudiante -> debe ser denegado con 403
    await assert.rejects(async () => {
        await aprobarHabilitacion({
            adminUser: { id: 102, rol: 'estudiante' },
            solicitudId: 55,
            requestRepository: fakeRequestRepo,
            userRepository: fakeUserRepo,
            roleRepository: fakeRoleRepo,
        });
    }, { statusCode: 403 });

    // 3. Aprobación por un administrador legítimo -> debe tener éxito
    const aprResult = await aprobarHabilitacion({
        adminUser: { id: 1, rol: 'admin' },
        solicitudId: 55,
        requestRepository: fakeRequestRepo,
        userRepository: fakeUserRepo,
        roleRepository: fakeRoleRepo,
    });
    assert.equal(aprResult.success, true);
    assert.equal(updatedRoleId, 2, 'El rol del usuario fue actualizado a docente');
    assert.equal(requestStatus, 'aprobada');
});

test('RIC-03 / M1-S03-01: asignación manual directa de rol docente por administrador', async () => {
    let assignedRoleId = null;
    const fakeUserRepo = {
        findById: async (id) => ({ id_usuario: id, rol: 'estudiante' }),
        updateRole: async (id, rolId) => { assignedRoleId = rolId; },
    };
    const fakeRoleRepo = {
        findByName: async () => ({ id_rol: 2, nombre_rol: 'docente' }),
    };

    const result = await asignarRolDocenteDirecto({
        adminUser: { id: 1, rol: 'admin' },
        targetUserId: 205,
        userRepository: fakeUserRepo,
        roleRepository: fakeRoleRepo,
    });

    assert.equal(result.success, true);
    assert.equal(assignedRoleId, 2, 'El rol asignado por admin debe ser docente');
});
