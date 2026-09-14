const RepositoryController = require('../../controllers/repositoryController');

jest.mock('../../models', () => ({
  Repository: {
    findAll: jest.fn(),
  },
  Resource: {},
  Category: {},
  Tag: {},
  Rating: {},
}));

const { Repository, Category, Tag } = require('../../models');

describe('TC-74-UNI-01 - Obtener ranking de repositorios populares', () => {
  let req;
  let res;
  let next;

  beforeEach(() => {
    req = {
      query: {
        limit: 10,
        orderBy: 'cantidad_vistas',
      },
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    next = jest.fn();

    jest.clearAllMocks();
  });

  test('Debe retornar HTTP 200 con repositorios populares ordenados por cantidad_vistas DESC', async () => {
    const repositoriosMock = [
      {
        id_repositorio: 1,
        titulo: 'Repositorio A',
        cantidad_vistas: 50,
        cantidad_descargas: 10,
        categoria: { id_categoria: 1, nombre: 'Matemáticas', icono: '🔢' },
        tags: [{ id_tag: 1, nombre: 'Álgebra', slug: 'algebra' }],
      },
      {
        id_repositorio: 2,
        titulo: 'Repositorio B',
        cantidad_vistas: 30,
        cantidad_descargas: 5,
        categoria: { id_categoria: 2, nombre: 'Ciencias', icono: '🔬' },
        tags: [{ id_tag: 2, nombre: 'Física', slug: 'fisica' }],
      },
    ];

    Repository.findAll.mockResolvedValue(repositoriosMock);

    await RepositoryController.getPopular(req, res, next);

    expect(Repository.findAll).toHaveBeenCalledWith({
      where: { activo: true, publico: true },
      include: [
        {
          model: Category,
          as: 'categoria',
          attributes: ['id_categoria', 'nombre', 'icono'],
        },
        {
          model: Tag,
          as: 'tags',
          attributes: ['id_tag', 'nombre', 'slug'],
          through: { attributes: [] },
        },
      ],
      order: [['cantidad_vistas', 'DESC']],
      limit: 10,
    });

    expect(res.status).toHaveBeenCalledWith(200);

    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: repositoriosMock,
    });

    expect(next).not.toHaveBeenCalled();
  });
});