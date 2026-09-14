const fs = require('fs');
const path = require('path');

const requiredEnv = [
    'PAE_TEST_BASE_URL',
    'PAE_STUDENT_FIRST_NAME',
    'PAE_STUDENT_LAST_NAME',
    'PAE_STUDENT_EMAIL',
    'PAE_STUDENT_PASSWORD',
    'PAE_TEACHER_FIRST_NAME',
    'PAE_TEACHER_LAST_NAME',
    'PAE_TEACHER_EMAIL',
    'PAE_TEACHER_PASSWORD',
    'PAE_EVIDENCE_OUTPUT',
];

for (const name of requiredEnv) {
    if (!process.env[name]) {
        throw new Error(`${name} es requerido para ejecutar la suite dinamica`);
    }
}

const baseUrl = process.env.PAE_TEST_BASE_URL.replace(/\/$/, '');
const evidenceOutput = process.env.PAE_EVIDENCE_OUTPUT;
const evidence = [];
const runId = Date.now();

const student = {
    nombres: process.env.PAE_STUDENT_FIRST_NAME,
    apellidos: process.env.PAE_STUDENT_LAST_NAME,
    email: process.env.PAE_STUDENT_EMAIL,
    password: process.env.PAE_STUDENT_PASSWORD,
    isTeacher: false,
};

const teacher = {
    nombres: process.env.PAE_TEACHER_FIRST_NAME,
    apellidos: process.env.PAE_TEACHER_LAST_NAME,
    email: process.env.PAE_TEACHER_EMAIL,
    password: process.env.PAE_TEACHER_PASSWORD,
    isTeacher: true,
};

let studentSession;
let teacherSession;
let createdRepository;

const parseBody = async (response) => {
    const text = await response.text();
    if (!text) return null;
    try {
        return JSON.parse(text);
    } catch {
        return { raw: text.slice(0, 500) };
    }
};

const request = async (route, options = {}) => {
    const response = await fetch(`${baseUrl}${route}`, options);
    return { response, body: await parseBody(response) };
};

const login = (user) => request('/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: user.email, password: user.password }),
});

const ensureAccount = async (user) => {
    let result = await login(user);
    let preparation = 'cuenta existente';

    if (result.response.status === 404) {
        result = await request('/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(user),
        });
        preparation = 'cuenta creada durante la prueba';
    }

    if (result.response.status === 409) {
        result = await login(user);
        preparation = 'cuenta existente reutilizada';
    }

    return { ...result, preparation };
};

const record = ({ caseId, title, requestSummary, expected, actual, startedAt }) => {
    const item = {
        caseId,
        title,
        timestamp: new Date().toISOString(),
        durationMs: Date.now() - startedAt,
        request: requestSummary,
        expected,
        actual,
        passed: true,
    };
    evidence.push(item);
    console.log(`[EVIDENCIA ${caseId}] ${JSON.stringify(item)}`);
};

afterAll(() => {
    fs.mkdirSync(path.dirname(evidenceOutput), { recursive: true });
    fs.writeFileSync(evidenceOutput, JSON.stringify({
        suite: 'Practica Calificada - Pruebas Dinamicas PAE',
        executedAt: new Date().toISOString(),
        baseUrl,
        cases: evidence,
    }, null, 2));
});

