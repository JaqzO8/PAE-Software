jest.mock('../../models', () => ({ Resource: { findOne: jest.fn() }, Repository: {}, OutboxEvent: { create: jest.fn() } }));
jest.mock('../../config/database', () => ({ sequelize: { transaction: jest.fn(async fn => fn({ id: 'transaction' })) } }));
jest.mock('fs', () => ({ promises: { access: jest.fn(), readFile: jest.fn(), unlink: jest.fn() } }));
const { Resource, OutboxEvent } = require('../../models');
const { sequelize } = require('../../config/database');
const fs = require('fs').promises;
const { createHash } = require('node:crypto');
const Controller = require('../../controllers/resourceController');
let resource, req, res, next;
beforeEach(() => {
    jest.clearAllMocks();
    fs.access.mockResolvedValue(undefined); fs.readFile.mockResolvedValue(Buffer.from('%PDF-1.4 fixture'));
    resource = { id_recurso: 5, id_repositorio: 1, titulo: 'Material QA', tipo_recurso: 'pdf', estado_editorial: 'aprobado', publicado: false,
        url_archivo: '/uploads/resources/pdfs/fixture.pdf', repositorio: { id_profesor: 1, publico: true }, update: jest.fn() };
    req = { params: { id: 5 }, user: { id: 1, rol: 'docente' }, body: {} };
    res = { status: jest.fn().mockReturnThis(), json: jest.fn() }; next = jest.fn();
    Resource.findOne.mockImplementation(async () => resource);
    OutboxEvent.create.mockResolvedValue({});
});

test.each([
    ['missing', () => { resource = null; }, 404],
    ['foreign owner', () => { req.user.id = 2; }, 403],
    ['editorial pending', () => { resource.estado_editorial = 'pendiente'; }, 409],
    ['missing material', () => { resource.url_archivo = null; }, 409],
    ['path traversal', () => { resource.url_archivo = '../../outside.pdf'; }, 409],
    ['missing file', () => { fs.access.mockRejectedValueOnce(new Error('ENOENT')); }, 409],
    ['corrupt file', () => { resource.checksum_sha256 = 'wrong'; }, 409],
])('publication rejects %s without writing an event', async (_name, arrange, status) => {
    arrange(); await Controller.publish(req, res, next);
    expect(res.status).toHaveBeenCalledWith(status);
    expect(OutboxEvent.create).not.toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
});

test('valid checksum publication writes state and event in the same transaction', async () => {
    resource.checksum_sha256 = createHash('sha256').update('%PDF-1.4 fixture').digest('hex');
    await Controller.publish(req, res, next);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(resource.update).toHaveBeenCalledWith(expect.objectContaining({ publicado: true }), { transaction: { id: 'transaction' } });
    expect(OutboxEvent.create).toHaveBeenCalledWith(expect.objectContaining({ event_type: 'RecursoPublicado.v1', payload: expect.objectContaining({ resourceId: '5' }) }), { transaction: { id: 'transaction' } });
});

test('external material can publish; retries do not duplicate its event', async () => {
    resource.url_archivo = null; resource.url_externa = 'https://example.test/lesson';
    await Controller.publish(req, res, next);
    expect(OutboxEvent.create).toHaveBeenCalledTimes(1);
    resource.publicado = true;
    await Controller.publish(req, res, next);
    expect(OutboxEvent.create).toHaveBeenCalledTimes(1);
    expect(res.json).toHaveBeenLastCalledWith(expect.objectContaining({ replayed: true }));
});

test('transaction failure is propagated instead of reporting publication success', async () => {
    const error = new Error('database unavailable');
    sequelize.transaction.mockRejectedValueOnce(error);
    await Controller.publish(req, res, next);
    expect(next).toHaveBeenCalledWith(error);
    expect(res.json).not.toHaveBeenCalled();
});

test.each(['aprobado', 'rechazado', 'pendiente'])('editorial review persists %s and reviewer identity', async estado => {
    req.body.estado = estado;
    await Controller.editorialReview(req, res, next);
    expect(resource.update).toHaveBeenCalledWith(expect.objectContaining({ estado_editorial: estado, revisor_editorial_id: 1 }));
    expect(res.status).toHaveBeenCalledWith(200);
});

test('editorial review rejects invalid status, missing resources, foreign identity and persistence errors', async () => {
    await Controller.editorialReview(req, res, next); expect(res.status).toHaveBeenLastCalledWith(400);
    req.user.id = 2;
    await Controller.editorialReview(req, res, next); expect(res.status).toHaveBeenLastCalledWith(403);
    req.user.id = 1; req.body.estado = 'aprobado';
    const error = new Error('write failed'); resource.update.mockRejectedValueOnce(error);
    await Controller.editorialReview(req, res, next); expect(next).toHaveBeenCalledWith(error);
    resource = null;
    await Controller.editorialReview(req, res, next); expect(res.status).toHaveBeenLastCalledWith(404);
});
