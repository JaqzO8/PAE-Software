const {
    fail,
    positiveId,
    requireTeacherOrAdmin,
    requireRepositoryOwner,
    sanitizeFileName,
    validateFileIntegrity,
    canDownloadResource,
    validateResourceTransition,
} = require('../domain/contentPolicy');
const fallbackUuid = () => globalThis.crypto.randomUUID();

/**
 * Casos de uso de Contenido Educativo (Módulo 2).
 * Desacoplado de frameworks HTTP y de Sequelize mediante puertos.
 *
 * Puertos requeridos:
 * - unitOfWork(async (repo) => ...): Ejecución transaccional.
 * - clock: { now: () => Date }
 * - fileStorage: { save: async (file), remove: async (path) }
 */
function createContentUseCases({ unitOfWork, clock = { now: () => new Date() }, fileStorage }) {
    return {
        /**
         * Caso de uso: Crear Repositorio Académico (RQ13)
         */
        createRepository: async ({ actor, title, description, categoryId, tags = [], isPublic = true, coverUrl = null }) => {
            requireTeacherOrAdmin(actor);

            if (typeof title !== 'string' || !title.trim() || title.trim().length > 200) {
                fail('INVALID_TITLE', 'El título del repositorio debe tener entre 1 y 200 caracteres');
            }

            const catId = positiveId(categoryId);

            return unitOfWork(async (repo) => {
                const repository = await repo.createRepository({
                    id_profesor: positiveId(actor.id),
                    titulo: title.trim(),
                    descripcion: description ? String(description).trim() : null,
                    id_categoria: catId,
                    publico: Boolean(isPublic),
                    portada: coverUrl,
                    fecha_creacion: clock.now(),
                });

                if (Array.isArray(tags) && tags.length > 0) {
                    await repo.assignTagsToRepository(repository.id_repositorio, tags);
                }

                return repository;
            });
        },

        /**
         * Caso de uso: Adjuntar Recurso Académico (RQ14, RQ38, JUA-06, JUA-07)
         */
        attachResource: async ({
            actor,
            repositoryId,
            title,
            description,
            resourceType,
            file,
            externalUrl = null,
            order = 0,
            clientRequestId = null,
        }) => {
            requireTeacherOrAdmin(actor);

            if (typeof title !== 'string' || !title.trim()) {
                fail('INVALID_RESOURCE_TITLE', 'El título del recurso es obligatorio');
            }

            const validTypes = ['pdf', 'video', 'audio', 'imagen', 'enlace', 'otro'];
            if (!validTypes.includes(resourceType)) {
                fail('INVALID_RESOURCE_TYPE', `Tipo de recurso inválido: ${resourceType}`);
            }

            if (!file && !externalUrl) {
                fail('FILE_OR_URL_REQUIRED', 'Se debe proporcionar un archivo o una URL externa');
            }

            if (file) {
                validateFileIntegrity(file);
                file.sanitizedName = sanitizeFileName(file.originalname);
            }

            return unitOfWork(async (repo) => {
                const repository = await repo.findRepository(positiveId(repositoryId));
                requireRepositoryOwner(repository, actor);

                // Prevención de duplicados por reintento (idempotencia)
                if (clientRequestId) {
                    const existing = await repo.findResourceByClientRequestId(clientRequestId);
                    if (existing) {
                        return { ...existing, replayed: true };
                    }
                }

                let fileUrl = null;
                let fileSize = null;
                let fileExtension = null;

                if (file) {
                    if (fileStorage?.save) {
                        const saved = await fileStorage.save(file);
                        fileUrl = saved.url;
                        fileSize = saved.size;
                        fileExtension = saved.extension;
                    } else {
                        fileUrl = file.url_archivo || `/uploads/resources/${resourceType}s/${file.sanitizedName}`;
                        fileSize = file.size || (file.buffer ? file.buffer.length : 0);
                        fileExtension = file.extension || `.${file.sanitizedName.split('.').pop()}`;
                    }
                }

                const resource = await repo.createResource({
                    id_repositorio: repository.id_repositorio,
                    titulo: title.trim(),
                    descripcion: description ? String(description).trim() : null,
                    tipo_recurso: resourceType,
                    url_archivo: fileUrl,
                    url_externa: externalUrl,
                    tamaño_archivo: fileSize,
                    extension: fileExtension,
                    orden: Number(order) || 0,
                    fecha_subida: clock.now(),
                    client_request_id: clientRequestId || null,
                    activo: true,
                });

                return resource;
            });
        },

        /**
         * Caso de uso: Publicar Material (JUA-07, JUA-15)
         */
        publishResource: async ({ actor, resourceId }) => {
            requireTeacherOrAdmin(actor);

            return unitOfWork(async (repo) => {
                const resource = await repo.findResourceWithRepository(positiveId(resourceId));
                if (!resource) fail('RESOURCE_NOT_FOUND', 'Recurso no encontrado', 404);
                requireRepositoryOwner(resource.repositorio, actor);

                const published = await repo.updateResource(resource.id_recurso, {
                    publicado: true,
                    fecha_publicacion: clock.now(),
                });

                // Registrar evento outbox para entrega durable de RecursoPublicado.v1
                await repo.recordOutboxEvent({
                    eventId: repo.generateUuid ? repo.generateUuid() : fallbackUuid(),
                    type: 'RecursoPublicado.v1',
                    schemaVersion: 1,
                    producer: 'content',
                    occurredAt: clock.now().toISOString(),
                    correlationId: repo.generateUuid ? repo.generateUuid() : fallbackUuid(),
                    data: {
                        resourceId: String(resource.id_recurso),
                        repositoryId: String(resource.id_repositorio),
                        teacherId: String(resource.repositorio.id_profesor),
                        title: resource.titulo,
                        resourceType: resource.tipo_recurso,
                        isPublic: resource.repositorio.publico,
                    },
                });

                return published;
            });
        },

        /**
         * Caso de uso: Descargar Material (RQ43, JUA-01, JUA-02)
         */
        downloadResource: async ({ actor, resourceId }) => {
            return unitOfWork(async (repo) => {
                const resource = await repo.findResourceWithRepository(positiveId(resourceId));
                canDownloadResource(resource, actor);

                await repo.incrementResourceDownloads(resource.id_recurso);
                await repo.incrementRepositoryDownloads(resource.id_repositorio);

                return {
                    id_recurso: resource.id_recurso,
                    titulo: resource.titulo,
                    url_archivo: resource.url_archivo,
                    url_externa: resource.url_externa,
                    extension: resource.extension,
                    filename: `${resource.titulo}${resource.extension || ''}`,
                };
            });
        },

        /**
         * Caso de uso: Completar Lección (AC-M2-S01-01, JUA-09, JUA-12)
         */
        completeLesson: async ({ actor, lessonId, score = null, timeSpentSeconds = 0 }) => {
            if (!actor || !actor.id) {
                fail('AUTHENTICATION_REQUIRED', 'Usuario no autenticado', 401);
            }

            return unitOfWork(async (repo) => {
                const lesson = await repo.findLesson(positiveId(lessonId));
                if (!lesson || !lesson.activo) {
                    fail('LESSON_NOT_FOUND', 'Lección no encontrada', 404);
                }

                const progress = await repo.saveLessonProgress({
                    id_leccion: lesson.id_leccion,
                    id_usuario: positiveId(actor.id),
                    completada: true,
                    puntuacion: score,
                    tiempo_segundos: Number(timeSpentSeconds) || 0,
                    fecha_completado: clock.now(),
                });

                // Registrar evento outbox para LeccionCompletada.v1
                await repo.recordOutboxEvent({
                    eventId: repo.generateUuid ? repo.generateUuid() : fallbackUuid(),
                    type: 'LeccionCompletada.v1',
                    schemaVersion: 1,
                    producer: 'content',
                    occurredAt: clock.now().toISOString(),
                    correlationId: repo.generateUuid ? repo.generateUuid() : fallbackUuid(),
                    data: {
                        lessonId: String(lesson.id_leccion),
                        repositoryId: String(lesson.id_repositorio),
                        userId: String(positiveId(actor.id)),
                        completedAt: clock.now().toISOString(),
                    },
                });

                return progress;
            });
        },
    };
}

module.exports = { createContentUseCases };
