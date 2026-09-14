const requiredEnv = [
    'PAE_TEST_BASE_URL',
    'PAE_STUDENT_EMAIL',
    'PAE_STUDENT_PASSWORD',
    'PAE_TEACHER_EMAIL',
    'PAE_TEACHER_PASSWORD',
];

for (const name of requiredEnv) {
    if (!process.env[name]) throw new Error(`${name} es requerido`);
}

const baseUrl = process.env.PAE_TEST_BASE_URL.replace(/\/$/, '');
const runId = Date.now();
let teacherToken;
let categoryId;
let repositoryId;

const request = async (route, options = {}) => {
    const response = await fetch(`${baseUrl}${route}`, options);
    const text = await response.text();
    let body = null;
    try { body = text ? JSON.parse(text) : null; } catch { body = { raw: text }; }
    return { response, body };
};

const login = async (email, password) => request('/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
});

const createRepository = async ({ title, includeCategory }) => {
    const form = new FormData();
    form.append('titulo', title);
    form.append('descripcion', 'Repositorio de verificacion de controles backend.');
    form.append('publico', 'true');
    if (includeCategory) form.append('id_categoria', String(categoryId));
    return request('/content/repositories', {
        method: 'POST',
        headers: { Authorization: `Bearer ${teacherToken}` },
        body: form,
    });
};

beforeAll(async () => {
    const teacher = await login(process.env.PAE_TEACHER_EMAIL, process.env.PAE_TEACHER_PASSWORD);
    expect(teacher.response.status).toBe(200);
    teacherToken = teacher.body.token;

    const categories = await request('/content/categories');
    expect(categories.response.status).toBe(200);
    categoryId = categories.body.data[0].id_categoria;

    const repository = await createRepository({
        title: `Repositorio control acceso ${runId}`,
        includeCategory: true,
    });
    expect(repository.response.status).toBe(201);
    repositoryId = repository.body.data.id_repositorio;
});

describe('Guia PAE - controles backend de Contenido Educativo', () => {
    test('CP-CE-NEG-002 rechaza repositorio sin categoria', async () => {
        const { response, body } = await createRepository({
            title: `Repositorio sin categoria ${runId}`,
            includeCategory: false,
        });
        console.log(`[EVIDENCIA CP-CE-NEG-002] HTTP ${response.status}; ${body.message}`);
        expect(response.status).toBe(400);
        expect(body.success).toBe(false);
    });

    test('CP-CE-ROL-002 exige autenticacion para agregar favorito', async () => {
        const { response, body } = await request(`/content/favorites/${repositoryId}`, {
            method: 'POST',
        });
        console.log(`[EVIDENCIA CP-CE-ROL-002] HTTP ${response.status}; success=${body.success}`);
        expect(response.status).toBe(401);
        expect(body.success).toBe(false);
    });
});
