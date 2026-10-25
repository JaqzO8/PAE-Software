const crypto = require('node:crypto');

const createQuestionSnapshot = (question) => ({
    id: String(question.id_pregunta),
    version: String(question.updated_at || question.updatedAt || question.created_at || question.createdAt || '1'),
    subject: question.materia,
    topic: question.tema || null,
    difficulty: question.dificultad,
    type: question.tipo,
    prompt: question.enunciado,
    options: Array.isArray(question.opciones) ? question.opciones : [],
    correctAnswer: question.respuesta_correcta ?? -1,
    answerText: question.respuesta_texto || '',
    explanation: question.explicacion || '',
});

const hashSubmission = (answers) => crypto
    .createHash('sha256')
    .update(JSON.stringify(Array.isArray(answers) ? answers : []))
    .digest('hex');

const toPublicQuestion = (question) => {
    const dto = typeof question?.toJSON === 'function' ? question.toJSON() : { ...question };
    for (const field of ['respuesta_correcta', 'respuesta_texto', 'correctAnswer', 'answerText', 'explicacion', 'explanation']) delete dto[field];
    return dto;
};

const scoreSnapshot = (snapshot, answers, now) => {
    const questions = Array.isArray(snapshot) ? snapshot : [];
    const submittedAnswers = Array.isArray(answers) ? answers : [];
    let correctAnswers = 0;
    let pendingManualReviews = 0;
    const solutions = questions.map((question, index) => {
        const userAnswer = submittedAnswers[index] ?? -1;
        const isCorrect = question.type === 'opcion_multiple' && userAnswer === question.correctAnswer;
        if (isCorrect) correctAnswers += 1;
        if (question.type === 'abierta' && userAnswer !== -1 && String(userAnswer).trim() !== '') pendingManualReviews += 1;
        return {
            question: {
                id: question.id,
                question: question.prompt,
                options: question.options,
                correctAnswer: question.correctAnswer,
                explanation: question.explanation,
                subject: question.subject,
                difficulty: question.difficulty,
                type: question.type,
            },
            userAnswer,
            isCorrect,
            requiresManualReview: question.type === 'abierta',
        };
    });
    const totalQuestions = questions.length;
    return {
        score: Math.round((correctAnswers / Math.max(totalQuestions, 1)) * 100),
        totalQuestions,
        correctAnswers,
        timeSpent: null,
        percentile: null,
        requiresManualReview: pendingManualReviews > 0,
        pendingManualReviews,
        resultVersion: pendingManualReviews > 0 ? null : 1,
        status: pendingManualReviews > 0 ? 'pending_review' : 'confirmed',
        confirmedAt: pendingManualReviews > 0 ? null : now.toISOString(),
        solutions,
    };
};

const scoreReviewedAttempt = (snapshot, answers, reviews) => {
    const questions = Array.isArray(snapshot) ? snapshot : [];
    const submittedAnswers = Array.isArray(answers) ? answers : [];
    const openReviews = Array.isArray(reviews) ? reviews : [];
    const correctMultipleChoice = questions.reduce((count, question, index) => (
        count + (question.type === 'opcion_multiple' && submittedAnswers[index] === question.correctAnswer ? 1 : 0)
    ), 0);
    const reviewed = openReviews.filter((review) => review.estado === 'revisado');
    const pendingManualReviews = openReviews.length - reviewed.length;
    const manualPoints = reviewed.reduce((sum, review) => sum + Number(review.puntaje || 0), 0);
    const manuallyCorrect = reviewed.filter((review) => Number(review.puntaje || 0) >= 3).length;
    const earnedPoints = correctMultipleChoice * 5 + manualPoints;
    return {
        score: Math.round((earnedPoints / Math.max(questions.length * 5, 1)) * 100),
        totalQuestions: questions.length,
        correctAnswers: correctMultipleChoice + manuallyCorrect,
        pendingManualReviews,
        status: pendingManualReviews > 0 ? 'pending_review' : 'confirmed',
    };
};

module.exports = { createQuestionSnapshot, hashSubmission, scoreSnapshot, scoreReviewedAttempt, toPublicQuestion };
