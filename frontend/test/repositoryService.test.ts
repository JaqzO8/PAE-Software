import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { api } from '../src/services/api';
import * as service from '../src/features/repository/services/repositoryService';

vi.mock('../src/services/api', () => ({ api: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() } }));
const repo = { id_repositorio: 21, id_profesor: 7, titulo: 'Álgebra', descripcion: 'Repaso', publico: true,
  rating_promedio: '4.5', tags: [{ nombre: 'Ecuaciones' }, 'Práctica'], categoria: { nombre: 'Matemática' },
  fecha_creacion: '2026-01-01', portada: '/uploads/cover.png', recursos: [{}] };
beforeEach(() => {
  vi.resetAllMocks();
  vi.spyOn(console, 'log').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllEnvs(); });

test('exploration preserves filters, pagination and display data', async () => {
  vi.stubEnv('VITE_API_URL', 'https://pae.example/api');
  vi.mocked(api.get).mockResolvedValue({ data: { data: [repo], pagination: { total: 1 } } });
  const filters = { page: 2, search: 'Álgebra', categoria: 3 };
  const result = await service.exploreRepositories(filters);
  expect(api.get).toHaveBeenCalledWith('/content/repositories/explore', { params: filters });
  expect(result.pagination).toEqual({ total: 1 });
  expect(result.data[0]).toMatchObject({ id: '21', authorId: '7', title: 'Álgebra', rating: 4.5,
    tags: ['Ecuaciones', 'Práctica'], category: 'Matemática', isPublic: true, resourceCount: 1,
    coverImage: 'https://pae.example/uploads/cover.png' });
});

test.each([
  ['popular', () => service.getPopularRepositories(), '/content/repositories/popular', { params: { limit: 10 } }],
  ['featured', () => service.getFeaturedRepositories(3), '/content/repositories/destacados', { params: { limit: 3 } }],
  ['owned', () => service.getMyRepositories(), '/content/repositories/my', undefined],
] as const)('%s repositories use the expected collection', async (_name, call, url, options) => {
  vi.mocked(api.get).mockResolvedValue({ data: { data: [repo] } });
  expect((await call())[0].id).toBe('21');
  expect(vi.mocked(api.get).mock.calls[0]).toEqual(options ? [url, options] : [url]);
});

test.each([undefined, 'uploads/a.png', 'https://cdn.example/a.png'])('detail tolerates optional fields and image %s', async portada => {
  vi.stubEnv('VITE_API_URL', '/api');
  vi.mocked(api.get).mockResolvedValue({ data: { data: { id: '21', fecha_creacion: '2026-01-01', portada } } });
  const result = await service.getRepositoryById('21');
  expect(result).toMatchObject({ id: '21', rating: 0, views: 0, downloads: 0, tags: [], isPublic: false });
  expect(result.coverImage).toBe(!portada ? undefined : portada.startsWith('https') ? portada : `${window.location.origin}/${portada}`);
});

test.each(['create', 'update'] as const)('%s sends privacy, tags and file using multipart data', async action => {
  const input = { titulo: 'Álgebra', descripcion: 'Repaso', id_categoria: 3, publico: false,
    tags: ['Ecuaciones'], portada: new File(['image'], 'cover.png', { type: 'image/png' }) };
  const method = action === 'create' ? vi.mocked(api.post) : vi.mocked(api.put);
  method.mockResolvedValue({ data: { data: repo } });
  const result = action === 'create' ? await service.createRepository(input) : await service.updateRepository('21', input);
  expect(result.id).toBe('21');
  const [url, payload] = method.mock.calls[0];
  expect(url).toBe(action === 'create' ? '/content/repositories' : '/content/repositories/21');
  const form = payload as FormData;
  expect(form.get('publico')).toBe('false');
  expect(form.get('tags')).toBe('["Ecuaciones"]');
  expect(form.get('id_categoria')).toBe('3');
  expect((form.get('portada') as File).name).toBe('cover.png');
});

test('favorites retain their repository identity and toggle in both directions', async () => {
  vi.mocked(api.get).mockResolvedValueOnce({ data: { data: [{ repositorio: repo }] } })
    .mockResolvedValueOnce({ data: { isFavorite: true } });
  expect((await service.getFavorites())[0]).toMatchObject({ id: '21', isFavorite: true });
  expect(await service.checkFavorite('21')).toBe(true);
  await service.toggleFavorite('21', false);
  expect(api.post).toHaveBeenCalledWith('/content/favorites/21');
  await service.toggleFavorite('21', true);
  expect(api.delete).toHaveBeenCalledWith('/content/favorites/21');
});

test('rating and deletion target the selected repository', async () => {
  vi.mocked(api.get).mockResolvedValue({ data: { data: { puntuacion: 4 } } });
  await service.rateRepository('21', 4, 'Útil');
  expect(api.post).toHaveBeenCalledWith('/content/repositories/21/rate', { puntuacion: 4, comentario: 'Útil' });
  expect(await service.getMyRating('21')).toEqual({ puntuacion: 4 });
  await service.deleteRepository('21');
  expect(api.delete).toHaveBeenCalledWith('/content/repositories/21');
});

test.each([
  () => service.exploreRepositories(), () => service.getPopularRepositories(), () => service.getMyRepositories(),
  () => service.getRepositoryById('21'), () => service.createRepository({ titulo: 'A' }),
  () => service.updateRepository('21', {}), () => service.deleteRepository('21'), () => service.getFavorites(),
  () => service.addToFavorites('21'), () => service.removeFromFavorites('21'), () => service.rateRepository('21', 4),
])('failed operation propagates the server message instead of reporting success %#', async call => {
  for (const method of [api.get, api.post, api.put, api.delete]) vi.mocked(method).mockRejectedValue({ response: { data: { message: 'Acceso denegado' } } });
  await expect(call()).rejects.toThrow('Acceso denegado');
});

test('optional recommendations and personal indicators degrade to empty states on network failure', async () => {
  vi.mocked(api.get).mockRejectedValue(new Error('offline'));
  expect(await service.getFeaturedRepositories()).toEqual([]);
  expect(await service.checkFavorite('21')).toBe(false);
  expect(await service.getMyRating('21')).toBeNull();
  await expect(service.getRepositoryById('21')).rejects.toThrow('Repositorio no encontrado');
});
