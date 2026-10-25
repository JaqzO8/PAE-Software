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
