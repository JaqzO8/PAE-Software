// Executed inside the isolated Content container against PostgreSQL, never the team's DB.
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const { sequelize } = require('/app/src/config/database');
const { Category, Lesson, LessonProgress, RepositoryTag, OutboxEvent } = require('/app/src/models');
const { createSequelizeContentRepository } = require('/app/src/infrastructure/sequelizeContentRepository');

async function run() {
    assert.equal(process.env.DB_NAME, 'qa_content');
    const teacherId = Number(process.argv[2]);
    assert.ok(Number.isSafeInteger(teacherId) && teacherId > 0);
    const repo = createSequelizeContentRepository();
    const category = await Category.findOne();
    const repositoryData = { id_profesor: teacherId, id_categoria: category.id_categoria, titulo: 'Persistencia QA', publico: false };
    const repository = await repo.createRepository(repositoryData);
    const id = repository.id_repositorio;
    assert.equal((await repo.findRepository(id)).titulo, repositoryData.titulo);
    await repo.assignTagsToRepository(id, ['QA adapter', ' ', 'QA adapter', 'QA second']);
    assert.equal(await RepositoryTag.count({ where: { id_repositorio: id } }), 2);

    const requestId = randomUUID();
    const resource = await repo.createResource({ id_repositorio: id, titulo: 'Metadatos QA', tipo_recurso: 'pdf', client_request_id: requestId });
    const resourceId = resource.id_recurso;
    assert.equal((await repo.findResourceWithRepository(resourceId)).repositorio.id_repositorio, id);
    assert.equal((await repo.findResourceByClientRequestId(requestId)).id_recurso, resourceId);
    assert.equal(await repo.findResourceByClientRequestId(randomUUID()), null);
    await repo.updateResource(resourceId, { titulo: 'Revisión QA' });
    assert.equal((await repo.findResourceWithRepository(resourceId)).titulo, 'Revisión QA');
    assert.equal(await repo.updateResource(2147483647, { titulo: 'Ausente' }), null);
    await repo.incrementResourceDownloads(resourceId);
    await repo.incrementRepositoryDownloads(id);
    await repo.incrementResourceDownloads(2147483647);
    await repo.incrementRepositoryDownloads(2147483647);
    assert.equal((await repo.findResourceWithRepository(resourceId)).descargas, 1);
    assert.equal((await repo.findRepository(id)).cantidad_descargas, 1);

    const lesson = await Lesson.create({ id_repositorio: id, titulo: 'Lección QA', contenido: 'Lectura de prueba' });
    assert.equal((await repo.findLesson(lesson.id_leccion)).titulo, 'Lección QA');
    const progress = { id_leccion: lesson.id_leccion, id_usuario: teacherId, completada: true, puntuacion: 10, tiempo_segundos: 20, fecha_completado: new Date() };
    await repo.saveLessonProgress(progress);
    await repo.saveLessonProgress({ ...progress, puntuacion: 15, tiempo_segundos: 30 });
    const stored = await LessonProgress.findOne({ where: { id_leccion: lesson.id_leccion, id_usuario: teacherId } });
    assert.equal(Number(stored.puntuacion), 15);
    assert.equal(stored.tiempo_segundos, 30);

    let rolledBackId;
    await assert.rejects(sequelize.transaction(async transaction => {
        rolledBackId = (await createSequelizeContentRepository({ transaction }).createRepository(repositoryData)).id_repositorio;
        throw new Error('rollback fixture');
    }), /rollback fixture/);
    assert.equal(await repo.findRepository(rolledBackId), null);

    const event = { eventId: repo.generateUuid(), type: 'RecursoPublicado.v1', schemaVersion: 1, producer: 'content',
        correlationId: randomUUID(), occurredAt: new Date(), data: { resourceId: String(resourceId) } };
    const secondId = randomUUID();
    await repo.recordOutboxEvent(event);
    await repo.recordOutboxEvent({ ...event, eventId: secondId });
    await assert.rejects(repo.recordOutboxEvent(event), /No se pudo persistir evento Outbox/);
    const batches = await Promise.all([repo.claimPendingEvents(100, new Date()), repo.claimPendingEvents(100, new Date())]);
    const ids = batches.flat().map(item => item.event_id);
    assert.equal(new Set(ids).size, ids.length, 'Concurrent workers must never claim the same event');
    assert.ok(ids.includes(event.eventId) && ids.includes(secondId));
    await repo.markEventPublished(event.eventId, new Date());
    assert.equal((await OutboxEvent.findByPk(event.eventId)).status, 'published');
    await repo.markEventFailed(secondId, { status: 'pending', attempts: 1, error: 'transient fixture failure' });
    const retry = (await repo.claimPendingEvents(100, new Date())).find(item => item.event_id === secondId);
    assert.equal(retry.attempts, 2);
    await repo.markEventPublished(secondId, new Date());
    console.log('PASS JUA-DB01: real repository, rollback, durable outbox, concurrent claims and retry');
}

run().catch(error => { console.error(error); process.exitCode = 1; }).finally(() => sequelize.close());
