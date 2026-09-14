const { hasAlreadyAnswered } = require('../services/liveAnswerRules');

describe('Cobertura de condiciones - hasAlreadyAnswered', () => {
    test('test_c1_true_c2_true_detecta_respuesta_repetida', () => {
        const result = hasAlreadyAnswered({
            answers: [{ userId: '42', questionId: '900' }],
            userId: '42',
            currentQuestionId: '900',
        });

        expect(result).toBe(true);
    });

    test('test_c1_true_c2_false_no_bloquea_otra_pregunta', () => {
        const result = hasAlreadyAnswered({
            answers: [{ userId: '42', questionId: '901' }],
            userId: '42',
            currentQuestionId: '900',
        });

        expect(result).toBe(false);
    });

    test('test_c1_false_c2_true_no_bloquea_otro_usuario', () => {
        const result = hasAlreadyAnswered({
            answers: [{ userId: '99', questionId: '900' }],
            userId: '42',
            currentQuestionId: '900',
        });

        expect(result).toBe(false);
    });

    test('caso_4_error_guessing_respuesta_corrupta_null_no_debe_romper_la_regla', () => {
        const result = hasAlreadyAnswered({
            answers: [null],
            userId: '42',
            currentQuestionId: '900',
        });

        expect(result).toBe(false);
    });
});
