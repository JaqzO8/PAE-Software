jest.mock('../../models', () => ({ Lesson: { findOne: jest.fn() }, Repository: { findOne: jest.fn() } }));
const { Lesson, Repository } = require('../../models');
const { authorizeLessonRead } = require('../../middlewares/lessonAccessMiddleware');

beforeEach(() => jest.resetAllMocks());

test.each([
    ['private outsider', false, true, 'estudiante', 2, 404],
    ['private owner', false, true, 'docente', 1, 200],
    ['private admin', false, true, 'admin', 2, 200],
    ['public student', true, true, 'estudiante', 2, 200],
    ['draft other teacher', true, false, 'docente', 2, 404],
    ['draft owner', true, false, 'docente', 1, 200],
])('%s', async (_label, publico, publicado, rol, id, status) => {
    Lesson.findOne.mockResolvedValue({ publicado, repositorio: { id_profesor: 1, publico } });
    const req = { params: { id: 10 }, query: {}, user: { id, rol } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() }, next = jest.fn();
    await authorizeLessonRead(req, res, next);
    if (status === 200) expect(next).toHaveBeenCalledWith();
    else { expect(res.status).toHaveBeenCalledWith(status); expect(next).not.toHaveBeenCalled(); }
});

test('listing validates repository and exposes drafts only to its owner', async () => {
    const req = { params: {}, query: {}, user: { id: 2, rol: 'docente' } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() }, next = jest.fn();
    await authorizeLessonRead(req, res, next);
    expect(res.status).toHaveBeenLastCalledWith(400);
    req.query.repositorio_id = 10;
    Repository.findOne.mockResolvedValue({ id_profesor: 1, publico: true });
    await authorizeLessonRead(req, res, next);
    expect(next).toHaveBeenCalledWith();
    expect(req.canViewLessonDrafts).toBe(false);
    Repository.findOne.mockResolvedValue(null);
    await authorizeLessonRead(req, res, next);
    expect(res.status).toHaveBeenLastCalledWith(404);
    const error = new Error('database unavailable');
    Repository.findOne.mockRejectedValue(error);
    await authorizeLessonRead(req, res, next);
    expect(next).toHaveBeenLastCalledWith(error);
});
