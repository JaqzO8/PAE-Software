/**
 * @file notificationTransport.js
 * Canal de transporte de notificaciones desacoplado y reutilizable (RIC-14 / RQ109 / M8-HU07).
 *
 * Invariantes y reglas de diseño:
 * 1. El llamador (Juan en Contenido, Amelia en Evaluación, José en Comunidad) decide
 *    destinatario, plantilla y hecho de negocio.
 * 2. Idempotencia y deduplicación: si la misma clave de idempotencia se repite,
 *    se devuelve el registro existente sin retransmitir ni duplicar el envío.
 * 3. Sanitización de plantilla: se eliminan campos sensibles (passwords, tokens, OTPs, hashes).
 * 4. Estados verificables: 'pendiente' (encolado), 'enviado' (aceptado por transporte),
 *    'fallido' (error de destino/proveedor).
 */

const crypto = require('crypto');

// Memoria de deduplicación con TTL (para tests y entorno sin Redis)
const processedDeliveries = new Map();
const MAX_DELIVERIES_HISTORY = 500;

const SENSITIVE_KEYS = new Set([
    'password',
    'password_hash',
    'contrasena',
    'token',
    'access_token',
    'secret',
    'otp',
    'mfa_code',
    'codigo',
]);

/**
 * Sanitiza los datos de plantilla para evitar fuga de información sensible.
 * @param {Record<string, unknown>} data
 * @returns {Record<string, unknown>}
 */
function sanitizeNotificationPayload(data = {}) {
    if (!data || typeof data !== 'object') return {};
    const sanitized = {};
    for (const [key, value] of Object.entries(data)) {
        if (SENSITIVE_KEYS.has(key.toLowerCase())) {
            continue; // Se omite campo sensible
        }
        if (value && typeof value === 'object' && !Array.isArray(value)) {
            sanitized[key] = sanitizeNotificationPayload(value);
        } else {
            sanitized[key] = value;
        }
    }
    return sanitized;
}

/**
 * Transportador de notificaciones.
 * Soporta inyección de cliente de envío para pruebas y mocks.
 */
class NotificationTransport {
    constructor({ sendAdapter = null, now = () => new Date() } = {}) {
        this.sendAdapter = sendAdapter || this._defaultSendAdapter.bind(this);
        this.now = now;
    }

    async _defaultSendAdapter({ recipient, templateId, payload }) {
        // Adaptador por defecto: simula envío seguro local/test
        if (!recipient) {
            throw new Error('Destinatario no especificado');
        }
        return {
            delivered: true,
            providerId: `prov_${crypto.randomBytes(8).toString('hex')}`,
        };
    }

    /**
     * Envía una notificación de forma idempotente.
     * @param {Object} params
     * @param {string} params.idempotencyKey - Clave única de deduplicación
     * @param {string} params.recipient - Correo o identificador de destino
     * @param {string} params.templateId - Identificador de plantilla de aviso
     * @param {Object} params.data - Datos de la plantilla
     * @param {string} [params.channel='email'] - Canal (email, in-app, etc.)
     */
    async sendNotification({ idempotencyKey, recipient, templateId, data = {}, channel = 'email' }) {
        if (!idempotencyKey || typeof idempotencyKey !== 'string') {
            throw new Error('idempotencyKey es obligatoria para garantizar entrega única');
        }
        if (!recipient || typeof recipient !== 'string') {
            throw new Error('recipient es obligatorio');
        }
        if (!templateId || typeof templateId !== 'string') {
            throw new Error('templateId es obligatorio');
        }

        // Deduplicación por idempotencyKey
        if (processedDeliveries.has(idempotencyKey)) {
            const existing = processedDeliveries.get(idempotencyKey);
            return {
                ...existing,
                deduplicated: true,
            };
        }

        const sanitizedData = sanitizeNotificationPayload(data);
        const deliveryId = `del_${crypto.randomBytes(12).toString('hex')}`;
        const timestamp = this.now().toISOString();

        try {
            const result = await this.sendAdapter({
                recipient,
                templateId,
                payload: sanitizedData,
                channel,
            });

            const deliveryRecord = {
                deliveryId,
                idempotencyKey,
                recipient,
                templateId,
                status: result.delivered ? 'enviado' : 'pendiente',
                channel,
                providerId: result.providerId || null,
                timestamp,
                sanitizedPayload: sanitizedData,
                deduplicated: false,
            };

            // Guardar en caché de deduplicación
            if (processedDeliveries.size >= MAX_DELIVERIES_HISTORY) {
                const oldestKey = processedDeliveries.keys().next().value;
                processedDeliveries.delete(oldestKey);
            }
            processedDeliveries.set(idempotencyKey, deliveryRecord);

            return deliveryRecord;
        } catch (error) {
            const failedRecord = {
                deliveryId,
                idempotencyKey,
                recipient,
                templateId,
                status: 'fallido',
                channel,
                error: error.message,
                timestamp,
                deduplicated: false,
            };
            return failedRecord;
        }
    }

    /**
     * Limpia la caché de entregas (útil para tests).
     */
    static resetCache() {
        processedDeliveries.clear();
    }
}

module.exports = {
    NotificationTransport,
    sanitizeNotificationPayload,
};
