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
const { Repository } = require('../../models');
describe('TC-74-SIS-03 - Sin repositorios públicos disponibles', () => {
  let req;
  let res;
  let next;

  beforeEach(() => {
    req = {
      query: {},
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    next = jest.fn();

    jest.clearAllMocks();
  });
  test('Debe retornar HTTP 200 con success=true y data=[]', async () => {
    Repository.findAll.mockResolvedValue([]);

    await RepositoryController.getPopular(req, res, next);

    expect(Repository.findAll).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { activo: true, publico: true },
        order: [['cantidad_vistas', 'DESC']],
        limit: 10,
      })
    );

    expect(res.status).toHaveBeenCalledWith(200);

    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: [],
    });
    expect(next).not.toHaveBeenCalled();
  });
});