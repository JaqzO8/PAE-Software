const baseUrl = process.env.PAE_TEST_BASE_URL;

if (!baseUrl) {
    throw new Error('PAE_TEST_BASE_URL es requerido para ejecutar las pruebas dinamicas');
}

const runId = `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
const testUser = {
    nombres: 'Prueba',
    apellidos: 'Dinamica',
    email: `qa.dynamic.${runId}@pae.test`,
    password: 'PaeTest2026',
    isTeacher: false,
};

let accessToken;

const request = async (path, options = {}) => {
    const response = await fetch(`${baseUrl}${path}`, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...options.headers,
        },
    });
    const body = await response.json();
    return { response, body };
};

describe('Practica Calificada N2 - pruebas dinamicas de autenticacion', () => {
    test('TC-01 registra un estudiante con datos validos', async () => {
        const { response, body } = await request('/auth/register', {
            method: 'POST',
            body: JSON.stringify(testUser),
        });

        expect(response.status).toBe(201);
        expect(body.success).toBe(true);
        expect(body.user.email).toBe(testUser.email);
        expect(body.user.rol).toBe('estudiante');
        expect(body.token).toEqual(expect.any(String));
    });

    test('TC-02 inicia sesion con credenciales validas', async () => {
        const { response, body } = await request('/auth/login', {
            method: 'POST',
            body: JSON.stringify({
                email: testUser.email,
                password: testUser.password,
            }),
        });

        expect(response.status).toBe(200);
        expect(body.success).toBe(true);
        expect(body.user.email).toBe(testUser.email);
        expect(body.token).toEqual(expect.any(String));
        accessToken = body.token;
    });

    test('TC-03 verifica el token emitido por el login', async () => {
        const { response, body } = await request('/auth/verify', {
            headers: { Authorization: `Bearer ${accessToken}` },
        });

        expect(response.status).toBe(200);
        expect(body.success).toBe(true);
        expect(body.user.email).toBe(testUser.email);
        expect(body.user.rol).toBe('estudiante');
    });

    test('TC-04 rechaza el registro de un correo duplicado', async () => {
        const { response, body } = await request('/auth/register', {
            method: 'POST',
            body: JSON.stringify(testUser),
        });

        expect(response.status).toBe(409);
        expect(body.success).toBe(false);
    });

    test('TC-05 rechaza una contrasena de siete caracteres', async () => {
        const { response, body } = await request('/auth/register', {
            method: 'POST',
            body: JSON.stringify({
                ...testUser,
                email: `qa.limit.${runId}@pae.test`,
                password: 'Aa12345',
            }),
        });

        expect(response.status).toBe(400);
        expect(body.success).toBe(false);
        expect(body.errors).toEqual(expect.arrayContaining([
            expect.objectContaining({ field: 'password' }),
        ]));
    });
});
