jest.mock('../../models', () => ({
    Repository: { findOne: jest.fn(), findAll: jest.fn(), findAndCountAll: jest.fn(), create: jest.fn() },
    Resource: {}, Category: {}, Tag: { findOrCreate: jest.fn() }, Rating: { findOne: jest.fn() }, Favorite: { findOne: jest.fn() },
}));
const { Op } = require('sequelize');
const { Repository, Tag, Rating, Favorite } = require('../../models');
const Controller = require('../../controllers/repositoryController');
let req, res, next, repository, tag;
beforeEach(() => {
    jest.resetAllMocks();
    jest.spyOn(console, 'log').mockImplementation(() => {}); jest.spyOn(console, 'error').mockImplementation(() => {});
    req = { params: { id: '8' }, query: {}, body: {}, user: { id: 7, rol: 'docente' } };
    res = { status: jest.fn().mockReturnThis(), json: jest.fn() }; next = jest.fn();
    repository = { id_repositorio: 8, id_profesor: 7, titulo: 'Original', descripcion: 'Descripción', id_categoria: 2, publico: true, portada: '/original.png',
        increment: jest.fn(), update: jest.fn(), reload: jest.fn(), setTags: jest.fn(),
        toJSON: () => ({ id_repositorio: 8, recursos: [{ id_recurso: 1, publicado: true }, { id_recurso: 2, publicado: false }] }) };
    tag = { increment: jest.fn() };
    Repository.findOne.mockResolvedValue(repository); Repository.create.mockResolvedValue(repository);
    Repository.findAndCountAll.mockResolvedValue({ count: 3, rows: [repository] });
    Tag.findOrCreate.mockResolvedValue([tag]);
});
afterEach(() => jest.restoreAllMocks());

test.each([undefined, { id: 9, rol: 'estudiante' }])('public detail hides drafts for non-owners %j', async user => {
    req.user = user; await Controller.getById(req, res, next);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ recursos: [{ id_recurso: 1, publicado: true }] }) }));
    const where = Repository.findOne.mock.calls[0][0].where;
    if (user) expect(where[Op.or]).toEqual([{ publico: true }, { id_profesor: 9 }]);
    else expect(where.publico).toBe(true);
});
test.each([{ id: 7, rol: 'docente' }, { id: 9, rol: 'admin' }])('authorized owner or administrator sees draft resources %j', async user => {
    req.user = user; Favorite.findOne.mockResolvedValue({ id: 1 }); Rating.findOne.mockResolvedValue({ puntuacion: 9 });
    await Controller.getById(req, res, next);
    expect(res.json.mock.calls[0][0].data).toMatchObject({ recursos: expect.arrayContaining([{ id_recurso: 2, publicado: false }]), isFavorite: true, myRating: { puntuacion: 9 } });
    expect(Favorite.findOne).toHaveBeenCalledWith({ where: { id_usuario: user.id, id_repositorio: '8' } });
});
test.each(['getById', 'update', 'delete'])('%s does not mutate missing or inaccessible repositories', async method => {
    Repository.findOne.mockResolvedValue(null); await Controller[method](req, res, next);
    expect(res.status).toHaveBeenCalledWith(404); expect(repository.update).not.toHaveBeenCalled(); expect(repository.increment).not.toHaveBeenCalled();
});
test('explore combines category, tags and search without allowing private repositories', async () => {
    req.query = { page: '2', limit: '2', search: 'física', categoria: '3', tags: ' fisica, ciencias ', orderBy: 'fecha_creacion' };
    await Controller.explore(req, res, next);
    const query = Repository.findAndCountAll.mock.calls[0][0];
    expect(query).toMatchObject({ offset: 2, limit: 2, where: { activo: true, publico: true, id_categoria: '3' } });
    expect(query.where['$tags.slug$'][Op.in]).toEqual(['fisica', 'ciencias']);
    expect(query.where[Op.or][0].titulo[Op.iLike]).toBe('%física%');
    expect(res.json.mock.calls[0][0].pagination).toEqual({ page: 2, limit: 2, total: 3, totalPages: 2 });
});
test('own repository list ignores a spoofed owner filter', async () => {
    req.query = { id_profesor: 900, page: '2', limit: '2' }; await Controller.myRepositories(req, res, next);
    expect(Repository.findAndCountAll.mock.calls[0][0]).toMatchObject({ where: { id_profesor: 7, activo: true }, offset: 2 });
});
test.each(['[" Física "]', '{invalid-json'])('creation handles multipart tag data %s without trusting body identity', async tags => {
    req.body = { titulo: '  Contenido QA  ', descripcion: ' Detalle ', id_categoria: 2, id_profesor: 900, publico: 'false', tags };
    req.file = { filename: 'cover.png' }; await Controller.create(req, res, next);
    expect(Repository.create).toHaveBeenCalledWith(expect.objectContaining({ id_profesor: 7, titulo: 'Contenido QA', descripcion: 'Detalle', publico: false, portada: '/uploads/resources/images/cover.png' }));
    if (tags.startsWith('[')) { expect(repository.setTags).toHaveBeenCalledWith([tag]); expect(tag.increment).toHaveBeenCalledWith('cantidad_uso'); }
    else expect(repository.setTags).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(201);
});
test.each(['[]', '{invalid-json'])('update preserves absent fields and deliberately clears only valid tags %s', async tags => {
    req.body = { tags }; await Controller.update(req, res, next);
    expect(repository.update).toHaveBeenCalledWith({ titulo: 'Original', descripcion: 'Descripción', id_categoria: 2, publico: true, portada: '/original.png' });
    if (tags === '[]') expect(repository.setTags).toHaveBeenCalledWith([]);
    else expect(repository.setTags).not.toHaveBeenCalled();
});
test('soft deletion is restricted to the authenticated owner', async () => {
    await Controller.delete(req, res, next);
    expect(Repository.findOne).toHaveBeenCalledWith({ where: { id_repositorio: '8', id_profesor: 7 } });
    expect(repository.update).toHaveBeenCalledWith({ activo: false }); expect(res.status).toHaveBeenCalledWith(200);
});
test.each([
    ['explore', 'findAndCountAll'], ['myRepositories', 'findAndCountAll'], ['getPopular', 'findAll'], ['getFeatured', 'findAll'],
    ['getById', 'findOne'], ['create', 'create'], ['update', 'findOne'], ['delete', 'findOne'],
])('%s propagates database failure instead of reporting a successful operation', async (method, query) => {
    req.body = { titulo: 'Contenido QA', id_categoria: 2 }; const error = new Error('database unavailable');
    Repository[query].mockRejectedValue(error); await Controller[method](req, res, next);
    expect(next).toHaveBeenCalledWith(error); expect(res.json).not.toHaveBeenCalled();
});
