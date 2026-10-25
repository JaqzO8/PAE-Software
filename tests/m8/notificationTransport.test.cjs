/**
 * @file notificationTransport.test.cjs
 * Pruebas de contrato y comportamiento para canal de transporte de avisos (RIC-14 / M8-HU07).
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const { NotificationTransport, sanitizeNotificationPayload } = require('../../backend/services/auth-service/src/services/notificationTransport');

test.beforeEach(() => {
    NotificationTransport.resetCache();
});

test('RIC-14: sanitizeNotificationPayload elimina contraseñas, tokens y OTPs de las plantillas', () => {
    const rawData = {
        studentName: 'Ana Lopez',
        courseName: 'Calculo I',
        password: 'Password123!',
        token: 'eyJh...secretToken',
        otp: '123456',
        nested: {
            score: 18,
            secret: 'top_secret',
            comment: 'Buen progreso',
        },
    };

    const sanitized = sanitizeNotificationPayload(rawData);

    assert.equal(sanitized.studentName, 'Ana Lopez');
    assert.equal(sanitized.courseName, 'Calculo I');
    assert.equal(sanitized.password, undefined);
    assert.equal(sanitized.token, undefined);
    assert.equal(sanitized.otp, undefined);
    assert.equal(sanitized.nested.score, 18);
    assert.equal(sanitized.nested.secret, undefined);
    assert.equal(sanitized.nested.comment, 'Buen progreso');
});

test('RIC-14: sendNotification entrega con éxito y devuelve estado enviado con ID único', async () => {
    const transport = new NotificationTransport();
    const result = await transport.sendNotification({
        idempotencyKey: 'msg_event_001',
        recipient: 'estudiante@test.edu',
        templateId: 'NUEVO_RECURSO_PUBLICADO',
        data: {
            title: 'Guía de derivadas',
            author: 'Prof. Gomez',
            token: 'should_not_pass',
        },
    });

    assert.equal(result.status, 'enviado');
    assert.equal(result.idempotencyKey, 'msg_event_001');
    assert.match(result.deliveryId, /^del_/);
    assert.equal(result.deduplicated, false);
    assert.equal(result.sanitizedPayload.token, undefined);
    assert.equal(result.sanitizedPayload.title, 'Guía de derivadas');
});

test('RIC-14: reintento con la misma clave de idempotencia devuelve registro previo sin duplicar', async () => {
    let callCount = 0;
    const transport = new NotificationTransport({
        sendAdapter: async () => {
            callCount++;
            return { delivered: true, providerId: 'prov_test_1' };
        },
    });

    const first = await transport.sendNotification({
        idempotencyKey: 'same_key_999',
        recipient: 'estudiante@test.edu',
        templateId: 'RECORDATORIO_EXAMEN',
        data: { exam: 'Final Fisica' },
    });

    const second = await transport.sendNotification({
        idempotencyKey: 'same_key_999',
        recipient: 'estudiante@test.edu',
        templateId: 'RECORDATORIO_EXAMEN',
        data: { exam: 'Final Fisica' },
    });

    assert.equal(callCount, 1, 'El adaptador de envío solo debe llamarse una vez');
    assert.equal(second.deduplicated, true);
    assert.equal(second.deliveryId, first.deliveryId);
    assert.equal(second.status, 'enviado');
});

test('RIC-14: error de transporte devuelve estado fallido sin lanzar excepción no controlada', async () => {
    const transport = new NotificationTransport({
        sendAdapter: async () => {
            throw new Error('Servicio de correo temporalmente no disponible');
        },
    });

    const result = await transport.sendNotification({
        idempotencyKey: 'msg_failed_001',
        recipient: 'invalido@test.edu',
        templateId: 'BIENVENIDA',
    });

    assert.equal(result.status, 'fallido');
    assert.match(result.error, /temporalmente no disponible/);
    assert.equal(result.deduplicated, false);
});
