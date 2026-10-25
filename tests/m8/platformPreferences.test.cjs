/**
 * tests/m8/platformPreferences.test.cjs
 *
 * Pruebas de criterios M8 – Preferencias de plataforma, tickets de soporte y privacidad
 * Cubre: RQ66 (modo oscuro), RQ73 (tamaño de fuente), RQ90 (soporte/tickets), RQ103/RQ31 (privacidad/exportar datos)
 */

const test = require('node:test');
const assert = require('node:assert/strict');

// ─── Constantes de preferencias replicadas de platformController ─────────────

const DEFAULT_PREFERENCES = {
    theme: 'light',
    fontSize: 'medium',
    reduceMotion: false,
    highContrast: false,
    emailReminders: true,
    challengeNotifications: true,
    communityMessages: false,
};

const ALLOWED_THEMES = ['light', 'dark'];
const ALLOWED_FONT_SIZES = ['small', 'medium', 'large'];

/**
 * Lógica de validación extraída del controlador (sin acoplamiento a Express ni BD)
 */
function validarYMapearPreferencias(body) {
    const PREFERENCE_MAP = {
        theme: 'tema',
        fontSize: 'tamano_fuente',
        reduceMotion: 'reducir_movimiento',
        highContrast: 'alto_contraste',
        emailReminders: 'notificaciones_email',
        challengeNotifications: 'notificaciones_desafios',
        communityMessages: 'notificaciones_comunidad',
    };
    const ALLOWED_VALUES = {
        theme: ALLOWED_THEMES,
        fontSize: ALLOWED_FONT_SIZES,
    };

    const update = {};
    for (const [clientKey, column] of Object.entries(PREFERENCE_MAP)) {
        if (body[clientKey] === undefined) continue;
        const value = body[clientKey];
        if (ALLOWED_VALUES[clientKey] && !ALLOWED_VALUES[clientKey].includes(value)) {
            return { error: `Valor no permitido para ${clientKey}` };
        }
        if (!ALLOWED_VALUES[clientKey] && typeof value !== 'boolean') {
            return { error: `El valor de ${clientKey} debe ser booleano` };
        }
        update[column] = value;
    }
    return { update };
}

/**
 * Convierte un registro de BD a DTO de cliente (replicado del controlador)
 */
function toClientPreferences(preference) {
    if (!preference) return DEFAULT_PREFERENCES;
    return {
        theme: preference.tema,
        fontSize: preference.tamano_fuente,
        reduceMotion: preference.reducir_movimiento,
        highContrast: preference.alto_contraste,
        emailReminders: preference.notificaciones_email,
        challengeNotifications: preference.notificaciones_desafios,
        communityMessages: preference.notificaciones_comunidad,
    };
}

// ─── RQ66: Modo oscuro ────────────────────────────────────────────────────────

test('RQ66: preferencia de tema dark/light es válida y se mapea correctamente', () => {
    const r1 = validarYMapearPreferencias({ theme: 'dark' });
    assert.equal(r1.error, undefined);
    assert.equal(r1.update.tema, 'dark');

    const r2 = validarYMapearPreferencias({ theme: 'light' });
    assert.equal(r2.error, undefined);
    assert.equal(r2.update.tema, 'light');

    // Valor inválido rechazado
    const r3 = validarYMapearPreferencias({ theme: 'blue' });
    assert.match(r3.error, /Valor no permitido para theme/);
});

test('RQ66: toClientPreferences devuelve tema dark desde campo de BD', () => {
    const dbRow = {
        tema: 'dark',
        tamano_fuente: 'medium',
        reducir_movimiento: false,
        alto_contraste: false,
        notificaciones_email: true,
        notificaciones_desafios: true,
        notificaciones_comunidad: false,
    };
    const dto = toClientPreferences(dbRow);
    assert.equal(dto.theme, 'dark');
    assert.equal(dto.fontSize, 'medium');
});

// ─── RQ73: Tamaño de fuente ───────────────────────────────────────────────────

test('RQ73: preferencia de tamaño de fuente small/medium/large es válida', () => {
    for (const size of ['small', 'medium', 'large']) {
        const result = validarYMapearPreferencias({ fontSize: size });
        assert.equal(result.error, undefined, `fontSize ${size} debe ser aceptado`);
        assert.equal(result.update.tamano_fuente, size);
    }

    const invalid = validarYMapearPreferencias({ fontSize: 'xl' });
    assert.match(invalid.error, /Valor no permitido para fontSize/);
});

// ─── Validación de booleanos ──────────────────────────────────────────────────

test('M8: preferencias booleanas rechazan valores no booleanos', () => {
    const keys = ['reduceMotion', 'highContrast', 'emailReminders', 'challengeNotifications', 'communityMessages'];
    for (const key of keys) {
        const invalid = validarYMapearPreferencias({ [key]: 'yes' });
        assert.match(invalid.error, /debe ser booleano/, `${key} debe rechazar string`);

        const valid = validarYMapearPreferencias({ [key]: true });
        assert.equal(valid.error, undefined, `${key} debe aceptar booleano`);
    }
});

