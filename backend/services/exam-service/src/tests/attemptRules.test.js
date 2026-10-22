const { createQuestionSnapshot, hashSubmission, scoreSnapshot, scoreReviewedAttempt } = require('../services/attemptRules');

describe('authoritative attempt rules', () => {
    const question = {
        id_pregunta: 42,
        updated_at: new Date('2026-10-20T12:00:00.000Z'),
        materia: 'Matemática',
        tema: 'Álgebra',
        dificultad: 'medio',
        tipo: 'opcion_multiple',
        enunciado: '¿Cuánto es 6 × 7?',
        opciones: ['36', '42'],
        respuesta_correcta: 1,
        explicacion: 'Seis por siete es 42.',
    };

    test('captures a private immutable question version for an attempt', () => {
        const editable = { ...question };
        const snapshot = createQuestionSnapshot(editable);
        editable.enunciado = 'Pregunta editada';
        editable.respuesta_correcta = 0;

        expect(snapshot).toMatchObject({ id: '42', prompt: '¿Cuánto es 6 × 7?', correctAnswer: 1, version: expect.any(String) });
        expect(snapshot).not.toHaveProperty('respuesta_correcta');
    });

    test('uses snapshot answers and leaves cohort percentile undefined', () => {
        const snapshot = [createQuestionSnapshot(question)];
        question.respuesta_correcta = 0;
        const result = scoreSnapshot(snapshot, [1], new Date('2026-10-20T12:05:00.000Z'));

        expect(result.score).toBe(100);
        expect(result.correctAnswers).toBe(1);
        expect(result.percentile).toBeNull();
        expect(result.status).toBe('confirmed');
    });

    test('hashes answer payloads deterministically and distinguishes changed retries', () => {
        expect(hashSubmission([1, 'texto'])).toBe(hashSubmission([1, 'texto']));
        expect(hashSubmission([1, 'texto'])).not.toBe(hashSubmission([0, 'texto']));
    });

    test('keeps open answers pending manual review', () => {
        const result = scoreSnapshot([{
            id: '9', type: 'abierta', prompt: 'Explica', options: [], correctAnswer: -1,
            explanation: '', subject: 'Ciencias', difficulty: 'medio',
        }], ['respuesta'], new Date('2026-10-20T12:05:00.000Z'));

        expect(result.requiresManualReview).toBe(true);
        expect(result.pendingManualReviews).toBe(1);
        expect(result.score).toBe(0);
        expect(result.status).toBe('pending_review');
        expect(result.resultVersion).toBeNull();
    });

    test('confirms a result only after every open answer has an audited score', () => {
        const snapshot = [
            { type: 'opcion_multiple', correctAnswer: 1 },
            { type: 'abierta', correctAnswer: -1 },
        ];
        const pending = scoreReviewedAttempt(snapshot, [1, 'respuesta'], [
            { estado: 'revisado', puntaje: 4 },
            { estado: 'pendiente', puntaje: null },
        ]);
        const confirmed = scoreReviewedAttempt(snapshot, [1, 'respuesta'], [
            { estado: 'revisado', puntaje: 4 },
        ]);

        expect(pending.status).toBe('pending_review');
        expect(pending.pendingManualReviews).toBe(1);
        expect(confirmed).toMatchObject({ status: 'confirmed', score: 90, correctAnswers: 2, pendingManualReviews: 0 });
    });
});
