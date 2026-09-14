const FavoriteController = require('../../controllers/favoriteController');
const RepositoryController = require('../../controllers/repositoryController');
const ResourceController = require('../../controllers/resourceController');

jest.mock('../../models', () => ({
  Favorite: {
    findOne: jest.fn(),
    create: jest.fn(),
  },
  Repository: {
    findOne: jest.fn(),
    findAll: jest.fn(),
  },
  Resource: {
    findOne: jest.fn(),
  },
}));

const { Favorite, Repository, Resource } = require('../../models');

describe('INT-03 - Favoritos y ranking de repositorios populares', () => {

  test('No duplica favorito y actualiza ranking por descargas', async () => {

    // ---------- MOCK FAVORITOS ----------
    Favorite.findOne
      .mockResolvedValueOnce(null) // primera vez no existe
      .mockResolvedValueOnce({ id: 1 }); // segunda vez ya existe

    Favorite.create.mockResolvedValue({
      id_usuario: 22,
      id_repositorio: 5,
      fecha_creacion: new Date(),
    });
    Repository.findOne.mockResolvedValue({
      id_repositorio: 5,
      activo: true,
      publico: true,
    });

    // ---------- MOCK RESOURCE ----------
    const repoMock = {
      cantidad_descargas: 1,
      increment: jest.fn(),
    };

    const resourceMock = {
      activo: true,
      repositorio: repoMock,
      increment: jest.fn(),
    };

    Resource.findOne.mockResolvedValue(resourceMock);

    // ---------- MOCK RANKING ----------
    Repository.findAll.mockResolvedValue([
      { id_repositorio: 5, cantidad_descargas: 10 },
      { id_repositorio: 2, cantidad_descargas: 5 },
    ]);

    // ---------- SIMULAR REQUEST ----------
    const req = {
      user: { id: 22 },
      params: { id: 5 },
      query: { orderBy: 'cantidad_descargas', limit: 10 },
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      sendFile: jest.fn(),
    };

    const next = jest.fn();
    Repository.findOne.mockResolvedValue({
        id_repositorio: 5,
        activo: true,
        publico: true,
    });

    // ---------- 1. PRIMER FAVORITO ----------
    await FavoriteController.add(req, res, next);

    expect(res.status).toHaveBeenCalledWith(201);

    // ---------- 2. DUPLICADO ----------
    await FavoriteController.add(req, res, next);

    expect(res.status).toHaveBeenCalledWith(409);

    // ---------- 3. DESCARGA ----------
    await ResourceController.download(req, res, next);

    expect(resourceMock.increment).toHaveBeenCalledWith('descargas');
    expect(repoMock.increment).toHaveBeenCalledWith('cantidad_descargas');

    // ---------- 4. RANKING ----------
    await RepositoryController.getPopular(req, res, next);

    expect(Repository.findAll).toHaveBeenCalled();

  });
});