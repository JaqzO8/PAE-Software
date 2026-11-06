const { validateRepository, validateResource, handleValidationErrors } = require('../../utils/validators');

async function validate(rules, body) {
    const req = { body }, res = { status: jest.fn().mockReturnThis(), json: jest.fn() }, next = jest.fn();
    for (const rule of rules) await rule.run(req);
    handleValidationErrors(req, res, next);
    return { req, res, next };
}
test('repository validation trims display text and accepts optional visibility', async () => {
    const { req, res, next } = await validate(validateRepository, { nombre: '  Repositorio QA  ', descripcion: '  Material  ', publico: false });
    expect(req.body.nombre).toBe('Repositorio QA'); expect(req.body.descripcion).toBe('Material');
    expect(next).toHaveBeenCalledTimes(1); expect(res.json).not.toHaveBeenCalled();
});
test.each([
    [{}, 'nombre'], [{ nombre: 'ab' }, 'nombre'], [{ nombre: 'x'.repeat(201) }, 'nombre'],
    [{ nombre: 'Contenido', descripcion: 'x'.repeat(1001) }, 'descripcion'], [{ nombre: 'Contenido', publico: 'invalid' }, 'publico'],
])('repository input %j is rejected with actionable field errors', async (body, field) => {
    const { res, next } = await validate(validateRepository, body);
    expect(res.status).toHaveBeenCalledWith(400); expect(next).not.toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith({ success: false, errors: expect.arrayContaining([{ field, message: expect.any(String) }]) });
});
test('resource validation accepts a numeric repository, trimmed title and HTTPS reference', async () => {
    const { req, next, res } = await validate(validateResource, { id_repositorio: '7', titulo: '  Guía QA  ', tipo_recurso: 'enlace', url_externa: 'https://example.test/material' });
    expect(req.body.titulo).toBe('Guía QA'); expect(next).toHaveBeenCalledTimes(1); expect(res.json).not.toHaveBeenCalled();
});
test.each([
    [{ id_repositorio: 'invalid' }, 'id_repositorio'], [{ titulo: 'a' }, 'titulo'], [{ tipo_recurso: '' }, 'tipo_recurso'],
    [{ descripcion: 'x'.repeat(1001) }, 'descripcion'], [{ url_externa: 'javascript:alert(1)' }, 'url_externa'],
])('resource input %j is rejected before persistence', async (override, field) => {
    const { res, next } = await validate(validateResource, { id_repositorio: 7, titulo: 'Guía QA', tipo_recurso: 'pdf', ...override });
    expect(res.status).toHaveBeenCalledWith(400); expect(next).not.toHaveBeenCalled();
    expect(res.json.mock.calls[0][0].errors).toContainEqual({ field, message: expect.any(String) });
});
