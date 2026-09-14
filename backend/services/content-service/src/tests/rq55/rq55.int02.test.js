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

describe('TC-55-INT-02 - Evitar favorito duplicado', () => {
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

  test('Debe retornar 409 si el favorito ya existe', async () => {
    Repository.findOne.mockResolvedValue({
      id_repositorio: 5,
      activo: true,
      publico: true,
    });

    Favorite.findOne.mockResolvedValue({
      id_favorito: 1,
      id_usuario: 22,
      id_repositorio: 5,
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

    expect(Favorite.create).not.toHaveBeenCalled();

    expect(res.status).toHaveBeenCalledWith(409);

    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Este repositorio ya está en favoritos',
    });

    expect(next).not.toHaveBeenCalled();
  });
});