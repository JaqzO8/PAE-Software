jest.mock('../../models', () => ({ Category: { findAll: jest.fn() }, Tag: { findAll: jest.fn(), findOne: jest.fn(), create: jest.fn() } }));
const { Category, Tag } = require('../../models');
const { Op } = require('sequelize');
const Controller = require('../../controllers/categoryController');
let req, res, next;
beforeEach(() => {
    jest.resetAllMocks(); req = { query: {}, body: {} };
    res = { status: jest.fn().mockReturnThis(), json: jest.fn() }; next = jest.fn();
});
test('only active categories are exposed, ordered by name', async () => {
    Category.findAll.mockResolvedValue([{ nombre: 'Física' }]); await Controller.list(req, res, next);
    expect(Category.findAll).toHaveBeenCalledWith({ where: { activa: true }, order: [['nombre', 'ASC']] });
    expect(res.json).toHaveBeenCalledWith({ success: true, data: [{ nombre: 'Física' }] });
});
test.each([undefined, '10'])('tag list applies the popularity limit %s', async limit => {
    req.query.limit = limit; Tag.findAll.mockResolvedValue([]); await Controller.listTags(req, res, next);
    expect(Tag.findAll).toHaveBeenCalledWith({ order: [['cantidad_uso', 'DESC']], limit: limit ? 10 : 50 });
    expect(res.status).toHaveBeenCalledWith(200);
});
test.each([undefined, '', 'a'])('short search %s does not query the database', async q => {
    req.query.q = q; await Controller.searchTags(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400); expect(Tag.findAll).not.toHaveBeenCalled();
});
test('search is case-insensitive and bounded', async () => {
    req.query.q = 'Física'; Tag.findAll.mockResolvedValue([{ nombre: 'Física' }]); await Controller.searchTags(req, res, next);
    expect(Tag.findAll.mock.calls[0][0].where.nombre[Op.iLike]).toBe('%Física%');
    expect(Tag.findAll.mock.calls[0][0].limit).toBe(20); expect(res.json.mock.calls[0][0].data).toHaveLength(1);
});
test('tag creation validates name and prevents a duplicate normalized slug', async () => {
    await Controller.createTag(req, res, next); expect(res.status).toHaveBeenLastCalledWith(400);
    req.body.nombre = 'Ciencias Naturales'; Tag.findOne.mockResolvedValue({ id_tag: 8 });
    await Controller.createTag(req, res, next);
    expect(Tag.findOne).toHaveBeenCalledWith({ where: { slug: 'ciencias-naturales' } });
    expect(res.status).toHaveBeenLastCalledWith(409); expect(Tag.create).not.toHaveBeenCalled();
});
test('new tag persists its display name and normalized slug', async () => {
    req.body.nombre = 'Ciencias Naturales'; Tag.create.mockResolvedValue({ id_tag: 8 });
    await Controller.createTag(req, res, next);
    expect(Tag.create).toHaveBeenCalledWith({ nombre: 'Ciencias Naturales', slug: 'ciencias-naturales' });
    expect(res.status).toHaveBeenCalledWith(201); expect(res.json.mock.calls[0][0].data).toEqual({ id_tag: 8 });
});
test.each([['list', Category, 'findAll'], ['listTags', Tag, 'findAll'], ['searchTags', Tag, 'findAll'], ['createTag', Tag, 'findOne'], ['createTag', Tag, 'create']])('%s propagates database outages', async (method, model, operation) => {
    req.query.q = 'Física'; req.body.nombre = 'Ciencias'; const error = new Error('database unavailable');
    model[operation].mockRejectedValue(error); await Controller[method](req, res, next);
    expect(next).toHaveBeenCalledWith(error); expect(res.json).not.toHaveBeenCalled();
});
