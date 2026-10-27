/**
 * Adaptador de consumo para RecursoPublicado.v1.
 *
 * El transporte y la persistencia de notificaciones pertenecen a sus servicios
 * propietarios. Este consumidor solo valida el contrato, resuelve la audiencia
 * mediante un puerto y aplica idempotencia antes de solicitar la notificación.
 */
function createResourcePublicationConsumer({ inbox, audience, notifications }) {
    if (!inbox?.hasProcessed || !inbox?.markProcessed) {
        throw new TypeError('inbox con hasProcessed y markProcessed es requerido');
    }
    if (!audience?.studentsForRepository || !notifications?.createInternal) {
        throw new TypeError('audience y notifications son requeridos');
    }

    return {
        async consume(event) {
            if (!event || event.type !== 'RecursoPublicado.v1' || event.schemaVersion !== 1 || event.producer !== 'content') {
                throw new Error('Evento RecursoPublicado.v1 inválido');
            }
            if (!event.eventId || !event.correlationId || !event.occurredAt || !event.data?.resourceId || !event.data?.repositoryId) {
                throw new Error('Evento RecursoPublicado.v1 incompleto');
            }
            if (await inbox.hasProcessed(event.eventId)) return { status: 'duplicate' };

            const students = await audience.studentsForRepository(event.data.repositoryId);
            for (const studentId of students) {
                await notifications.createInternal({
                    idempotencyKey: `${event.eventId}:${studentId}`,
                    userId: studentId,
                    type: 'nuevo_contenido',
                    title: 'Nuevo contenido disponible',
                    message: event.data.title || 'Se publicó un nuevo recurso en tu repositorio.',
                    metadata: {
                        resourceId: event.data.resourceId,
                        repositoryId: event.data.repositoryId,
                    },
                });
            }
            await inbox.markProcessed(event.eventId);
            return { status: 'processed', notified: students.length };
        },
    };
}

module.exports = { createResourcePublicationConsumer };
