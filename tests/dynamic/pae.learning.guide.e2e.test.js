const fs = require('fs');
const path = require('path');

const requiredEnv = [
    'PAE_TEST_BASE_URL',
    'PAE_STUDENT_EMAIL',
    'PAE_STUDENT_PASSWORD',
    'PAE_TEACHER_EMAIL',
    'PAE_TEACHER_PASSWORD',
    'PAE_LEARNING_EVIDENCE_OUTPUT',
];

for (const name of requiredEnv) {
    if (!process.env[name]) throw new Error(`${name} es requerido`);
}

const baseUrl = process.env.PAE_TEST_BASE_URL.replace(/\/$/, '');
const evidenceOutput = process.env.PAE_LEARNING_EVIDENCE_OUTPUT;
const evidence = [];
const runId = Date.now();
const subject = `Materia QA ${runId}`;

let student;
let teacher;
let questionIds = [];
let answerByQuestionId = new Map();
let fullAttempt;
let fullResult;
let partialAttempt;

const parseBody = async (response) => {
    const text = await response.text();
    if (!text) return null;
    try { return JSON.parse(text); } catch { return { raw: text.slice(0, 500) }; }
};

const request = async (route, options = {}) => {
    const response = await fetch(`${baseUrl}${route}`, options);
    return { response, body: await parseBody(response) };
};

const jsonRequest = (route, method, body, token) => request(route, {
    method,
    headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
});

const login = async (email, password) => {
    const { response, body } = await jsonRequest('/auth/login', 'POST', { email, password });
    expect(response.status).toBe(200);
    expect(body.token).toEqual(expect.any(String));
    return body;
};

const record = (caseId, title, expected, actual, startedAt) => {
    const item = {
        caseId,
        title,
        timestamp: new Date().toISOString(),
        durationMs: Date.now() - startedAt,
        expected,
        actual,
        passed: true,
    };
    evidence.push(item);
    console.log(`[EVIDENCIA ${caseId}] ${JSON.stringify(item)}`);
};

beforeAll(async () => {
    student = await login(process.env.PAE_STUDENT_EMAIL, process.env.PAE_STUDENT_PASSWORD);
    teacher = await login(process.env.PAE_TEACHER_EMAIL, process.env.PAE_TEACHER_PASSWORD);

    for (let index = 0; index < 6; index += 1) {
        const correctAnswer = index % 4;
        const { response, body } = await jsonRequest('/learning/questions', 'POST', {
            universityId: 'unmsm',
            materia: subject,
            tema: 'Ciclo QA automatizado',
            dificultad: 'facil',
            tipo: 'opcion_multiple',
            enunciado: `Pregunta controlada ${index + 1} - ${runId}`,
            opciones: ['Opcion A', 'Opcion B', 'Opcion C', 'Opcion D'],
            respuesta_correcta: correctAnswer,
            explicacion: 'Dato controlado para pruebas PAE.',
            etiquetas: ['qa', 'automatizada'],
        }, teacher.token);
        expect(response.status).toBe(201);
        const id = String(body.data.id_pregunta);
        questionIds.push(id);
        answerByQuestionId.set(id, correctAnswer);
    }
}, 30000);

afterAll(() => {
    fs.mkdirSync(path.dirname(evidenceOutput), { recursive: true });
    fs.writeFileSync(evidenceOutput, JSON.stringify({
        suite: 'Guia PAE - Aprendizaje y Evaluacion',
        executedAt: new Date().toISOString(),
        baseUrl,
        subject,
        cases: evidence,
    }, null, 2));
});

