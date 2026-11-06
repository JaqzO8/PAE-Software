const { createContentUseCases } = require('../../application/contentUseCases');
const { validateResourceTransition, validateFileIntegrity } = require('../../domain/contentPolicy');
let repo, useCases;
const actor = { id: 1, rol: 'docente' };
const input = { actor, repositoryId: 1, title: ' Material ', resourceType: 'pdf' };
const pdf = () => ({ originalname: 'guide.pdf', mimetype: 'application/pdf', buffer: Buffer.from('%PDF-1.4 fixture') });
beforeEach(() => {
    repo = {
        findRepository: jest.fn().mockResolvedValue({ id_repositorio: 1, id_profesor: 1, activo: true }),
        createResource: jest.fn(async data => ({ id_recurso: 9, ...data })),
        findResourceWithRepository: jest.fn(), incrementResourceDownloads: jest.fn(), incrementRepositoryDownloads: jest.fn(),
    };
    useCases = createContentUseCases({ unitOfWork: fn => fn(repo) });
});

test('attachment persists normalized metadata using uploaded bytes', async () => {
    const file = pdf();
    const result = await useCases.attachResource({ ...input, file, description: ' Resumen ', order: 2 });
    expect(result).toMatchObject({ titulo: 'Material', descripcion: 'Resumen', extension: '.pdf', tamaño_archivo: file.buffer.length, orden: 2 });
    expect(result.url_archivo).toContain('guide.pdf');
});

test('attachment delegates file persistence and keeps the returned metadata', async () => {
    const save = jest.fn().mockResolvedValue({ url: '/uploads/verified.pdf', size: 100, extension: '.pdf' });
    useCases = createContentUseCases({ unitOfWork: fn => fn(repo), fileStorage: { save } });
    const result = await useCases.attachResource({ ...input, file: pdf() });
    expect(save).toHaveBeenCalledTimes(1);
    expect(result).toMatchObject({ url_archivo: '/uploads/verified.pdf', tamaño_archivo: 100 });
});

test('external links do not require local file persistence', async () => {
    const result = await useCases.attachResource({ ...input, resourceType: 'enlace', externalUrl: 'https://example.test/material' });
    expect(result).toMatchObject({ url_archivo: null, url_externa: 'https://example.test/material', extension: null });
});

test.each([
    [{ title: '' }, 'INVALID_RESOURCE_TITLE'],
    [{ resourceType: 'executable' }, 'INVALID_RESOURCE_TYPE'],
    [{ file: null }, 'FILE_OR_URL_REQUIRED'],
])('rejects invalid resource input before writing (%j)', async (override, code) => {
    await expect(useCases.attachResource({ ...input, file: pdf(), ...override })).rejects.toMatchObject({ code });
    expect(repo.createResource).not.toHaveBeenCalled();
});

test('download returns stored metadata and accounts both counters; denied access changes neither', async () => {
    repo.findResourceWithRepository.mockResolvedValue({ id_recurso: 9, id_repositorio: 1, titulo: 'Guide', extension: '.pdf', activo: true, repositorio: { publico: true } });
    expect(await useCases.downloadResource({ actor, resourceId: 9 })).toMatchObject({ filename: 'Guide.pdf' });
    expect(repo.incrementResourceDownloads).toHaveBeenCalledWith(9);
    expect(repo.incrementRepositoryDownloads).toHaveBeenCalledWith(1);
    repo.findResourceWithRepository.mockResolvedValue(null);
    await expect(useCases.downloadResource({ actor, resourceId: 10 })).rejects.toMatchObject({ status: 404 });
    expect(repo.incrementResourceDownloads).toHaveBeenCalledTimes(1);
});

test('editorial transitions permit publication and reject returning directly to draft', () => {
    expect(() => validateResourceTransition('revisado', 'publicado')).not.toThrow();
    expect(() => validateResourceTransition('publicado', 'borrador')).toThrow();
    expect(() => validateResourceTransition('borrador', 'unknown')).toThrow();
});

test.each([
    ['image.png', 'image/png', [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]],
    ['image.jpg', 'image/jpeg', [0xff, 0xd8, 0xff, 0xe0]],
])('validates actual %s signature and rejects mislabeled content', (originalname, mimetype, bytes) => {
    expect(() => validateFileIntegrity({ originalname, mimetype, buffer: Buffer.from(bytes) })).not.toThrow();
    expect(() => validateFileIntegrity({ originalname, mimetype, buffer: Buffer.from('corrupt') })).toThrow();
});
