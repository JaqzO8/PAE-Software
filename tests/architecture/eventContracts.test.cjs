const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const root = path.resolve(__dirname, '../..');

test('contract: RecursoPublicado.v1 fixture matches contract requirements', () => {
    const fixture = require(path.join(root, 'backend/contracts/events/fixtures/RecursoPublicado.v1.json'));
    assert.equal(fixture.type, 'RecursoPublicado.v1');
    assert.equal(fixture.schemaVersion, 1);
    assert.equal(fixture.producer, 'content');
    assert.match(fixture.eventId, /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
    assert.match(fixture.correlationId, /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
    assert.match(fixture.occurredAt, /Z$/);

    const { data } = fixture;
    assert.match(data.resourceId, /^[1-9][0-9]{0,18}$/);
    assert.match(data.repositoryId, /^[1-9][0-9]{0,18}$/);
    assert.match(data.teacherId, /^[1-9][0-9]{0,18}$/);
    assert.equal(typeof data.title, 'string');
    assert.equal(['pdf', 'video', 'audio', 'imagen', 'enlace', 'otro'].includes(data.resourceType), true);
    assert.equal(typeof data.isPublic, 'boolean');
});

test('contract: LeccionCompletada.v1 fixture matches contract requirements', () => {
    const fixture = require(path.join(root, 'backend/contracts/events/fixtures/LeccionCompletada.v1.json'));
    assert.equal(fixture.type, 'LeccionCompletada.v1');
    assert.equal(fixture.schemaVersion, 1);
    assert.equal(fixture.producer, 'content');
    assert.match(fixture.eventId, /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
    assert.match(fixture.correlationId, /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
    assert.match(fixture.occurredAt, /Z$/);

    const { data } = fixture;
    assert.match(data.lessonId, /^[1-9][0-9]{0,18}$/);
    assert.match(data.repositoryId, /^[1-9][0-9]{0,18}$/);
    assert.match(data.userId, /^[1-9][0-9]{0,18}$/);
    assert.match(data.completedAt, /Z$/);
});
