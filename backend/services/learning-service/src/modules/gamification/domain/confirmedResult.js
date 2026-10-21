const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const id = (value) => typeof value === 'string' && /^[1-9]\d{0,18}$/.test(value);

function validateConfirmedResult(event) {
    if (!event || event.type !== 'ResultadoConfirmado.v1' || event.schemaVersion !== 1 || event.producer !== 'evaluation') throw new Error('Unsupported result event');
    if (!uuid.test(event.eventId) || !uuid.test(event.correlationId)) throw new Error('Invalid event identity');
    if (typeof event.occurredAt !== 'string' || !/^\d{4}-\d{2}-\d{2}T.*Z$/.test(event.occurredAt) || !Number.isFinite(Date.parse(event.occurredAt))) throw new Error('Invalid event time');
    const data = event.data;
    if (!data || !id(data.attemptId) || !id(data.userId) || data.resultVersion !== 1 || data.status !== 'confirmed') throw new Error('Only first confirmed result versions are supported; revisions require a compensation policy');
    const allowed = ['attemptId', 'userId', 'resultVersion', 'status'];
    if (Object.keys(data).some(key => !allowed.includes(key))) throw new Error('Unexpected result data');
    if (Object.keys(event).some(key => !['eventId', 'type', 'schemaVersion', 'producer', 'occurredAt', 'correlationId', 'data'].includes(key))) throw new Error('Unexpected event field');
    return event;
}

function evaluateRule(event, rule) {
    validateConfirmedResult(event);
    if (!rule || !/^[a-z][a-z0-9_.-]{1,63}$/.test(rule.id) || !Number.isSafeInteger(rule.version) || rule.version < 1 || !Number.isSafeInteger(rule.points) || rule.points < 0 || rule.points > 10000 || rule.enabled !== true) throw new Error('An explicit enabled versioned rule is required');
    return {
        userId: event.data.userId, sourceId: event.data.attemptId,
        sourceType: 'confirmed-result', ruleId: rule.id, ruleVersion: rule.version, points: rule.points,
    };
}
module.exports = { validateConfirmedResult, evaluateRule };
