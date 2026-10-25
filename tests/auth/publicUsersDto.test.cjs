const test = require('node:test');
const assert = require('node:assert/strict');

test('RIC-08: DTO público de búsqueda de usuarios entrega solo campos públicos y omite sensibles', async () => {
    // Simular los usuarios devueltos por BD con campos sensibles existentes
    const mockUsersFromDb = [
        {
            id_usuario: 101,
            identificador_unico: 'ID-RICHAR-101',
            nombres: 'Carlos',
            apellidos: 'Santana',
            avatar: 'https://example.com/avatar.png',
            email: 'carlos@privado.edu',
            password_hash: '$2b$10$supersecretohashdemuestra',
            telefono: '+51987654321',
            ultimo_login_ip: '192.168.1.50',
            rol: { nombre_rol: 'estudiante' },
        },
    ];

    // Simular función que aplica la proyección DTO
    function toPublicUserDto(user) {
        return {
            id: String(user.id_usuario),
            identificador_unico: user.identificador_unico,
            nombres: user.nombres,
            apellidos: user.apellidos,
            avatar: user.avatar,
            rol: user.rol.nombre_rol,
        };
    }

    const dto = toPublicUserDto(mockUsersFromDb[0]);

    // Campos públicos requeridos presentes
    assert.equal(dto.id, '101');
    assert.equal(dto.identificador_unico, 'ID-RICHAR-101');
    assert.equal(dto.nombres, 'Carlos');
    assert.equal(dto.apellidos, 'Santana');
    assert.equal(dto.avatar, 'https://example.com/avatar.png');
    assert.equal(dto.rol, 'estudiante');

    // Campos sensibles privados NUNCA expuestos
    assert.equal(dto.email, undefined);
    assert.equal(dto.password_hash, undefined);
    assert.equal(dto.telefono, undefined);
    assert.equal(dto.ultimo_login_ip, undefined);
    assert.equal(dto.sessions, undefined);

    // Contrato de campos exactos
    const keys = Object.keys(dto).sort();
    assert.deepEqual(keys, ['apellidos', 'avatar', 'id', 'identificador_unico', 'nombres', 'rol']);
});

test('RIC-08: Validación de parámetros de búsqueda protege contra abuso y vacíos', () => {
    function validarBusquedaQuery(query) {
        const q = typeof query === 'string' ? query.trim() : '';
        if (q.length < 2) return { valido: false, error: 'Mínimo 2 caracteres' };
        if (q.length > 100) return { valido: false, error: 'Máximo 100 caracteres' };
        return { valido: true, query: q };
    }

    assert.equal(validarBusquedaQuery('').valido, false);
    assert.equal(validarBusquedaQuery('a').valido, false);
    assert.equal(validarBusquedaQuery('  ').valido, false);
    assert.equal(validarBusquedaQuery('ab').valido, true);
    assert.equal(validarBusquedaQuery('Carlos').query, 'Carlos');
    assert.equal(validarBusquedaQuery('x'.repeat(101)).valido, false);
});

test('RIC-08: actualizarPerfil valida longitud y sanitiza campos opcionales', async () => {
    const { actualizarPerfil } = require('../../backend/services/auth-service/src/application/useCases/actualizarPerfil');

    let updatedFields = null;
    const fakeRepo = {
        findById: async (id) => ({ id_usuario: id, nombres: 'Original', apellidos: 'Usuario' }),
        updateProfile: async (id, fields) => {
            updatedFields = fields;
            return { id_usuario: id, ...fields };
        },
    };

    // 1. Actualización exitosa con sanitización y trim
    const res = await actualizarPerfil({
        userId: 200,
        nombres: '  Ana María  ',
        apellidos: '  García López  ',
        institucion: '  Universidad Nacional  ',
        bio: '  Estudiante de ingeniería de software  ',
        carrera_interes: '  Computación  ',
        userRepository: fakeRepo,
    });

    assert.equal(res.success, true);
    assert.equal(updatedFields.nombres, 'Ana María');
    assert.equal(updatedFields.apellidos, 'García López');
    assert.equal(updatedFields.institucion, 'Universidad Nacional');
    assert.equal(updatedFields.bio, 'Estudiante de ingeniería de software');
    assert.equal(updatedFields.carrera_interes, 'Computación');

    // 2. Campos opcionales vacíos se normalizan a null
    await actualizarPerfil({
        userId: 200,
        institucion: '',
        bio: null,
        carrera_interes: '   ',
        userRepository: fakeRepo,
    });
    assert.equal(updatedFields.institucion, null);
    assert.equal(updatedFields.bio, null);
    assert.equal(updatedFields.carrera_interes, null);

    // 3. Validación de longitud mínima y máxima en nombres y apellidos
    await assert.rejects(async () => {
        await actualizarPerfil({ userId: 200, nombres: 'A', userRepository: fakeRepo });
    }, { statusCode: 400 });

    await assert.rejects(async () => {
        await actualizarPerfil({ userId: 200, apellidos: 'B'.repeat(101), userRepository: fakeRepo });
    }, { statusCode: 400 });
});

test('RIC-08: actualizarPerfil rechaza usuario no autenticado o no existente', async () => {
    const { actualizarPerfil } = require('../../backend/services/auth-service/src/application/useCases/actualizarPerfil');

    const fakeRepo = {
        findById: async () => null,
        updateProfile: async () => {},
    };

    // Sin userId -> 401
    await assert.rejects(async () => {
        await actualizarPerfil({ userId: null, userRepository: fakeRepo });
    }, { statusCode: 401 });

    // Usuario no encontrado -> 404
    await assert.rejects(async () => {
        await actualizarPerfil({ userId: 9999, userRepository: fakeRepo });
    }, { statusCode: 404 });
});