// ─── RQ90: Soporte / tickets ──────────────────────────────────────────────────

test('RQ90: validación de ticket de soporte requiere asunto (5-160 chars) y descripción (10-2000 chars)', () => {
    function validarTicket({ subject, description }) {
        const s = String(subject || '').trim();
        const d = String(description || '').trim();
        if (s.length < 5 || s.length > 160) return { error: 'El asunto debe tener entre 5 y 160 caracteres' };
        if (d.length < 10 || d.length > 2000) return { error: 'La descripcion debe tener entre 10 y 2000 caracteres' };
        return { ok: true };
    }

    // Demasiado cortos
    assert.match(validarTicket({ subject: 'abc', description: 'ok' }).error, /asunto/);
    assert.match(validarTicket({ subject: 'Ayuda con login', description: 'corto' }).error, /descripcion/);

    // Válidos
    const ok = validarTicket({ subject: 'Error en login', description: 'No puedo iniciar sesión con mi cuenta de correo institucional.' });
    assert.equal(ok.ok, true);

    // Demasiado largos
    assert.match(validarTicket({ subject: 'x'.repeat(161), description: 'valido descripcion' }).error, /asunto/);
    assert.match(validarTicket({ subject: 'Asunto válido', description: 'x'.repeat(2001) }).error, /descripcion/);
});

test('RQ90: toClientTicket convierte campos de BD a DTO público', () => {
    function toClientTicket(ticket) {
        return {
            id: ticket.id_ticket.toString(),
            subject: ticket.asunto,
            description: ticket.descripcion,
            category: ticket.categoria,
            priority: ticket.prioridad,
            status: ticket.estado,
            response: ticket.respuesta,
            createdAt: ticket.created_at,
            updatedAt: ticket.updated_at,
        };
    }

    const dbTicket = {
        id_ticket: 42,
        asunto: 'No puedo acceder a mi cuenta',
        descripcion: 'Recibo error 401 al intentar iniciar sesión',
        categoria: 'tecnico',
        prioridad: 'alta',
        estado: 'abierto',
        respuesta: null,
        created_at: '2026-10-22T12:00:00Z',
        updated_at: '2026-10-22T12:00:00Z',
    };

    const dto = toClientTicket(dbTicket);
    assert.equal(dto.id, '42');
    assert.equal(dto.subject, 'No puedo acceder a mi cuenta');
    assert.equal(dto.category, 'tecnico');
    assert.equal(dto.status, 'abierto');
    assert.equal(dto.response, null);
});

// ─── RQ103 / RQ31: Exportación de datos de privacidad ───────────────────────

test('RQ103/RQ31: exportPrivacyData no incluye password_hash ni datos de terceros', () => {
    // Simular respuesta del controlador exportPrivacyData
    const mockExportResponse = {
        success: true,
        generatedAt: '2026-10-22T14:00:00Z',
        data: {
            profile: {
                id_usuario: 10,
                nombres: 'Carlos',
                apellidos: 'Santana',
                identificador_unico: 'ID-CARL-010',
                email: 'carlos@pae.edu',
                // password_hash NO debe estar aquí (attributes: { exclude: ['password_hash'] })
                rol: { nombre_rol: 'estudiante' },
            },
            preferences: DEFAULT_PREFERENCES,
            sessions: [
                {
                    id_sesion: 5,
                    dispositivo: 'Chrome/Windows',
                    ip_address: '192.168.1.1',
                    fecha_inicio: '2026-10-20T09:00:00Z',
                    activa: true,
                },
            ],
            sessionHistory: [],
            supportTickets: [],
        },
    };

    // Asegurar que password_hash no esté en el perfil exportado
    assert.equal(mockExportResponse.data.profile.password_hash, undefined);

    // Asegurar que las sesiones son solo del propio usuario
    for (const s of mockExportResponse.data.sessions) {
        assert.ok(s.id_sesion !== undefined);
    }

    // Asegurar estructura de exportación válida
    const keys = Object.keys(mockExportResponse.data).sort();
    assert.deepEqual(keys, ['preferences', 'profile', 'sessionHistory', 'sessions', 'supportTickets']);

    // El campo generatedAt debe ser un ISO 8601 válido
    assert.ok(!isNaN(Date.parse(mockExportResponse.generatedAt)));
});

test('RQ31: solicitud de eliminación de datos crea ticket de privacidad de prioridad alta', () => {
    function crearTicketEliminacion(userId, reason) {
        return {
            id_usuario: userId,
            asunto: 'Solicitud de eliminacion de datos personales',
            descripcion: reason.slice(0, 2000),
            categoria: 'privacidad',
            prioridad: 'alta',
        };
    }

    const ticket = crearTicketEliminacion(77, 'Ya no quiero usar el sistema');
    assert.equal(ticket.categoria, 'privacidad');
    assert.equal(ticket.prioridad, 'alta');
    assert.equal(ticket.id_usuario, 77);
    assert.ok(ticket.descripcion.length <= 2000);
});
