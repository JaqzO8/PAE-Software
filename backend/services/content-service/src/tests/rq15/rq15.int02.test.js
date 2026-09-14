const RepositoryController = require('../../controllers/repositoryController');

jest.mock('../../models', () => ({
  Repository: {
    findOne: jest.fn(),
  },
  Category: {},
  Tag: {
    findOrCreate: jest.fn(),
  },
  Resource: {},
  Rating: {},
}));

const { Repository } = require('../../models');

describe('TC-15-INT-02 - Revocar acceso compartido', () => {
  let reqUpdate;
  let reqGetById;
  let resUpdate;
  let resGetById;
  let next;

  beforeEach(() => {
    reqUpdate = {
      user: { id: 10 },
      params: { id: 5 },
      body: { publico: false },
    };

    reqGetById = {
      user: { id: 22 },
      params: { id: 5 },
    };

    resUpdate = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    resGetById = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    next = jest.fn();

    jest.clearAllMocks();
  });

  test('Debe revocar acceso y luego no permitir vista pública del repositorio', async () => {
    const repositoryMock = {
      id_repositorio: 5,
      id_profesor: 10,
      activo: true,
      titulo: 'Repositorio de prueba',
      descripcion: 'Descripción',
      id_categoria: 1,
      publico: true,
      portada: null,
      update: jest.fn().mockResolvedValue(true),
      reload: jest.fn().mockResolvedValue(true),
    };

    // 1) PUT /repositories/5 con publico=false
    Repository.findOne.mockResolvedValueOnce(repositoryMock);

    await RepositoryController.update(reqUpdate, resUpdate, next);

    expect(repositoryMock.update).toHaveBeenCalledWith(
      expect.objectContaining({
        publico: false,
      })
    );

    expect(resUpdate.status).toHaveBeenCalledWith(200);

    expect(resUpdate.json).toHaveBeenCalledWith({
      success: true,
      message: 'Repositorio actualizado exitosamente',
      data: repositoryMock,
    });

    // 2) GET público posterior: getById filtra por activo=true y publico=true
    Repository.findOne.mockResolvedValueOnce(null);

    await RepositoryController.getById(reqGetById, resGetById, next);

    expect(Repository.findOne).toHaveBeenLastCalledWith(
      expect.objectContaining({
        where: {
          id_repositorio: 5,
          activo: true,
          publico: true,
        },
      })
    );

    expect(resGetById.status).toHaveBeenCalledWith(404);

    expect(resGetById.json).toHaveBeenCalledWith({
      success: false,
      message: 'Repositorio no encontrado',
    });

    expect(next).not.toHaveBeenCalled();
  });
});