class PlanningError extends Error {
    constructor(code, message, status = 400) {
        super(message);
        this.name = 'PlanningError';
        this.code = code;
        this.status = status;
    }
}

const fail = (code, message, status = 400) => {
    throw new PlanningError(code, message, status);
};

const positiveId = (value) => {
    if (!/^[1-9]\d*$/.test(String(value)) || !Number.isSafeInteger(Number(value))) {
        fail('INVALID_ID', 'Identificador numérico inválido');
    }
    return Number(value);
};

const DEFAULT_TIMEZONE = 'America/Lima';

const validateTimeZone = (timeZone) => {
    if (!timeZone) return DEFAULT_TIMEZONE;
    try {
        Intl.DateTimeFormat(undefined, { timeZone });
        return timeZone;
    } catch (e) {
        fail('INVALID_TIMEZONE', `Zona horaria no válida: ${timeZone}`);
    }
};

const normalizeDays = (days) => {
    if (!Array.isArray(days)) return [1, 2, 3, 4, 5];
    const unique = [...new Set(days.map((d) => Number(d)).filter((d) => d >= 0 && d <= 6))];
    return unique.length ? unique.sort((a, b) => a - b) : [1, 2, 3, 4, 5];
};

const normalizeTime = (time, fallback = '18:00') => {
    if (typeof time === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(time)) {
        return time;
    }
    return fallback;
};

const validateStudyHours = (startTime, endTime) => {
    const start = normalizeTime(startTime, '18:00');
    const end = normalizeTime(endTime, '21:00');
    if (start >= end) {
        fail('INVALID_TIME_RANGE', 'La hora de inicio debe ser anterior a la hora de fin');
    }
    return { startTime: start, endTime: end };
};

const POMODORO_STATES = ['idle', 'running', 'paused', 'completed'];

const transitionPomodoro = (currentState, action) => {
    const validState = POMODORO_STATES.includes(currentState) ? currentState : 'idle';
    switch (action) {
        case 'start':
            if (validState === 'idle' || validState === 'completed') return 'running';
            fail('INVALID_POMODORO_ACTION', `No se puede iniciar Pomodoro en estado ${validState}`);
            break;
        case 'pause':
            if (validState === 'running') return 'paused';
            fail('INVALID_POMODORO_ACTION', 'Solo se puede pausar un Pomodoro en ejecución');
            break;
        case 'resume':
            if (validState === 'paused') return 'running';
            fail('INVALID_POMODORO_ACTION', 'Solo se puede reanudar un Pomodoro pausado');
            break;
        case 'finish':
            if (validState === 'running' || validState === 'paused') return 'completed';
            fail('INVALID_POMODORO_ACTION', 'No se puede finalizar un Pomodoro inactivo');
            break;
        case 'reset':
            return 'idle';
        default:
            fail('UNKNOWN_POMODORO_ACTION', `Acción de Pomodoro desconocida: ${action}`);
    }
};

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const validateLessonCompletedEvent = (event) => {
    if (!event || event.type !== 'LeccionCompletada.v1' || event.schemaVersion !== 1 || event.producer !== 'content') {
        fail('INVALID_EVENT_TYPE', 'Tipo de evento no compatible; se espera LeccionCompletada.v1');
    }
    if (!event.eventId || !event.correlationId || !event.occurredAt || !event.data) {
        fail('INVALID_EVENT_FORMAT', 'Faltan campos obligatorios en el evento');
    }
    const { lessonId, userId } = event.data;
    if (!lessonId || !userId) {
        fail('MISSING_EVENT_DATA', 'lessonId y userId son requeridos en el evento de lección');
    }
    return event;
};

module.exports = {
    PlanningError,
    fail,
    positiveId,
    DEFAULT_TIMEZONE,
    validateTimeZone,
    normalizeDays,
    normalizeTime,
    validateStudyHours,
    POMODORO_STATES,
    transitionPomodoro,
    validateLessonCompletedEvent,
};
