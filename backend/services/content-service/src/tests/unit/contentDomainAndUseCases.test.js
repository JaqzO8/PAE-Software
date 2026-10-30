const { createContentUseCases } = require('../../application/contentUseCases');
const {
    ContentError,
    sanitizeFileName,
    validateFileIntegrity,
    canDownloadResource,
} = require('../../domain/contentPolicy');

describe('JUA-05 / JUA-06 / JUA-07: Dominio y Casos de Uso de Contenido Educativo', () => {
    let mockRepo;
    let mockUnitOfWork;
    let clock;
    let useCases;

    beforeEach(() => {
        mockRepo = {
            createRepository: jest.fn(),
            assignTagsToRepository: jest.fn(),
            findRepository: jest.fn(),
            findResourceWithRepository: jest.fn(),
            findResourceByClientRequestId: jest.fn(),
            createResource: jest.fn(),
            updateResource: jest.fn(),
            recordOutboxEvent: jest.fn(),
            incrementResourceDownloads: jest.fn(),
            incrementRepositoryDownloads: jest.fn(),
            findLesson: jest.fn(),
            saveLessonProgress: jest.fn(),
        };

        mockUnitOfWork = jest.fn((cb) => cb(mockRepo));
        clock = { now: () => new Date('2026-10-25T12:00:00.000Z') };

        useCases = createContentUseCases({
            unitOfWork: mockUnitOfWork,
            clock,
        });
    });

    describe('Políticas de Dominio (contentPolicy)', () => {
        test('Sanitiza nombres de archivo y previene path traversal', () => {
            const clean = sanitizeFileName('capitulo 1 / final.pdf');
            expect(clean).toBe('capitulo_1___final.pdf');

            expect(() => sanitizeFileName('../../../etc/passwd')).toThrow(ContentError);
            expect(() => sanitizeFileName('')).toThrow(ContentError);
        });

        test('Rechaza extensiones ejecutables o peligrosas con 422', () => {
            const dangerous = { originalname: 'virus.exe', buffer: Buffer.from('MZ') };
            expect(() => validateFileIntegrity(dangerous)).toThrow(
                expect.objectContaining({ status: 422, code: 'DANGEROUS_FILE_EXTENSION' })
            );
        });

        test('Valida integridad de cabecera PDF (%PDF-) para evitar archivos corruptos o falsos', () => {
            const fakePdf = {
                originalname: 'guia.pdf',
                mimetype: 'application/pdf',
                buffer: Buffer.from('NOT_A_PDF_HEADER'),
            };
            expect(() => validateFileIntegrity(fakePdf)).toThrow(
                expect.objectContaining({ status: 422, code: 'INVALID_PDF_HEADER' })
            );

            const validPdf = {
                originalname: 'guia.pdf',
                mimetype: 'application/pdf',
                buffer: Buffer.from('%PDF-1.5 test content'),
            };
            expect(() => validateFileIntegrity(validPdf)).not.toThrow();
        });

        test('Controla permisos de descarga según privacidad del repositorio', () => {
            const publicResource = {
                id_recurso: 1,
                activo: true,
                repositorio: { id_profesor: 10, publico: true },
            };
            expect(canDownloadResource(publicResource, { id: 5, rol: 'estudiante' })).toBe(true);

            const privateResource = {
                id_recurso: 2,
                activo: true,
                repositorio: { id_profesor: 10, publico: false },
            };
            // Estudiante ajeno -> denegado
            expect(() => canDownloadResource(privateResource, { id: 5, rol: 'estudiante' })).toThrow(
                expect.objectContaining({ status: 403, code: 'ACCESS_DENIED' })
            );
            // Docente dueño -> permitido
            expect(canDownloadResource(privateResource, { id: 10, rol: 'docente' })).toBe(true);
        });
    });

    describe('Casos de Uso (contentUseCases)', () => {
        test('createRepository: crea repositorio con permisos de docente y tags', async () => {
            const actor = { id: 10, rol: 'docente' };
            mockRepo.createRepository.mockResolvedValue({ id_repositorio: 1, titulo: 'Física I' });

            const result = await useCases.createRepository({
                actor,
                title: 'Física I',
                description: 'Mecánica clásica',
                categoryId: 3,
                tags: ['fisica', 'cinematica'],
                isPublic: true,
            });

            expect(result.id_repositorio).toBe(1);
            expect(mockRepo.createRepository).toHaveBeenCalledWith(
                expect.objectContaining({
                    id_profesor: 10,
                    titulo: 'Física I',
                    id_categoria: 3,
                    publico: true,
                })
            );
            expect(mockRepo.assignTagsToRepository).toHaveBeenCalledWith(1, ['fisica', 'cinematica']);
        });

        test('createRepository: deniega creación a estudiantes con 403', async () => {
            const studentActor = { id: 2, rol: 'estudiante' };

            await expect(
                useCases.createRepository({
                    actor: studentActor,
                    title: 'Intento Estudiante',
                    categoryId: 1,
                })
            ).rejects.toThrow(expect.objectContaining({ status: 403, code: 'TEACHER_REQUIRED' }));
        });

        test('attachResource: detecta reintento de carga idempotente por clientRequestId', async () => {
            const actor = { id: 10, rol: 'docente' };
            mockRepo.findRepository.mockResolvedValue({ id_repositorio: 1, id_profesor: 10, activo: true });
            mockRepo.findResourceByClientRequestId.mockResolvedValue({
                id_recurso: 99,
                titulo: 'Guía existente',
                client_request_id: 'req-uuid-1234',
            });

            const result = await useCases.attachResource({
                actor,
                repositoryId: 1,
                title: 'Guía existente',
                resourceType: 'pdf',
                file: { originalname: 'doc.pdf', mimetype: 'application/pdf', buffer: Buffer.from('%PDF-1.4') },
                clientRequestId: 'req-uuid-1234',
            });

            expect(result.replayed).toBe(true);
            expect(mockRepo.createResource).not.toHaveBeenCalled();
        });

        test('publishResource: publica material y registra evento outbox RecursoPublicado', async () => {
            const actor = { id: 10, rol: 'docente' };
            mockRepo.findResourceWithRepository.mockResolvedValue({
                id_recurso: 5,
                id_repositorio: 1,
                titulo: 'Lección Cinemática',
                tipo_recurso: 'pdf',
                repositorio: { id_profesor: 10, publico: true, activo: true },
            });
            mockRepo.updateResource.mockResolvedValue({ id_recurso: 5, publicado: true });

            const result = await useCases.publishResource({ actor, resourceId: 5 });

            expect(result.publicado).toBe(true);
            expect(mockRepo.recordOutboxEvent).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: 'RecursoPublicado.v1',
                    producer: 'content',
                    data: expect.objectContaining({
                        resourceId: '5',
                        repositoryId: '1',
                        teacherId: '10',
                    }),
                })
            );
        });

        test('completeLesson: guarda progreso completado y registra evento outbox LeccionCompletada', async () => {
            const studentActor = { id: 7, rol: 'estudiante' };
            mockRepo.findLesson.mockResolvedValue({
                id_leccion: 15,
                id_repositorio: 2,
                activo: true,
            });
            mockRepo.saveLessonProgress.mockResolvedValue({
                id_progreso: 1,
                id_leccion: 15,
                id_usuario: 7,
                completada: true,
            });

            const result = await useCases.completeLesson({
                actor: studentActor,
                lessonId: 15,
                score: 18.5,
                timeSpentSeconds: 450,
            });

            expect(result.completada).toBe(true);
            expect(mockRepo.recordOutboxEvent).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: 'LeccionCompletada.v1',
                    data: expect.objectContaining({
                        lessonId: '15',
                        userId: '7',
                    }),
                })
            );
        });
    });
});
