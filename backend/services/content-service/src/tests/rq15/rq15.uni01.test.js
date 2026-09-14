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
describe('TC-15-UNI-01 - Publicar repositorio con publico=true', () => {
  let req;
  let res;
  let next;
  beforeEach(() => {
    req = {
      user: { id: 10 },
      params: { id: 5 },
      body: { publico: true },
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();

    jest.clearAllMocks();
  });

  test('Debe actualizar el repositorio a publico=true', async () => {
    const repositoryMock = {
      id_repositorio: 5,
      id_profesor: 10,
      activo: true,
      titulo: 'Repositorio de prueba',
      descripcion: 'Descripción',
      id_categoria: 1,
      publico: false,
      portada: null,
      update: jest.fn().mockResolvedValue(true),
      reload: jest.fn().mockResolvedValue(true),
    };

    Repository.findOne.mockResolvedValue(repositoryMock);

    await RepositoryController.update(req, res, next);

    expect(Repository.findOne).toHaveBeenCalledWith({
      where: {
        id_repositorio: 5,
        id_profesor: 10,
        activo: true,
      },
    });

    expect(repositoryMock.update).toHaveBeenCalledWith(
      expect.objectContaining({
        publico: true,
      })
    );

    expect(res.status).toHaveBeenCalledWith(200);

    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: 'Repositorio actualizado exitosamente',
      data: repositoryMock,
    });

    expect(next).not.toHaveBeenCalled();
  });
});