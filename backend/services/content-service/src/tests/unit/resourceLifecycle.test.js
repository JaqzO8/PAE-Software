jest.mock('../../models', () => ({ Resource: { findOne: jest.fn(), findAll: jest.fn(), rawAttributes: { size_archivo: {} } }, Repository: { findOne: jest.fn() }, OutboxEvent: {} }));
jest.mock('../../config/database', () => ({ sequelize: {} }));
jest.mock('fs', () => ({ ...jest.requireActual('fs'), promises: { readFile: jest.fn(), unlink: jest.fn() } }));
const { Resource, Repository } = require('../../models');
const fs = require('fs').promises;
const Controller = require('../../controllers/resourceController');
let req, res, next, resource;
beforeEach(() => {
    jest.resetAllMocks(); jest.spyOn(console, 'error').mockImplementation(() => {});
    req = { params: { id: '8' }, query: { repositorio_id: '2' }, body: {}, user: { id: 7, rol: 'docente' } };
    res = { status: jest.fn().mockReturnThis(), json: jest.fn() }; next = jest.fn();
    resource = { id_recurso: 8, publicado: true, url_archivo: '/uploads/old.pdf', repositorio: { id_profesor: '7', publico: true }, update: jest.fn() };
    Resource.findOne.mockResolvedValue(resource); Repository.findOne.mockResolvedValue(resource.repositorio);
    fs.readFile.mockResolvedValue(Buffer.from('%PDF-1.4 fixture')); fs.unlink.mockResolvedValue();
});
afterEach(() => jest.restoreAllMocks());
test.each(['update', 'delete'])('%s cannot mutate a missing or foreign resource', async method => {
    Resource.findOne.mockResolvedValueOnce(null); await Controller[method](req, res, next); expect(res.status).toHaveBeenLastCalledWith(404);
    req.user.id = 9; await Controller[method](req, res, next); expect(res.status).toHaveBeenLastCalledWith(403);
    expect(resource.update).not.toHaveBeenCalled(); expect(fs.unlink).not.toHaveBeenCalled();
});
test('draft update does not disclose existence to another teacher', async () => {
    req.user.id = 9; resource.publicado = false; await Controller.update(req, res, next);
    expect(res.status).toHaveBeenCalledWith(404); expect(resource.update).not.toHaveBeenCalled();
});
test('resource update normalizes fields and permits deliberately clearing optional values', async () => {
    req.body = { titulo: '  Material actualizado  ', descripcion: ' ', url_externa: '', orden: '3' };
    await Controller.update(req, res, next);
    expect(resource.update).toHaveBeenCalledWith({ titulo: 'Material actualizado', descripcion: null, url_externa: null, orden: 3 });
    expect(res.status).toHaveBeenCalledWith(200);
});
test.each([undefined, 'ENOENT', 'EACCES'])('valid replacement persists checksum and remains usable when old file cleanup returns %s', async code => {
    req.file = { path: '/qa/new.pdf', originalname: 'new.pdf', filename: 'new.pdf', mimetype: 'application/pdf', size: 16 };
    if (code) fs.unlink.mockRejectedValueOnce(Object.assign(new Error('cleanup'), { code }));
    await Controller.update(req, res, next);
    expect(resource.update).toHaveBeenCalledWith(expect.objectContaining({ url_archivo: '/uploads/resources/pdfs/new.pdf', extension: '.pdf', size_archivo: 16, checksum_sha256: expect.stringMatching(/^[a-f0-9]{64}$/) }));
    expect(next).not.toHaveBeenCalled(); expect(res.status).toHaveBeenCalledWith(200);
});
test('corrupt uploaded replacement is discarded without updating the existing record', async () => {
    req.file = { path: '/qa/broken.pdf', originalname: 'broken.pdf', filename: 'broken.pdf', mimetype: 'application/pdf' };
    fs.readFile.mockResolvedValue(Buffer.from('not a PDF'));
    await Controller.update(req, res, next);
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ code: 'INVALID_PDF_HEADER' }));
    expect(fs.unlink).toHaveBeenCalledWith('/qa/broken.pdf'); expect(resource.update).not.toHaveBeenCalled();
});
test('soft deletion changes only active status, without removing the underlying file', async () => {
    await Controller.delete(req, res, next); expect(resource.update).toHaveBeenCalledWith({ activo: false });
    expect(fs.unlink).not.toHaveBeenCalled(); expect(res.status).toHaveBeenCalledWith(200);
});
test('filtered resource list includes drafts only for the owner', async () => {
    req.query.tipo = 'pdf'; Resource.findAll.mockResolvedValue([{ id_recurso: 1, publicado: false }, { id_recurso: 2, publicado: true }]);
    await Controller.list(req, res, next); expect(res.json.mock.calls[0][0].data).toHaveLength(2);
    expect(Resource.findAll.mock.calls[0][0].where).toEqual({ id_repositorio: '2', activo: true, tipo_recurso: 'pdf' });
    req.user = undefined; await Controller.list(req, res, next);
    expect(res.json.mock.calls[1][0].data).toEqual([{ id_recurso: 2, publicado: true }]);
});
test.each(['list', 'getById', 'update', 'delete'])('%s exposes database failure to error middleware instead of inventing success', async method => {
    const error = new Error('database unavailable'); Repository.findOne.mockRejectedValue(error); Resource.findOne.mockRejectedValue(error);
    await Controller[method](req, res, next); expect(next).toHaveBeenCalledWith(error); expect(res.json).not.toHaveBeenCalled();
});
