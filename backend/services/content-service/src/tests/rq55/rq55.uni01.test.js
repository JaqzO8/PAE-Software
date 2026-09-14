const FavoriteController = require('../../controllers/favoriteController');

jest.mock('../../models', () => ({
  Favorite: {
    findOne: jest.fn(),
    create: jest.fn(),
  },
  Repository: {
    findOne: jest.fn(),
  },
}));

const { Favorite, Repository } = require('../../models');

describe('TC-55-UNI-01 - Agregar repositorio público a favoritos', () => {
  let req;
  let res;
  let next;

  beforeEach(() => {
    req = {
      user: { id: 22 },
      params: { id: 5 },
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    next = jest.fn();

    jest.clearAllMocks();
  });

  test('Debe agregar un repositorio público a favoritos', async () => {
    Repository.findOne.mockResolvedValue({
      id_repositorio: 5,
      activo: true,
      publico: true,
    });

    Favorite.findOne.mockResolvedValue(null);

    Favorite.create.mockResolvedValue({
      id_favorito: 1,
      id_usuario: 22,
      id_repositorio: 5,
      fecha_creacion: new Date('2026-04-24'),
    });

    await FavoriteController.add(req, res, next);

    expect(Repository.findOne).toHaveBeenCalledWith({
      where: {
        id_repositorio: 5,
        activo: true,
        publico: true,
      },
    });

    expect(Favorite.findOne).toHaveBeenCalledWith({
      where: {
        id_usuario: 22,
        id_repositorio: 5,
      },
    });

    expect(Favorite.create).toHaveBeenCalledWith({
      id_usuario: 22,
      id_repositorio: 5,
    });

    expect(res.status).toHaveBeenCalledWith(201);

    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: 'Repositorio agregado a favoritos',
      data: expect.objectContaining({
        id_usuario: 22,
        id_repositorio: 5,
        fecha_creacion: expect.any(Date),
      }),
    });

    expect(next).not.toHaveBeenCalled();
  });
});