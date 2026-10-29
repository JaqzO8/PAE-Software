const crypto = require('node:crypto');
const { sequelize } = require('../config/database');
const { Repository, Resource, Lesson, LessonProgress, Tag, RepositoryTag } = require('../models');

/**
 * Adaptador de repositorio de persistencia con Sequelize para ContentUseCases.
 */
function createSequelizeContentRepository({ transaction = null } = {}) {
    return {
        createRepository: async (data) => {
            return Repository.create(data, { transaction });
        },

        assignTagsToRepository: async (repoId, tags) => {
            for (const tagName of tags) {
                const cleanName = String(tagName).trim();
                if (!cleanName) continue;
                const slug = cleanName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
                const [tag] = await Tag.findOrCreate({
                    where: { slug },
                    defaults: { nombre: cleanName, slug },
                    transaction,
                });
                await RepositoryTag.findOrCreate({
                    where: { id_repositorio: repoId, id_tag: tag.id_tag },
                    defaults: { id_repositorio: repoId, id_tag: tag.id_tag },
                    transaction,
                });
            }
        },

        findRepository: async (id) => {
            return Repository.findOne({
                where: { id_repositorio: id, activo: true },
                transaction,
            });
        },

        findResourceWithRepository: async (id) => {
            return Resource.findOne({
                where: { id_recurso: id, activo: true },
                include: [{
                    model: Repository,
                    as: 'repositorio',
                    where: { activo: true },
                }],
                transaction,
            });
        },

        findResourceByClientRequestId: async (clientRequestId) => {
            const attributes = Resource.rawAttributes || {};
            if (!attributes.client_request_id) {
                return null;
            }
            return Resource.findOne({
                where: { client_request_id: clientRequestId, activo: true },
                transaction,
            });
        },

        createResource: async (data) => {
            return Resource.create(data, { transaction });
        },

        updateResource: async (id, data) => {
            const resource = await Resource.findByPk(id, { transaction });
            if (resource) {
                await resource.update(data, { transaction });
            }
            return resource;
        },

        recordOutboxEvent: async (eventPayload) => {
            // A durable publication must fail when the event cannot be persisted.
            try {
                const { OutboxEvent } = require('../models');
                await OutboxEvent.create({
                        event_id: eventPayload.eventId,
                        event_type: eventPayload.type,
                        schema_version: eventPayload.schemaVersion,
                        producer: eventPayload.producer,
                        payload: { ...eventPayload.data, correlationId: eventPayload.correlationId },
                        status: 'pending',
                        occurred_at: eventPayload.occurredAt,
                }, { transaction });
            } catch (err) {
                err.message = `No se pudo persistir evento Outbox: ${err.message}`;
                throw err;
            }
        },

        claimPendingEvents: async (limit, now) => {
            const { OutboxEvent } = require('../models');
            const { Op } = require('sequelize');
            const staleBefore = new Date(new Date(now).getTime() - 5 * 60 * 1000);
            return sequelize.transaction(async (tx) => {
                const events = await OutboxEvent.findAll({
                    where: {
                        [Op.or]: [
                            { status: 'pending' },
                            { status: 'processing', updated_at: { [Op.lt]: staleBefore } },
                        ],
                    },
                    order: [['created_at', 'ASC']],
                    limit,
                    lock: tx.LOCK.UPDATE,
                    skipLocked: true,
                    transaction: tx,
                });
                for (const event of events) {
                    await event.update({ status: 'processing', attempts: event.attempts + 1, last_error: null }, { transaction: tx });
                }
                return events.map((event) => ({ ...event.toJSON(), claimedAt: now }));
            });
        },

        markEventPublished: async (eventId, publishedAt) => {
            const { OutboxEvent } = require('../models');
            await OutboxEvent.update(
                { status: 'published', published_at: publishedAt },
                { where: { event_id: eventId } },
            );
        },

        markEventFailed: async (eventId, { status, attempts, error }) => {
            const { OutboxEvent } = require('../models');
            await OutboxEvent.update(
                { status, attempts, last_error: error },
                { where: { event_id: eventId } },
            );
        },

        incrementResourceDownloads: async (id) => {
            const resource = await Resource.findByPk(id, { transaction });
            if (resource) {
                await resource.increment('descargas', { by: 1, transaction });
            }
        },

        incrementRepositoryDownloads: async (id) => {
            const repository = await Repository.findByPk(id, { transaction });
            if (repository) {
                await repository.increment('cantidad_descargas', { by: 1, transaction });
            }
        },

        findLesson: async (id) => {
            return Lesson.findOne({
                where: { id_leccion: id, activo: true },
                transaction,
            });
        },

        saveLessonProgress: async (data) => {
            const [progress, created] = await LessonProgress.findOrCreate({
                where: {
                    id_leccion: data.id_leccion,
                    id_usuario: data.id_usuario,
                },
                defaults: data,
                transaction,
            });

            if (!created) {
                await progress.update({
                    completada: true,
                    puntuacion: data.puntuacion !== undefined ? data.puntuacion : progress.puntuacion,
                    tiempo_segundos: data.tiempo_segundos || progress.tiempo_segundos,
                    fecha_completado: data.fecha_completado || new Date(),
                }, { transaction });
            }

            return progress;
        },

        generateUuid: () => {
            return crypto.randomUUID();
        },
    };
}

module.exports = { createSequelizeContentRepository };