describe('Practica Calificada - cinco flujos dinamicos de PAE', () => {
    test('TC-01 autentica o prepara la cuenta de estudiante', async () => {
        const startedAt = Date.now();
        const { response, body, preparation } = await ensureAccount(student);

        expect([200, 201]).toContain(response.status);
        expect(body.success).toBe(true);
        expect(body.user.email).toBe(student.email.toLowerCase());
        expect(body.user.rol).toBe('estudiante');
        expect(body.token).toEqual(expect.any(String));
        studentSession = body;

        record({
            caseId: 'TC-01',
            title: 'Acceso valido de estudiante',
            requestSummary: `POST /api/auth/login|register; email=${student.email}; clave=***`,
            expected: 'HTTP 200/201, usuario autenticado con rol estudiante',
            actual: `HTTP ${response.status}; rol=${body.user.rol}; ${preparation}`,
            startedAt,
        });
    });

    test('TC-02 autentica o prepara la cuenta de docente', async () => {
        const startedAt = Date.now();
        const { response, body, preparation } = await ensureAccount(teacher);

        expect([200, 201]).toContain(response.status);
        expect(body.success).toBe(true);
        expect(body.user.email).toBe(teacher.email.toLowerCase());
        expect(body.user.rol).toBe('docente');
        expect(body.token).toEqual(expect.any(String));
        teacherSession = body;

        record({
            caseId: 'TC-02',
            title: 'Acceso valido de docente',
            requestSummary: `POST /api/auth/login|register; email=${teacher.email}; clave=***; docente=true`,
            expected: 'HTTP 200/201, usuario autenticado con rol docente',
            actual: `HTTP ${response.status}; rol=${body.user.rol}; ${preparation}`,
            startedAt,
        });
    });

    test('TC-03 impide a un estudiante acceder a funciones de docente', async () => {
        const startedAt = Date.now();
        const { response, body } = await request('/content/repositories/my', {
            headers: { Authorization: `Bearer ${studentSession.token}` },
        });

        expect(response.status).toBe(403);
        expect(body.success).toBe(false);

        record({
            caseId: 'TC-03',
            title: 'Control de autorizacion por rol',
            requestSummary: 'GET /api/content/repositories/my con token de estudiante',
            expected: 'HTTP 403 y acceso denegado de forma controlada',
            actual: `HTTP ${response.status}; success=${body.success}; mensaje=${body.message}`,
            startedAt,
        });
    });

    test('TC-04 permite al docente crear un repositorio publico', async () => {
        const startedAt = Date.now();
        const title = `Repositorio QA Dinamico ${runId}`;
        const categories = await request('/content/categories');
        expect(categories.response.status).toBe(200);
        expect(categories.body.data.length).toBeGreaterThan(0);
        const form = new FormData();
        form.append('titulo', title);
        form.append('descripcion', 'Contenido creado por una prueba dinamica automatizada.');
        form.append('id_categoria', String(categories.body.data[0].id_categoria));
        form.append('publico', 'true');
        form.append('tags', JSON.stringify(['qa-dinamico', 'pae']));

        const { response, body } = await request('/content/repositories', {
            method: 'POST',
            headers: { Authorization: `Bearer ${teacherSession.token}` },
            body: form,
        });

        expect(response.status).toBe(201);
        expect(body.success).toBe(true);
        expect(body.data.titulo).toBe(title);
        expect(body.data.publico).toBe(true);
        createdRepository = body.data;

        record({
            caseId: 'TC-04',
            title: 'Creacion de contenido por docente',
            requestSummary: `POST /api/content/repositories; titulo=${title}; publico=true`,
            expected: 'HTTP 201, repositorio publico persistido',
            actual: `HTTP ${response.status}; id=${body.data.id_repositorio}; titulo=${body.data.titulo}`,
            startedAt,
        });
    });

    test('TC-05 localiza publicamente el repositorio persistido', async () => {
        const startedAt = Date.now();
        const query = encodeURIComponent(createdRepository.titulo);
        const { response, body } = await request(`/content/repositories/explore?search=${query}`);

        expect(response.status).toBe(200);
        expect(body.success).toBe(true);
        expect(body.data).toEqual(expect.arrayContaining([
            expect.objectContaining({
                id_repositorio: createdRepository.id_repositorio,
                titulo: createdRepository.titulo,
            }),
        ]));

        record({
            caseId: 'TC-05',
            title: 'Busqueda publica y persistencia transversal',
            requestSummary: `GET /api/content/repositories/explore?search=${createdRepository.titulo}`,
            expected: 'HTTP 200 y repositorio creado presente en los resultados',
            actual: `HTTP ${response.status}; coincidencias=${body.data.length}; id localizado=${createdRepository.id_repositorio}`,
            startedAt,
        });
    });
});