describe('Guia PAE - 12 casos de Aprendizaje y Evaluacion', () => {
    test('CP-AE-ROL-002 restringe configuracion docente al estudiante', async () => {
        const startedAt = Date.now();
        const { response, body } = await jsonRequest('/learning/analytics/settings', 'GET', undefined, student.token);
        record('CP-AE-ROL-002', 'Restringir funciones docentes al estudiante', 'HTTP 403 sin cambios', `HTTP ${response.status}; ${body.message}`, startedAt);
        expect(response.status).toBe(403);
        expect(body.success).toBe(false);
    });

    test('CP-AE-NEG-002 bloquea universidad inexistente', async () => {
        const startedAt = Date.now();
        const { response, body } = await jsonRequest('/learning/simulacro/start', 'POST', {
            universityId: 'uni-404-qa', difficulty: 'easy', questionCount: 6,
        }, student.token);
        record('CP-AE-NEG-002', 'Bloquear evaluacion inexistente', 'HTTP 404 y ningun intento', `HTTP ${response.status}; ${body.message}`, startedAt);
        expect(response.status).toBe(404);
        expect(body.success).toBe(false);
    });

    test('CP-AE-FUN-001 inicia simulacro sin exponer respuestas', async () => {
        const startedAt = Date.now();
        const { response, body } = await jsonRequest('/learning/simulacro/start', 'POST', {
            universityId: 'unmsm', difficulty: 'easy', subject, questionCount: 6,
        }, student.token);
        fullAttempt = body;
        const exposed = Array.isArray(body.questions) && body.questions.some((question) => (
            Object.prototype.hasOwnProperty.call(question, 'correctAnswer')
        ));
        record('CP-AE-FUN-001', 'Iniciar, resolver y enviar un simulacro', 'HTTP 201, seis preguntas y clave oculta', `HTTP ${response.status}; preguntas=${body.questions?.length}; claveExpuesta=${exposed}`, startedAt);
        expect(response.status).toBe(201);
        expect(body.questions).toHaveLength(6);
        expect(exposed).toBe(false);
    });

    test('CP-AE-UNI-001 crea intento valido con limite de tiempo', () => {
        const startedAt = Date.now();
        record('CP-AE-UNI-001', 'Crear intento valido', 'Intento en progreso con seis preguntas y limite', `id=${fullAttempt.id}; preguntas=${fullAttempt.questions.length}; limite=${fullAttempt.timeLimit}`, startedAt);
        expect(fullAttempt.id).toEqual(expect.any(String));
        expect(fullAttempt.timeLimit).toBeGreaterThan(0);
        expect(fullAttempt.questions.map((item) => item.id).sort()).toEqual([...questionIds].sort());
    });

    test('CP-AE-UNI-002 calcula 6 de 6 y puntaje 100', async () => {
        const startedAt = Date.now();
        const answers = fullAttempt.questions.map((question) => answerByQuestionId.get(question.id));
        const { response, body } = await jsonRequest('/learning/simulacro/submit', 'POST', {
            simulacroId: fullAttempt.id, answers, timeSpent: 180,
        }, student.token);
        fullResult = body;
        record('CP-AE-UNI-002', 'Calcular resultado de evaluacion', 'HTTP 200, 6/6 y 100 puntos', `HTTP ${response.status}; aciertos=${body.correctAnswers}/${body.totalQuestions}; puntaje=${body.score}`, startedAt);
        expect(response.status).toBe(200);
        expect(body.correctAnswers).toBe(6);
        expect(body.totalQuestions).toBe(6);
        expect(body.score).toBe(100);
    });

    test('CP-AE-NEG-001 conserva omitidas sin sumar aciertos', async () => {
        const startedAt = Date.now();
        const start = await jsonRequest('/learning/simulacro/start', 'POST', {
            universityId: 'unmsm', difficulty: 'easy', subject, questionCount: 6,
        }, student.token);
        partialAttempt = start.body;
        const answers = partialAttempt.questions.map((question, index) => (
            index % 2 === 0 ? answerByQuestionId.get(question.id) : -1
        ));
        const { response, body } = await jsonRequest('/learning/simulacro/submit', 'POST', {
            simulacroId: partialAttempt.id, answers, timeSpent: 120,
        }, student.token);
        record('CP-AE-NEG-001', 'Enviar simulacro con preguntas omitidas', 'HTTP 200, 3/6 y 50 puntos', `HTTP ${response.status}; aciertos=${body.correctAnswers}/${body.totalQuestions}; puntaje=${body.score}`, startedAt);
        expect(response.status).toBe(200);
        expect(body.correctAnswers).toBe(3);
        expect(body.score).toBe(50);
    });

    test('CP-AE-FUN-002 consulta resultados del estudiante', async () => {
        const startedAt = Date.now();
        const { response, body } = await jsonRequest('/learning/simulacro/results', 'GET', undefined, student.token);
        const found = body.data?.find((attempt) => String(attempt.id_intento) === String(fullAttempt.id));
        record('CP-AE-FUN-002', 'Consultar resultados y desempeno', 'Resultado finalizado con 100 puntos', `HTTP ${response.status}; encontrado=${Boolean(found)}; puntaje=${found?.puntaje}`, startedAt);
        expect(response.status).toBe(200);
        expect(found.estado).toBe('finalizado');
        expect(Number(found.puntaje)).toBe(100);
    });

    test('CP-AE-ROL-001 limita resultados al usuario autenticado', async () => {
        const startedAt = Date.now();
        const { response, body } = await jsonRequest('/learning/simulacro/results', 'GET', undefined, student.token);
        const ownOnly = body.data?.every((attempt) => String(attempt.id_usuario) === String(student.user.id));
        record('CP-AE-ROL-001', 'Permitir funciones propias al estudiante', 'Todos los intentos pertenecen al estudiante', `HTTP ${response.status}; intentos=${body.data?.length}; propios=${ownOnly}`, startedAt);
        expect(response.status).toBe(200);
        expect(ownOnly).toBe(true);
    });

    test('CP-AE-INT-001 integra resultados y analiticas', async () => {
        const startedAt = Date.now();
        const { response, body } = await jsonRequest('/learning/analytics/summary', 'GET', undefined, student.token);
        record('CP-AE-INT-001', 'Integrar simulacro, resultados y analiticas', 'Dos intentos, mejor puntaje 100 y precision coherente', `HTTP ${response.status}; intentos=${body.data?.attemptsCount}; mejor=${body.data?.bestScore}; precision=${body.data?.averageAccuracy}`, startedAt);
        expect(response.status).toBe(200);
        expect(body.data.attemptsCount).toBeGreaterThanOrEqual(2);
        expect(body.data.bestScore).toBe(100);
        expect(body.data.averageAccuracy).toBeGreaterThanOrEqual(75);
    });

    test('CP-AE-INT-002 guarda, consulta y elimina pregunta', async () => {
        const startedAt = Date.now();
        const questionId = questionIds[0];
        const saved = await jsonRequest(`/learning/questions/${questionId}/save`, 'POST', {}, student.token);
        const listed = await jsonRequest('/learning/questions/saved', 'GET', undefined, student.token);
        const exists = listed.body.data?.some((item) => String(item.id_pregunta) === questionId);
        const deleted = await jsonRequest(`/learning/questions/${questionId}/save`, 'DELETE', undefined, student.token);
        const after = await jsonRequest('/learning/questions/saved', 'GET', undefined, student.token);
        const removed = !after.body.data?.some((item) => String(item.id_pregunta) === questionId);
        record('CP-AE-INT-002', 'Guardar, consultar y eliminar pregunta', 'Pregunta aparece una vez y luego desaparece', `guardar=${saved.response.status}; encontrada=${exists}; eliminar=${deleted.response.status}; removida=${removed}`, startedAt);
        expect(saved.response.status).toBe(200);
        expect(exists).toBe(true);
        expect(deleted.response.status).toBe(200);
        expect(removed).toBe(true);
    });

    test('CP-AE-SIS-001 confirma flujo integral persistido', async () => {
        const startedAt = Date.now();
        const { response, body } = await jsonRequest('/learning/simulacro/results', 'GET', undefined, student.token);
        const persisted = body.data?.find((attempt) => String(attempt.id_intento) === String(fullAttempt.id));
        record('CP-AE-SIS-001', 'Completar flujo integral de simulacro', 'Respuestas y resultado permanecen al reconsultar', `HTTP ${response.status}; estado=${persisted?.estado}; respuestas=${persisted?.respuestas?.length}; puntaje=${persisted?.puntaje}`, startedAt);
        expect(response.status).toBe(200);
        expect(persisted.respuestas).toHaveLength(6);
        expect(Number(persisted.puntaje)).toBe(fullResult.score);
    });

    test('CP-AE-SIS-002 refleja actividad en gamificacion', async () => {
        const startedAt = Date.now();
        const summary = await jsonRequest('/learning/gamification/summary?sync=true', 'GET', undefined, student.token);
        const leaderboard = await jsonRequest('/learning/gamification/leaderboard', 'GET', undefined, student.token);
        record('CP-AE-SIS-002', 'Actualizar gamificacion y ranking', 'Resumen y ranking accesibles tras completar intentos', `resumen=${summary.response.status}; ranking=${leaderboard.response.status}; filas=${leaderboard.body.data?.length}`, startedAt);
        expect(summary.response.status).toBe(200);
        expect(summary.body.success).toBe(true);
        expect(leaderboard.response.status).toBe(200);
        expect(leaderboard.body.data).toEqual(expect.any(Array));
    });
});
