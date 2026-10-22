const { Op } = require('sequelize');
const { randomUUID } = require('node:crypto');
const {
    University,
    Question,
    SimulacroAttempt,
    SavedQuestion,
    OpenAnswerReview,
    OpenAnswerReviewAudit,
    ChallengeRoom,
    ChallengeMatch,
    TriviaRoom,
    TriviaMatch,
    AnalyticsSetting,
    ExamOutbox,
} = require('../models');
const { sequelize } = require('../config/database');
const { createQuestionSnapshot, hashSubmission, scoreSnapshot, scoreReviewedAttempt } = require('../services/attemptRules');
const AchievementService = require('../services/achievementService');
const GamificationService = require('../services/gamificationService');
const { hasAlreadyAnswered } = require('../services/liveAnswerRules');
const {
    emitChallengeRoomsUpdated,
    emitChallengeRoomUpdated,
    emitChallengeGameUpdated,
    emitTriviaRoomsUpdated,
    emitTriviaRoomUpdated,
    emitTriviaGameUpdated,
} = require('../realtime/learningSocket');

const normalizeDifficulty = (difficulty) => {
    const map = { easy: 'facil', medium: 'medio', hard: 'dificil' };
    return map[difficulty] || difficulty || 'medio';
};

const shuffle = (items) => [...items].sort(() => Math.random() - 0.5);

const toFrontendQuestion = (question, { includeAnswer = false } = {}) => ({
    id: String(question.id_pregunta),
    question: question.enunciado,
    options: question.opciones || [],
    ...(includeAnswer ? { correctAnswer: question.respuesta_correcta ?? -1 } : {}),
    explanation: includeAnswer ? (question.explicacion || '') : '',
    subject: question.materia,
    difficulty: question.dificultad,
    type: question.tipo,
});

const isBlankAnswer = (answer) => answer === null || answer === undefined || answer === '';

const answerToText = (answer) => {
    if (answer === null || answer === undefined) return '';
    if (typeof answer === 'string') return answer.trim();
    return String(answer);
};

const userDisplayName = (user) => [user.nombres, user.apellidos].filter(Boolean).join(' ').trim() || user.email || 'Usuario PAE';

const toFrontendRoom = (room) => {
    const participants = Array.isArray(room.participantes) ? room.participantes : [];

    return {
        id: String(room.id_sala),
        host: room.anfitrion_nombre,
        topic: room.tema,
        difficulty: room.dificultad,
        currentPlayers: participants.length,
        maxPlayers: room.max_jugadores,
        status: room.estado,
        createdAt: room.created_at || room.createdAt,
        participants,
    };
};

const toFrontendTriviaRoom = (room) => {
    const participants = Array.isArray(room.participantes) ? room.participantes : [];

    return {
        id: String(room.id_sala),
        host: room.anfitrion_nombre,
        topic: room.tema,
        questionsCount: room.preguntas_count,
        currentPlayers: participants.length,
        maxPlayers: room.max_jugadores,
        status: room.estado,
        createdAt: room.created_at || room.createdAt,
        participants,
    };
};

const toLiveQuestion = (question) => ({
    id: String(question.id_pregunta),
    question: question.enunciado,
    options: question.opciones || [],
    subject: question.materia,
    difficulty: question.dificultad,
});

const userIsParticipant = (room, userId) => {
    const participants = Array.isArray(room.participantes) ? room.participantes : [];
    return participants.some((participant) => String(participant.id) === String(userId));
};

const buildInitialScoreboard = (room) => {
    const participants = Array.isArray(room.participantes) ? room.participantes : [];
    return participants.map((participant) => ({
        id: String(participant.id),
        name: participant.name,
        score: 0,
        correctAnswers: 0,
        answered: 0,
    }));
};

const speedScore = (isCorrect, responseMs) => {
    if (!isCorrect) return 0;
    return Math.max(100, 1000 - Math.floor(Math.max(0, responseMs) / 100));
};

const toFrontendMatch = (room, match, questions = []) => {
    const questionMap = new Map(questions.map((question) => [Number(question.id_pregunta), question]));
    const questionIds = Array.isArray(match.preguntas) ? match.preguntas : [];
    const currentQuestionId = questionIds[match.pregunta_actual];
    const currentQuestion = currentQuestionId ? questionMap.get(Number(currentQuestionId)) : null;
    const answers = Array.isArray(match.respuestas) ? match.respuestas : [];
    const currentAnswers = currentQuestionId
        ? answers.filter((answer) => Number(answer.questionId) === Number(currentQuestionId))
        : [];

    return {
        id: String(match.id_partida),
        room: toFrontendRoom(room),
        status: match.estado,
        currentQuestionIndex: match.pregunta_actual,
        totalQuestions: questionIds.length,
        timePerQuestion: match.tiempo_por_pregunta,
        questionStartedAt: match.pregunta_inicia_en,
        currentQuestion: currentQuestion && match.estado === 'playing' ? toLiveQuestion(currentQuestion) : null,
        scoreboard: (Array.isArray(match.marcador) ? match.marcador : [])
            .sort((a, b) => Number(b.score || 0) - Number(a.score || 0)),
        answersCount: currentAnswers.length,
        expectedAnswers: Array.isArray(room.participantes) ? room.participantes.length : 0,
        lastAnswers: answers.slice(-8),
    };
};

const toFrontendTriviaMatch = (room, match, questions = []) => {
    const questionMap = new Map(questions.map((question) => [Number(question.id_pregunta), question]));
    const questionIds = Array.isArray(match.preguntas) ? match.preguntas : [];
    const currentQuestionId = questionIds[match.pregunta_actual];
    const currentQuestion = currentQuestionId ? questionMap.get(Number(currentQuestionId)) : null;
    const answers = Array.isArray(match.respuestas) ? match.respuestas : [];
    const currentAnswers = currentQuestionId
        ? answers.filter((answer) => Number(answer.questionId) === Number(currentQuestionId))
        : [];

    return {
        id: String(match.id_partida),
        room: toFrontendTriviaRoom(room),
        status: match.estado,
        currentQuestionIndex: match.pregunta_actual,
        totalQuestions: questionIds.length,
        timePerQuestion: match.tiempo_por_pregunta,
        questionStartedAt: match.pregunta_inicia_en,
        currentQuestion: currentQuestion && match.estado === 'playing' ? toLiveQuestion(currentQuestion) : null,
        scoreboard: (Array.isArray(match.marcador) ? match.marcador : [])
            .sort((a, b) => Number(b.score || 0) - Number(a.score || 0)),
        answersCount: currentAnswers.length,
        expectedAnswers: Array.isArray(room.participantes) ? room.participantes.length : 0,
        lastAnswers: answers.slice(-8),
    };
};

const DEFAULT_ANALYTICS_SETTINGS = {
    lowPerformanceThreshold: 60,
    criticalPerformanceThreshold: 45,
    minAttemptsForAlert: 2,
    weakSubjectMinQuestions: 2,
    targetAccuracy: 70,
    studentHistoryLimit: 100,
    cohortHistoryLimit: 500,
};

const toFrontendAnalyticsSettings = (settings) => ({
    lowPerformanceThreshold: Number(settings.umbral_bajo_rendimiento),
    criticalPerformanceThreshold: Number(settings.umbral_critico_rendimiento),
    minAttemptsForAlert: Number(settings.intentos_minimos_alerta),
    weakSubjectMinQuestions: Number(settings.preguntas_minimas_materia_debil),
    targetAccuracy: Number(settings.precision_objetivo),
    studentHistoryLimit: Number(settings.limite_historial_estudiante),
    cohortHistoryLimit: Number(settings.limite_historial_cohorte),
});

const getAnalyticsSettings = async () => {
    const [settings] = await AnalyticsSetting.findOrCreate({
        where: { id_configuracion: 1 },
        defaults: { id_configuracion: 1 },
    });

    return toFrontendAnalyticsSettings(settings);
};

const clampInteger = (value, min, max, fallback) => {
    const parsed = Number.parseInt(value, 10);
    if (!Number.isFinite(parsed)) return fallback;
    return Math.min(max, Math.max(min, parsed));
};

const buildSubjectStats = async (attempts) => {
    const questionIds = [...new Set(attempts.flatMap((attempt) => (
        Array.isArray(attempt.preguntas) ? attempt.preguntas : []
    )))];

    if (questionIds.length === 0) return [];

    const questions = await Question.findAll({
        where: { id_pregunta: { [Op.in]: questionIds } },
    });
    const questionMap = new Map(questions.map((question) => [Number(question.id_pregunta), question]));
    const subjectMap = new Map();

    attempts.forEach((attempt) => {
        const answers = Array.isArray(attempt.respuestas) ? attempt.respuestas : [];
        const orderedQuestionIds = Array.isArray(attempt.preguntas) ? attempt.preguntas : [];

        orderedQuestionIds.forEach((questionId, index) => {
            const question = questionMap.get(Number(questionId));
            if (!question || question.tipo !== 'opcion_multiple') return;

            const subject = question.materia || 'Sin materia';
            const current = subjectMap.get(subject) || { subject, total: 0, correct: 0, accuracy: 0 };
            current.total += 1;
            if (answers[index] === question.respuesta_correcta) current.correct += 1;
            current.accuracy = Math.round((current.correct / current.total) * 100);
            subjectMap.set(subject, current);
        });
    });

    return [...subjectMap.values()].sort((a, b) => a.accuracy - b.accuracy || b.total - a.total);
};

const buildRecommendations = (subjectStats, averageAccuracy, settings) => {
    const weakest = subjectStats[0];
    const recommendations = [];

    if (
        weakest
        && weakest.total >= settings.weakSubjectMinQuestions
        && weakest.accuracy < settings.targetAccuracy
    ) {
        recommendations.push(`Refuerza ${weakest.subject}: tu precision actual es ${weakest.accuracy}%.`);
    }
    if (averageAccuracy < settings.lowPerformanceThreshold) {
        recommendations.push('Prioriza simulacros de dificultad facil o media antes de subir el nivel.');
    }
    if (averageAccuracy >= settings.targetAccuracy + 5) {
        recommendations.push('Estas listo para incrementar dificultad y practicar con limite de tiempo mas estricto.');
    }

    if (recommendations.length === 0) {
        recommendations.push('Mantén una rutina breve de simulacros y revisa el solucionario despues de cada intento.');
    }

    return recommendations;
};

const buildUserPerformance = (attempts) => {
    const users = new Map();

    attempts.forEach((attempt) => {
        const userId = String(attempt.id_usuario);
        const total = Number(attempt.total_preguntas || 0);
        if (!userId || total <= 0) return;

        const current = users.get(userId) || {
            userId,
            attempts: 0,
            score: 0,
            accuracy: 0,
        };
        current.attempts += 1;
        current.score += Number(attempt.puntaje || 0);
        current.accuracy += (Number(attempt.correctas || 0) / total) * 100;
        users.set(userId, current);
    });

    return [...users.values()]
        .map((student) => ({
            ...student,
            averageScore: Math.round(student.score / student.attempts),
            averageAccuracy: Math.round(student.accuracy / student.attempts),
        }))
        .sort((a, b) => b.averageAccuracy - a.averageAccuracy || b.averageScore - a.averageScore);
};

class LearningController {
    static async getUniversities(req, res, next) {
        try {
            const universities = await University.findAll({
                where: { activo: true },
                include: [{
                    model: Question,
                    as: 'preguntas',
                    where: { activa: true },
                    required: false,
                    attributes: ['id_pregunta'],
                }],
                order: [['nombre', 'ASC']],
            });

            return res.status(200).json(universities.map((university) => ({
                id: university.slug,
                name: university.nombre,
                logo: university.logo,
                questionCount: university.preguntas?.length || 0,
            })));
        } catch (error) {
            return next(error);
        }
    }

    static async startSimulacro(req, res, next) {
        try {
            const { universityId, difficulty, subject, questionCount = 20 } = req.body;
            const normalizedDifficulty = normalizeDifficulty(difficulty);

            const university = await University.findOne({
                where: { slug: universityId, activo: true },
            });

            if (!university) {
                return res.status(404).json({ success: false, message: 'Universidad no encontrada' });
            }

            const where = {
                id_universidad: university.id_universidad,
                activa: true,
            };
            if (normalizedDifficulty) where.dificultad = normalizedDifficulty;
            if (subject) where.materia = { [Op.iLike]: `%${subject}%` };

            let questions = await Question.findAll({ where, limit: 100 });

            if (questions.length < 5) {
                questions = await Question.findAll({
                    where: {
                        id_universidad: university.id_universidad,
                        activa: true,
                    },
                    limit: 100,
                });
            }

            if (questions.length === 0) {
                return res.status(404).json({ success: false, message: 'No hay preguntas disponibles' });
            }

            const selectedQuestions = shuffle(questions).slice(0, Math.min(Number(questionCount), questions.length));
            const timeLimit = normalizedDifficulty === 'facil' ? 9000 : normalizedDifficulty === 'medio' ? 7200 : 5760;
            const startedAt = new Date();
            const deadline = new Date(startedAt.getTime() + timeLimit * 1000);

            const attempt = await SimulacroAttempt.create({
                id_usuario: req.user.id,
                id_universidad: university.id_universidad,
                dificultad: normalizedDifficulty,
                preguntas: selectedQuestions.map((question) => question.id_pregunta),
                preguntas_snapshot: selectedQuestions.map(createQuestionSnapshot),
                limite_segundos: timeLimit,
                fecha_inicio: startedAt,
                fecha_limite: deadline,
                total_preguntas: selectedQuestions.length,
            });

            return res.status(201).json({
                id: String(attempt.id_intento),
                questions: selectedQuestions.map(toFrontendQuestion),
                timeLimit,
                deadline: deadline.toISOString(),
                config: {
                    universityId,
                    difficulty: normalizedDifficulty,
                },
            });
        } catch (error) {
            return next(error);
        }
    }

    static async submitSimulacro(req, res, next) {
        try {
            const { simulacroId, answers } = req.body;
            const idempotencyKey = String(req.get('Idempotency-Key') || '').trim();
            if (!idempotencyKey || idempotencyKey.length > 128) {
                return res.status(400).json({ success: false, message: 'Se requiere una clave de idempotencia válida' });
            }
            if (!Array.isArray(answers) || answers.length > 200 || answers.some((answer) => (
                answer !== null
                && typeof answer !== 'string'
                && (typeof answer !== 'number' || !Number.isFinite(answer))
            ) || (typeof answer === 'string' && answer.length > 20000))) {
                return res.status(400).json({ success: false, message: 'Respuestas inválidas' });
            }

            const payloadHash = hashSubmission(answers);
            const result = await sequelize.transaction(async (transaction) => {
                const attempt = await SimulacroAttempt.findOne({
                    where: { id_intento: simulacroId, id_usuario: req.user.id },
                    transaction,
                    lock: transaction.LOCK.UPDATE,
                });
                if (!attempt) return { status: 404, body: { success: false, message: 'Simulacro no encontrado' } };

                if (attempt.estado === 'finalizado') {
                    if (attempt.clave_idempotencia === idempotencyKey && attempt.hash_solicitud === payloadHash) {
                        return { status: 200, body: attempt.resultado_confirmado };
                    }
                    return { status: 409, body: { success: false, message: 'El simulacro ya fue enviado con otra solicitud' } };
                }

                const now = new Date();
                const deadline = attempt.fecha_limite || new Date(new Date(attempt.fecha_inicio).getTime() + Number(attempt.limite_segundos) * 1000);
                const expired = now.getTime() > new Date(deadline).getTime();
                const snapshot = Array.isArray(attempt.preguntas_snapshot) && attempt.preguntas_snapshot.length > 0
                    ? attempt.preguntas_snapshot
                    : await Question.findAll({
                        where: { id_pregunta: { [Op.in]: attempt.preguntas } },
                        transaction,
                    }).then((questions) => {
                        const byId = new Map(questions.map((question) => [String(question.id_pregunta), createQuestionSnapshot(question)]));
                        return attempt.preguntas.map((id) => byId.get(String(id))).filter(Boolean);
                    });
                const acceptedAnswers = expired ? [] : answers;
                const scored = scoreSnapshot(snapshot, acceptedAnswers, now);
                const elapsedSeconds = Math.max(0, Math.min(Number(attempt.limite_segundos), Math.floor((now.getTime() - new Date(attempt.fecha_inicio).getTime()) / 1000)));
                scored.timeSpent = elapsedSeconds;
                const event = {
                    eventId: randomUUID(),
                    type: 'ResultadoConfirmado.v1',
                    schemaVersion: 1,
                    producer: 'evaluation',
                    correlationId: randomUUID(),
                    occurredAt: now.toISOString(),
                    data: { attemptId: String(attempt.id_intento), userId: String(req.user.id), resultVersion: 1, status: 'confirmed' },
                };
                const persisted = { ...scored, expired, newAchievements: [], gamification: null };
                const answersForStorage = snapshot.map((_, index) => acceptedAnswers[index] ?? -1);

                await attempt.update({
                    respuestas: answersForStorage,
                    estado: 'finalizado',
                    tiempo_usado: elapsedSeconds,
                    puntaje: scored.score,
                    correctas: scored.correctAnswers,
                    total_preguntas: scored.totalQuestions,
                    fecha_fin: now,
                    clave_idempotencia: idempotencyKey,
                    hash_solicitud: payloadHash,
                    resultado_confirmado: persisted,
                }, { transaction });

                const openReviews = snapshot
                    .map((question, index) => ({ question, answer: acceptedAnswers[index] }))
                    .filter(({ question, answer }) => question.type === 'abierta' && !isBlankAnswer(answer) && answer !== -1)
                    .map(({ question, answer }) => ({
                        id_intento: attempt.id_intento,
                        id_pregunta: Number(question.id),
                        id_estudiante: req.user.id,
                        respuesta_texto: answerToText(answer),
                    }));
                if (openReviews.length > 0) await OpenAnswerReview.bulkCreate(openReviews, { ignoreDuplicates: true, transaction });
                if (!scored.requiresManualReview) {
                    await ExamOutbox.create({
                        event_id: event.eventId,
                        aggregate_id: String(attempt.id_intento),
                        event_type: event.type,
                        payload: event,
                    }, { transaction });
                }
                return { status: 200, body: persisted };
            });

            return res.status(result.status).json(result.body);
        } catch (error) {
            return next(error);
        }
    }

    static async listAchievements(req, res, next) {
        try {
            const achievements = await AchievementService.listUserAchievements(req.user.id);
            return res.status(200).json({ success: true, data: achievements });
        } catch (error) {
            return next(error);
        }
    }

    static async listNotifications(req, res, next) {
        try {
            const notifications = await AchievementService.listNotifications(req.user.id);
            return res.status(200).json({ success: true, data: notifications });
        } catch (error) {
            return next(error);
        }
    }

    static async markNotificationRead(req, res, next) {
        try {
            const notification = await AchievementService.markNotificationRead(req.user.id, req.params.id);
            if (!notification) {
                return res.status(404).json({ success: false, message: 'Notificacion no encontrada' });
            }
            return res.status(200).json({ success: true });
        } catch (error) {
            return next(error);
        }
    }

    static async getMyResults(req, res, next) {
        try {
            const attempts = await SimulacroAttempt.findAll({
                where: { id_usuario: req.user.id },
                include: [{ model: University, as: 'universidad' }],
                order: [['created_at', 'DESC']],
                limit: 20,
            });

            return res.status(200).json({
                success: true,
                data: attempts,
            });
        } catch (error) {
            return next(error);
        }
    }

    static async getLearningAnalytics(req, res, next) {
        try {
            const settings = await getAnalyticsSettings();
            const isTeacherUser = req.user.rol === 'docente';
            const where = { estado: 'finalizado' };
            if (!isTeacherUser) where.id_usuario = req.user.id;

            const attempts = await SimulacroAttempt.findAll({
                where,
                include: [{ model: University, as: 'universidad' }],
                order: [['fecha_fin', 'DESC']],
                limit: isTeacherUser ? settings.cohortHistoryLimit : settings.studentHistoryLimit,
            });
            const cohortAttempts = isTeacherUser
                ? attempts
                : await SimulacroAttempt.findAll({
                    where: { estado: 'finalizado' },
                    order: [['fecha_fin', 'DESC']],
                    limit: settings.cohortHistoryLimit,
                });

            const completed = attempts.filter((attempt) => Number(attempt.total_preguntas || 0) > 0);
            const cohortCompleted = cohortAttempts.filter((attempt) => Number(attempt.total_preguntas || 0) > 0);
            const attemptsCount = completed.length;
            const totalScore = completed.reduce((sum, attempt) => sum + Number(attempt.puntaje || 0), 0);
            const totalAccuracy = completed.reduce((sum, attempt) => {
                const total = Number(attempt.total_preguntas || 0);
                return sum + (total > 0 ? (Number(attempt.correctas || 0) / total) * 100 : 0);
            }, 0);
            const averageScore = attemptsCount ? Math.round(totalScore / attemptsCount) : 0;
            const averageAccuracy = attemptsCount ? Math.round(totalAccuracy / attemptsCount) : 0;
            const bestScore = completed.reduce((best, attempt) => Math.max(best, Number(attempt.puntaje || 0)), 0);
            const totalStudyHours = Math.round((completed.reduce((sum, attempt) => sum + Number(attempt.tiempo_usado || 0), 0) / 3600) * 10) / 10;
            const subjectStats = await buildSubjectStats(completed);
            const latest = completed[0] || null;
            const cohortPerformance = buildUserPerformance(cohortCompleted);
            const cohortAverageAccuracy = cohortPerformance.length
                ? Math.round(cohortPerformance.reduce((sum, student) => sum + student.averageAccuracy, 0) / cohortPerformance.length)
                : 0;
            const lowPerformanceAlerts = cohortPerformance
                .filter((student) => (
                    student.attempts >= settings.minAttemptsForAlert
                    && student.averageAccuracy < settings.lowPerformanceThreshold
                ))
                .slice(0, 5)
                .map((student) => ({
                    userId: student.userId,
                    averageAccuracy: student.averageAccuracy,
                    attempts: student.attempts,
                    severity: student.averageAccuracy < settings.criticalPerformanceThreshold ? 'alta' : 'media',
                }));
            const performanceDistribution = {
                low: cohortPerformance.filter((student) => student.averageAccuracy < settings.lowPerformanceThreshold).length,
                medium: cohortPerformance.filter((student) => (
                    student.averageAccuracy >= settings.lowPerformanceThreshold
                    && student.averageAccuracy < settings.targetAccuracy
                )).length,
                high: cohortPerformance.filter((student) => student.averageAccuracy >= settings.targetAccuracy).length,
            };
            const studentRankIndex = cohortPerformance.findIndex((student) => student.userId === String(req.user.id));
            const cohortPercentile = !isTeacherUser && studentRankIndex >= 0 && cohortPerformance.length > 1
                ? Math.round(((cohortPerformance.length - studentRankIndex) / cohortPerformance.length) * 100)
                : null;

            const lastThree = completed.slice(0, 3);
            const previousThree = completed.slice(3, 6);
            const lastAverage = lastThree.length
                ? lastThree.reduce((sum, attempt) => sum + Number(attempt.puntaje || 0), 0) / lastThree.length
                : 0;
            const previousAverage = previousThree.length
                ? previousThree.reduce((sum, attempt) => sum + Number(attempt.puntaje || 0), 0) / previousThree.length
                : 0;
            const improvement = previousThree.length ? Math.round(lastAverage - previousAverage) : 0;

            const payload = {
                role: isTeacherUser ? 'docente' : 'estudiante',
                attemptsCount,
                averageScore,
                averageAccuracy,
                bestScore,
                totalStudyHours,
                improvement,
                latestAttemptAt: latest?.fecha_fin || null,
                weakSubjects: subjectStats.slice(0, 5),
                recommendations: buildRecommendations(subjectStats, averageAccuracy, settings),
                cohortAverageAccuracy,
                performanceDistribution,
                lowPerformanceAlerts,
                settings,
            };

            if (!isTeacherUser) {
                payload.cohortPercentile = cohortPercentile;
                payload.cohortGap = cohortAverageAccuracy ? averageAccuracy - cohortAverageAccuracy : 0;
            }

            if (isTeacherUser) {
                payload.studentsWithAttempts = new Set(completed.map((attempt) => attempt.id_usuario)).size;
                payload.pendingOpenReviews = await OpenAnswerReview.count({ where: { estado: 'pendiente' } });
            }

            return res.status(200).json({ success: true, data: payload });
        } catch (error) {
            return next(error);
        }
    }

    static async getAnalyticsSettings(req, res, next) {
        try {
            const settings = await getAnalyticsSettings();
            return res.status(200).json({ success: true, data: settings });
        } catch (error) {
            return next(error);
        }
    }

    static async updateAnalyticsSettings(req, res, next) {
        try {
            const current = await getAnalyticsSettings();
            const nextSettings = {
                lowPerformanceThreshold: clampInteger(
                    req.body.lowPerformanceThreshold,
                    1,
                    100,
                    current.lowPerformanceThreshold || DEFAULT_ANALYTICS_SETTINGS.lowPerformanceThreshold
                ),
                criticalPerformanceThreshold: clampInteger(
                    req.body.criticalPerformanceThreshold,
                    1,
                    100,
                    current.criticalPerformanceThreshold || DEFAULT_ANALYTICS_SETTINGS.criticalPerformanceThreshold
                ),
                minAttemptsForAlert: clampInteger(
                    req.body.minAttemptsForAlert,
                    1,
                    20,
                    current.minAttemptsForAlert || DEFAULT_ANALYTICS_SETTINGS.minAttemptsForAlert
                ),
                weakSubjectMinQuestions: clampInteger(
                    req.body.weakSubjectMinQuestions,
                    1,
                    50,
                    current.weakSubjectMinQuestions || DEFAULT_ANALYTICS_SETTINGS.weakSubjectMinQuestions
                ),
                targetAccuracy: clampInteger(
                    req.body.targetAccuracy,
                    1,
                    100,
                    current.targetAccuracy || DEFAULT_ANALYTICS_SETTINGS.targetAccuracy
                ),
                studentHistoryLimit: clampInteger(
                    req.body.studentHistoryLimit,
                    10,
                    1000,
                    current.studentHistoryLimit || DEFAULT_ANALYTICS_SETTINGS.studentHistoryLimit
                ),
                cohortHistoryLimit: clampInteger(
                    req.body.cohortHistoryLimit,
                    10,
                    2000,
                    current.cohortHistoryLimit || DEFAULT_ANALYTICS_SETTINGS.cohortHistoryLimit
                ),
            };

            if (nextSettings.criticalPerformanceThreshold > nextSettings.lowPerformanceThreshold) {
                nextSettings.criticalPerformanceThreshold = nextSettings.lowPerformanceThreshold;
            }
            if (nextSettings.lowPerformanceThreshold > nextSettings.targetAccuracy) {
                nextSettings.lowPerformanceThreshold = nextSettings.targetAccuracy;
            }

            const [settings] = await AnalyticsSetting.findOrCreate({
                where: { id_configuracion: 1 },
                defaults: { id_configuracion: 1 },
            });

            await settings.update({
                umbral_bajo_rendimiento: nextSettings.lowPerformanceThreshold,
                umbral_critico_rendimiento: nextSettings.criticalPerformanceThreshold,
                intentos_minimos_alerta: nextSettings.minAttemptsForAlert,
                preguntas_minimas_materia_debil: nextSettings.weakSubjectMinQuestions,
                precision_objetivo: nextSettings.targetAccuracy,
                limite_historial_estudiante: nextSettings.studentHistoryLimit,
                limite_historial_cohorte: nextSettings.cohortHistoryLimit,
            });

            return res.status(200).json({
                success: true,
                data: toFrontendAnalyticsSettings(settings),
            });
        } catch (error) {
            return next(error);
        }
    }

    static async listQuestions(req, res, next) {
        try {
            const { search, materia, dificultad, universidad } = req.query;
            const where = { activa: true };

            if (materia) where.materia = { [Op.iLike]: `%${materia}%` };
            if (dificultad) where.dificultad = normalizeDifficulty(dificultad);
            if (search) {
                where[Op.or] = [
                    { enunciado: { [Op.iLike]: `%${search}%` } },
                    { tema: { [Op.iLike]: `%${search}%` } },
                ];
            }

            const include = [{ model: University, as: 'universidad' }];
            if (universidad) {
                include[0].where = { slug: universidad };
            }

            const questions = await Question.findAll({
                where,
                include,
                order: [['created_at', 'DESC']],
                limit: 100,
            });

            return res.status(200).json({ success: true, data: questions });
        } catch (error) {
            return next(error);
        }
    }

    static async createQuestion(req, res, next) {
        try {
            const {
                universityId,
                materia,
                tema,
                dificultad = 'medio',
                tipo = 'opcion_multiple',
                enunciado,
                opciones = [],
                respuesta_correcta,
                respuesta_texto,
                explicacion,
                etiquetas = [],
            } = req.body;

            if (!materia || !enunciado) {
                return res.status(400).json({ success: false, message: 'Materia y enunciado son requeridos' });
            }

            let university = null;
            if (universityId) {
                university = await University.findOne({ where: { slug: universityId } });
            }

            const question = await Question.create({
                id_universidad: university?.id_universidad || null,
                materia,
                tema,
                dificultad: normalizeDifficulty(dificultad),
                tipo,
                enunciado,
                opciones,
                respuesta_correcta,
                respuesta_texto,
                explicacion,
                etiquetas,
                id_creador: req.user.id,
            });

            return res.status(201).json({ success: true, data: question });
        } catch (error) {
            return next(error);
        }
    }

    static async importQuestions(req, res, next) {
        try {
            const { questions } = req.body;

            if (!Array.isArray(questions) || questions.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Debes enviar una lista de preguntas',
                });
            }

            const created = [];
            for (const item of questions.slice(0, 200)) {
                if (!item.materia || !item.enunciado) continue;

                let university = null;
                if (item.universityId) {
                    university = await University.findOne({ where: { slug: item.universityId } });
                }

                const question = await Question.create({
                    id_universidad: university?.id_universidad || null,
                    materia: item.materia,
                    tema: item.tema || null,
                    dificultad: normalizeDifficulty(item.dificultad),
                    tipo: item.tipo || 'opcion_multiple',
                    enunciado: item.enunciado,
                    opciones: Array.isArray(item.opciones) ? item.opciones : [],
                    respuesta_correcta: item.respuesta_correcta ?? null,
                    respuesta_texto: item.respuesta_texto || null,
                    explicacion: item.explicacion || null,
                    etiquetas: Array.isArray(item.etiquetas) ? item.etiquetas : [],
                    id_creador: req.user.id,
                });
                created.push(question);
            }

            return res.status(201).json({
                success: true,
                message: `${created.length} preguntas importadas`,
                data: created,
            });
        } catch (error) {
            return next(error);
        }
    }

    static async exportQuestions(req, res, next) {
        try {
            const questions = await Question.findAll({
                where: { activa: true },
                include: [{ model: University, as: 'universidad' }],
                order: [['created_at', 'DESC']],
            });

            const data = questions.map((question) => ({
                universityId: question.universidad?.slug || null,
                materia: question.materia,
                tema: question.tema,
                dificultad: question.dificultad,
                tipo: question.tipo,
                enunciado: question.enunciado,
                opciones: question.opciones,
                respuesta_correcta: question.respuesta_correcta,
                respuesta_texto: question.respuesta_texto,
                explicacion: question.explicacion,
                etiquetas: question.etiquetas,
            }));

            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Content-Disposition', 'attachment; filename="banco-preguntas-pae.json"');
            return res.status(200).json(data);
        } catch (error) {
            return next(error);
        }
    }

    static async listOpenAnswerReviews(req, res, next) {
        try {
            const { estado = 'pendiente' } = req.query;
            const where = {};
            if (estado !== 'all') where.estado = estado;

            const reviews = await OpenAnswerReview.findAll({
                where,
                include: [
                    {
                        model: SimulacroAttempt,
                        as: 'intento',
                        include: [{ model: University, as: 'universidad' }],
                    },
                    { model: Question, as: 'pregunta' },
                ],
                order: [
                    ['estado', 'ASC'],
                    ['created_at', 'DESC'],
                ],
                limit: 100,
            });

            return res.status(200).json({
                success: true,
                data: reviews.map((review) => ({
                    id_revision: review.id_revision,
                    id_intento: review.id_intento,
                    id_pregunta: review.id_pregunta,
                    id_estudiante: review.id_estudiante,
                    id_docente: review.id_docente,
                    respuesta_texto: review.respuesta_texto,
                    puntaje: review.puntaje,
                    feedback: review.feedback,
                    estado: review.estado,
                    fecha_revision: review.fecha_revision,
                    created_at: review.created_at,
                    intento: {
                        id_intento: review.intento?.id_intento,
                        dificultad: review.intento?.dificultad,
                        puntaje: review.intento?.puntaje,
                        correctas: review.intento?.correctas,
                        total_preguntas: review.intento?.total_preguntas,
                        fecha_fin: review.intento?.fecha_fin,
                        universidad: review.intento?.universidad?.nombre || null,
                    },
                    pregunta: {
                        id_pregunta: review.pregunta?.id_pregunta,
                        materia: review.pregunta?.materia,
                        tema: review.pregunta?.tema,
                        dificultad: review.pregunta?.dificultad,
                        enunciado: review.pregunta?.enunciado,
                        respuesta_texto: review.pregunta?.respuesta_texto,
                        explicacion: review.pregunta?.explicacion,
                    },
                })),
            });
        } catch (error) {
            return next(error);
        }
    }

    static async reviewOpenAnswer(req, res, next) {
        try {
            const { attemptId, questionId } = req.params;
            const puntaje = Number(req.body.puntaje);
            const feedback = req.body.feedback || null;

            if (!Number.isFinite(puntaje) || puntaje < 0 || puntaje > 5) {
                return res.status(400).json({
                    success: false,
                    message: 'El puntaje debe estar entre 0 y 5',
                });
            }

            const result = await sequelize.transaction(async (transaction) => {
                const attempt = await SimulacroAttempt.findByPk(attemptId, {
                    transaction,
                    lock: transaction.LOCK.UPDATE,
                });
                if (!attempt) return { status: 404, body: { success: false, message: 'Intento no encontrado' } };
                if (attempt.estado !== 'finalizado') return { status: 409, body: { success: false, message: 'El intento aún no fue finalizado' } };

                const review = await OpenAnswerReview.findOne({
                    where: { id_intento: attemptId, id_pregunta: questionId },
                    transaction,
                    lock: transaction.LOCK.UPDATE,
                });
                if (!review) return { status: 404, body: { success: false, message: 'Revision no encontrada' } };
                if (review.estado !== 'pendiente') {
                    return { status: 409, body: { success: false, message: 'La respuesta ya fue revisada; una recalificación requiere contrato de versión' } };
                }

                const reviewedAt = new Date();
                const roundedScore = Math.round(puntaje);
                await review.update({
                    puntaje: roundedScore,
                    feedback,
                    estado: 'revisado',
                    id_docente: req.user.id,
                    fecha_revision: reviewedAt,
                    version: 1,
                }, { transaction });
                await OpenAnswerReviewAudit.create({
                    id_revision: review.id_revision,
                    version: 1,
                    id_revisor: req.user.id,
                    puntaje: roundedScore,
                    feedback,
                    fecha: reviewedAt,
                }, { transaction });

                const snapshot = Array.isArray(attempt.preguntas_snapshot) ? attempt.preguntas_snapshot : [];
                let ordered = snapshot;
                if (ordered.length === 0) {
                    const questions = await Question.findAll({
                        where: { id_pregunta: { [Op.in]: attempt.preguntas } },
                        transaction,
                    });
                    const byId = new Map(questions.map((question) => [String(question.id_pregunta), createQuestionSnapshot(question)]));
                    ordered = attempt.preguntas.map((id) => byId.get(String(id))).filter(Boolean);
                }
                const answers = Array.isArray(attempt.respuestas) ? attempt.respuestas : [];
                const allReviews = await OpenAnswerReview.findAll({ where: { id_intento: attemptId }, transaction });
                const graded = scoreReviewedAttempt(ordered, answers, allReviews);
                const finalScore = graded.score;
                const pendingCount = graded.pendingManualReviews;
                const confirmed = graded.status === 'confirmed';
                const correctAnswers = graded.correctAnswers;
                const priorResult = attempt.resultado_confirmado || {};
                const resultVersion = confirmed ? 1 : null;
                const confirmedAt = confirmed ? reviewedAt.toISOString() : null;
                const resultSnapshot = {
                    ...priorResult,
                    score: finalScore,
                    totalQuestions: ordered.length,
                    correctAnswers,
                    pendingManualReviews: pendingCount,
                    requiresManualReview: pendingCount > 0,
                    status: confirmed ? 'confirmed' : 'pending_review',
                    resultVersion,
                    confirmedAt,
                };
                await attempt.update({
                    puntaje: finalScore,
                    correctas: correctAnswers,
                    resultado_confirmado: resultSnapshot,
                }, { transaction });

                if (confirmed) {
                    const event = {
                        eventId: randomUUID(),
                        type: 'ResultadoConfirmado.v1',
                        schemaVersion: 1,
                        producer: 'evaluation',
                        correlationId: randomUUID(),
                        occurredAt: reviewedAt.toISOString(),
                        data: { attemptId: String(attempt.id_intento), userId: String(attempt.id_usuario), resultVersion: 1, status: 'confirmed' },
                    };
                    await ExamOutbox.create({
                        event_id: event.eventId,
                        aggregate_id: String(attempt.id_intento),
                        event_type: event.type,
                        payload: event,
                    }, { transaction });
                }

                return {
                    status: 200,
                    body: {
                        success: true,
                        data: {
                            review,
                            intento: {
                                id_intento: attempt.id_intento,
                                puntaje: finalScore,
                                correctas: correctAnswers,
                                total_preguntas: ordered.length,
                                estado_resultado: resultSnapshot.status,
                                resultVersion,
                            },
                        },
                    },
                };
            });
            return res.status(result.status).json(result.body);
        } catch (error) {
            return next(error);
        }
    }

    static async saveQuestion(req, res, next) {
        try {
            const [saved] = await SavedQuestion.findOrCreate({
                where: { id_usuario: req.user.id, id_pregunta: req.params.id },
                defaults: { id_usuario: req.user.id, id_pregunta: req.params.id },
            });

            return res.status(200).json({ success: true, data: saved });
        } catch (error) {
            return next(error);
        }
    }

    static async listSavedQuestions(req, res, next) {
        try {
            const savedQuestions = await SavedQuestion.findAll({
                where: { id_usuario: req.user.id },
                include: [{
                    model: Question,
                    as: 'pregunta',
                    where: { activa: true },
                    include: [{ model: University, as: 'universidad' }],
                }],
                order: [['createdAt', 'DESC']],
            });

            return res.status(200).json({
                success: true,
                data: savedQuestions.map((saved) => ({
                    id_guardado: saved.id_guardado,
                    id_usuario: saved.id_usuario,
                    id_pregunta: saved.id_pregunta,
                    created_at: saved.created_at || saved.createdAt,
                    pregunta: saved.pregunta,
                })),
            });
        } catch (error) {
            return next(error);
        }
    }

    static async deleteSavedQuestion(req, res, next) {
        try {
            const deleted = await SavedQuestion.destroy({
                where: { id_usuario: req.user.id, id_pregunta: req.params.id },
            });

            if (!deleted) {
                return res.status(404).json({
                    success: false,
                    message: 'Pregunta guardada no encontrada',
                });
            }

            return res.status(200).json({ success: true });
        } catch (error) {
            return next(error);
        }
    }

    static async listChallengeRooms(req, res, next) {
        try {
            const rooms = await ChallengeRoom.findAll({
                where: { estado: { [Op.in]: ['waiting', 'playing'] } },
                order: [['created_at', 'DESC']],
                limit: 50,
            });

            return res.status(200).json(rooms.map(toFrontendRoom));
        } catch (error) {
            return next(error);
        }
    }

    static async createChallengeRoom(req, res, next) {
        try {
            const { topic, difficulty = 'medio', maxPlayers = 4 } = req.body;
            const normalizedTopic = String(topic || '').trim();
            const normalizedMaxPlayers = Math.min(8, Math.max(2, Number(maxPlayers) || 4));

            if (!normalizedTopic) {
                return res.status(400).json({ success: false, message: 'Tema requerido' });
            }

            const participant = {
                id: String(req.user.id),
                name: userDisplayName(req.user),
                joinedAt: new Date().toISOString(),
            };

            const room = await ChallengeRoom.create({
                id_anfitrion: req.user.id,
                anfitrion_nombre: participant.name,
                tema: normalizedTopic,
                dificultad: normalizeDifficulty(difficulty),
                max_jugadores: normalizedMaxPlayers,
                participantes: [participant],
                estado: 'waiting',
            });

            const payload = toFrontendRoom(room);
            emitChallengeRoomsUpdated({ action: 'created', room: payload });
            return res.status(201).json(payload);
        } catch (error) {
            return next(error);
        }
    }

    static async joinChallengeRoom(req, res, next) {
        try {
            const room = await ChallengeRoom.findByPk(req.params.id);
            if (!room) {
                return res.status(404).json({ success: false, message: 'Sala no encontrada' });
            }

            if (room.estado !== 'waiting') {
                return res.status(409).json({ success: false, message: 'La sala ya no acepta jugadores' });
            }

            const participants = Array.isArray(room.participantes) ? [...room.participantes] : [];
            const participantId = String(req.user.id);
            const exists = participants.some((participant) => String(participant.id) === participantId);

            if (!exists) {
                if (participants.length >= room.max_jugadores) {
                    return res.status(409).json({ success: false, message: 'La sala esta llena' });
                }

                participants.push({
                    id: participantId,
                    name: userDisplayName(req.user),
                    joinedAt: new Date().toISOString(),
                });
            }

            const nextStatus = participants.length >= room.max_jugadores ? 'playing' : 'waiting';
            await room.update({
                participantes: participants,
                estado: nextStatus,
                inicia_en: nextStatus === 'playing' ? new Date() : room.inicia_en,
            });

            const payload = toFrontendRoom(room);
            emitChallengeRoomUpdated(room.id_sala, { action: 'joined', room: payload });
            return res.status(200).json(payload);
        } catch (error) {
            return next(error);
        }
    }

    static async leaveChallengeRoom(req, res, next) {
        try {
            const room = await ChallengeRoom.findByPk(req.params.id);
            if (!room) {
                return res.status(404).json({ success: false, message: 'Sala no encontrada' });
            }

            const participantId = String(req.user.id);
            const participants = (Array.isArray(room.participantes) ? room.participantes : [])
                .filter((participant) => String(participant.id) !== participantId);
            const nextStatus = participants.length === 0 ? 'finished' : 'waiting';

            await room.update({
                participantes: participants,
                estado: nextStatus,
                finaliza_en: nextStatus === 'finished' ? new Date() : room.finaliza_en,
            });

            const payload = toFrontendRoom(room);
            emitChallengeRoomUpdated(room.id_sala, { action: 'left', room: payload });
            return res.status(200).json(payload);
        } catch (error) {
            return next(error);
        }
    }

    static async startChallengeMatch(req, res, next) {
        try {
            const room = await ChallengeRoom.findByPk(req.params.id);
            if (!room) {
                return res.status(404).json({ success: false, message: 'Sala no encontrada' });
            }

            if (!userIsParticipant(room, req.user.id)) {
                return res.status(403).json({ success: false, message: 'Debes unirte a la sala antes de iniciar' });
            }

            const existingMatch = await ChallengeMatch.findOne({
                where: { id_sala: room.id_sala, estado: 'playing' },
                order: [['created_at', 'DESC']],
            });

            if (existingMatch) {
                const questions = await Question.findAll({
                    where: { id_pregunta: { [Op.in]: existingMatch.preguntas } },
                });
                return res.status(200).json(toFrontendMatch(room, existingMatch, questions));
            }

            const questionCount = Math.min(10, Math.max(3, Number(req.body.questionCount) || 5));
            const topic = room.tema;
            const baseWhere = {
                activa: true,
                tipo: 'opcion_multiple',
                dificultad: room.dificultad,
                [Op.or]: [
                    { materia: { [Op.iLike]: `%${topic}%` } },
                    { tema: { [Op.iLike]: `%${topic}%` } },
                    { enunciado: { [Op.iLike]: `%${topic}%` } },
                ],
            };

            let questions = await Question.findAll({ where: baseWhere, limit: 80 });
            if (questions.length < questionCount) {
                questions = await Question.findAll({
                    where: {
                        activa: true,
                        tipo: 'opcion_multiple',
                        dificultad: room.dificultad,
                    },
                    limit: 80,
                });
            }
            if (questions.length < questionCount) {
                questions = await Question.findAll({
                    where: { activa: true, tipo: 'opcion_multiple' },
                    limit: 80,
                });
            }

            if (questions.length === 0) {
                return res.status(404).json({ success: false, message: 'No hay preguntas de opcion multiple disponibles' });
            }

            const selectedQuestions = shuffle(questions).slice(0, Math.min(questionCount, questions.length));
            const now = new Date();
            const match = await ChallengeMatch.create({
                id_sala: room.id_sala,
                preguntas: selectedQuestions.map((question) => question.id_pregunta),
                pregunta_actual: 0,
                respuestas: [],
                marcador: buildInitialScoreboard(room),
                estado: 'playing',
                tiempo_por_pregunta: Math.min(60, Math.max(15, Number(req.body.timePerQuestion) || 30)),
                pregunta_inicia_en: now,
                inicia_en: now,
            });

            await room.update({ estado: 'playing', inicia_en: room.inicia_en || now });
            const payload = toFrontendMatch(room, match, selectedQuestions);
            emitChallengeRoomUpdated(room.id_sala, { action: 'started', room: toFrontendRoom(room) });
            emitChallengeGameUpdated(room.id_sala, { action: 'started', game: payload });
            return res.status(201).json(payload);
        } catch (error) {
            return next(error);
        }
    }

    static async getChallengeMatch(req, res, next) {
        try {
            const room = await ChallengeRoom.findByPk(req.params.id);
            if (!room) {
                return res.status(404).json({ success: false, message: 'Sala no encontrada' });
            }

            const match = await ChallengeMatch.findOne({
                where: { id_sala: room.id_sala },
                order: [['created_at', 'DESC']],
            });

            if (!match) {
                return res.status(404).json({ success: false, message: 'Partida no encontrada' });
            }

            const questions = await Question.findAll({
                where: { id_pregunta: { [Op.in]: match.preguntas } },
            });

            return res.status(200).json(toFrontendMatch(room, match, questions));
        } catch (error) {
            return next(error);
        }
    }

    static async answerChallengeQuestion(req, res, next) {
        try {
            const room = await ChallengeRoom.findByPk(req.params.id);
            if (!room) {
                return res.status(404).json({ success: false, message: 'Sala no encontrada' });
            }

            if (!userIsParticipant(room, req.user.id)) {
                return res.status(403).json({ success: false, message: 'No perteneces a esta sala' });
            }

            const match = await ChallengeMatch.findOne({
                where: { id_sala: room.id_sala, estado: 'playing' },
                order: [['created_at', 'DESC']],
            });

            if (!match) {
                return res.status(404).json({ success: false, message: 'No hay partida activa' });
            }

            const questionIds = Array.isArray(match.preguntas) ? match.preguntas : [];
            const currentQuestionId = questionIds[match.pregunta_actual];
            if (String(req.body.questionId) !== String(currentQuestionId)) {
                return res.status(409).json({ success: false, message: 'La pregunta enviada no es la pregunta activa' });
            }

            const answers = Array.isArray(match.respuestas) ? [...match.respuestas] : [];
            const userId = String(req.user.id);
            const alreadyAnswered = hasAlreadyAnswered({ answers, userId, currentQuestionId });
            if (alreadyAnswered) {
                return res.status(409).json({ success: false, message: 'Ya respondiste esta pregunta' });
            }

            const question = await Question.findByPk(currentQuestionId);
            if (!question) {
                return res.status(404).json({ success: false, message: 'Pregunta no encontrada' });
            }

            const now = new Date();
            const startedAt = match.pregunta_inicia_en ? new Date(match.pregunta_inicia_en) : now;
            const responseMs = Math.max(0, now.getTime() - startedAt.getTime());
            const selectedAnswer = Number(req.body.answer);
            const isCorrect = selectedAnswer === question.respuesta_correcta;
            const points = speedScore(isCorrect, responseMs);
            const answerPayload = {
                questionId: String(currentQuestionId),
                userId,
                userName: userDisplayName(req.user),
                answer: selectedAnswer,
                correct: isCorrect,
                points,
                responseMs,
                matchId: String(match.id_partida),
                answeredAt: now.toISOString(),
            };
            answers.push(answerPayload);

            const scoreboard = (Array.isArray(match.marcador) ? [...match.marcador] : buildInitialScoreboard(room))
                .map((row) => {
                    if (String(row.id) !== userId) return row;
                    return {
                        ...row,
                        score: Number(row.score || 0) + points,
                        correctAnswers: Number(row.correctAnswers || 0) + (isCorrect ? 1 : 0),
                        answered: Number(row.answered || 0) + 1,
                    };
                });

            const participants = Array.isArray(room.participantes) ? room.participantes : [];
            const answersForCurrent = answers.filter((answer) => String(answer.questionId) === String(currentQuestionId));
            const allAnswered = participants.length > 0 && participants.every((participant) => (
                answersForCurrent.some((answer) => String(answer.userId) === String(participant.id))
            ));
            const isLastQuestion = match.pregunta_actual >= questionIds.length - 1;

            const update = {
                respuestas: answers,
                marcador: scoreboard,
            };
            if (allAnswered && isLastQuestion) {
                update.estado = 'finished';
                update.finaliza_en = now;
            } else if (allAnswered) {
                update.pregunta_actual = match.pregunta_actual + 1;
                update.pregunta_inicia_en = now;
            }

            await match.update(update);
            if (update.estado === 'finished') {
                await room.update({ estado: 'finished', finaliza_en: now });
            }

            const questions = await Question.findAll({
                where: { id_pregunta: { [Op.in]: match.preguntas } },
            });
            const gamification = await GamificationService.awardLiveAnswer(req.user, answerPayload, 'challenge');
            const payload = toFrontendMatch(room, match, questions);
            emitChallengeGameUpdated(room.id_sala, { action: update.estado === 'finished' ? 'finished' : 'answered', game: payload, answer: answerPayload });
            if (update.estado === 'finished') {
                emitChallengeRoomUpdated(room.id_sala, { action: 'finished', room: toFrontendRoom(room) });
            }

            return res.status(200).json({
                ...payload,
                lastAnswer: answerPayload,
                gamification,
            });
        } catch (error) {
            return next(error);
        }
    }

    static async nextChallengeQuestion(req, res, next) {
        try {
            const room = await ChallengeRoom.findByPk(req.params.id);
            if (!room) {
                return res.status(404).json({ success: false, message: 'Sala no encontrada' });
            }

            if (String(room.id_anfitrion) !== String(req.user.id)) {
                return res.status(403).json({ success: false, message: 'Solo el anfitrion puede avanzar manualmente' });
            }

            const match = await ChallengeMatch.findOne({
                where: { id_sala: room.id_sala, estado: 'playing' },
                order: [['created_at', 'DESC']],
            });
            if (!match) {
                return res.status(404).json({ success: false, message: 'No hay partida activa' });
            }

            const now = new Date();
            const questionIds = Array.isArray(match.preguntas) ? match.preguntas : [];
            if (match.pregunta_actual >= questionIds.length - 1) {
                await match.update({ estado: 'finished', finaliza_en: now });
                await room.update({ estado: 'finished', finaliza_en: now });
            } else {
                await match.update({
                    pregunta_actual: match.pregunta_actual + 1,
                    pregunta_inicia_en: now,
                });
            }

            const questions = await Question.findAll({
                where: { id_pregunta: { [Op.in]: match.preguntas } },
            });
            const payload = toFrontendMatch(room, match, questions);
            emitChallengeGameUpdated(room.id_sala, { action: match.estado === 'finished' ? 'finished' : 'next', game: payload });
            return res.status(200).json(payload);
        } catch (error) {
            return next(error);
        }
    }

    static async getDailyTrivia(req, res, next) {
        try {
            req.body = { universityId: 'unmsm', difficulty: 'facil', questionCount: 5 };
            return LearningController.startSimulacro(req, {
                status: () => ({
                    json: (payload) => res.json(payload.questions.map((question) => ({
                        id: question.id,
                        question: question.question,
                        options: question.options,
                        correctAnswer: question.correctAnswer,
                        category: question.subject,
                        points: 10,
                    }))),
                }),
            }, next);
        } catch (error) {
            return next(error);
        }
    }

    static async listTriviaRooms(req, res, next) {
        try {
            const rooms = await TriviaRoom.findAll({
                where: { estado: { [Op.in]: ['waiting', 'playing'] } },
                order: [['created_at', 'DESC']],
                limit: 50,
            });

            return res.status(200).json(rooms.map(toFrontendTriviaRoom));
        } catch (error) {
            return next(error);
        }
    }

    static async createTriviaRoom(req, res, next) {
        try {
            const { topic, questionsCount = 5, maxPlayers = 4 } = req.body;
            const normalizedTopic = String(topic || '').trim();
            const normalizedQuestionsCount = Math.min(15, Math.max(3, Number(questionsCount) || 5));
            const normalizedMaxPlayers = Math.min(8, Math.max(2, Number(maxPlayers) || 4));

            if (!normalizedTopic) {
                return res.status(400).json({ success: false, message: 'Tema requerido' });
            }

            const participant = {
                id: String(req.user.id),
                name: userDisplayName(req.user),
                joinedAt: new Date().toISOString(),
            };

            const room = await TriviaRoom.create({
                id_anfitrion: req.user.id,
                anfitrion_nombre: participant.name,
                tema: normalizedTopic,
                preguntas_count: normalizedQuestionsCount,
                max_jugadores: normalizedMaxPlayers,
                participantes: [participant],
                estado: 'waiting',
            });

            const payload = toFrontendTriviaRoom(room);
            emitTriviaRoomsUpdated({ action: 'created', room: payload });
            return res.status(201).json(payload);
        } catch (error) {
            return next(error);
        }
    }

    static async joinTriviaRoom(req, res, next) {
        try {
            const room = await TriviaRoom.findByPk(req.params.id);
            if (!room) {
                return res.status(404).json({ success: false, message: 'Sala no encontrada' });
            }

            if (room.estado !== 'waiting') {
                return res.status(409).json({ success: false, message: 'La sala ya no acepta jugadores' });
            }

            const participants = Array.isArray(room.participantes) ? [...room.participantes] : [];
            const participantId = String(req.user.id);
            const exists = participants.some((participant) => String(participant.id) === participantId);

            if (!exists) {
                if (participants.length >= room.max_jugadores) {
                    return res.status(409).json({ success: false, message: 'La sala esta llena' });
                }

                participants.push({
                    id: participantId,
                    name: userDisplayName(req.user),
                    joinedAt: new Date().toISOString(),
                });
            }

            await room.update({ participantes: participants });

            const payload = toFrontendTriviaRoom(room);
            emitTriviaRoomUpdated(room.id_sala, { action: 'joined', room: payload });
            return res.status(200).json(payload);
        } catch (error) {
            return next(error);
        }
    }

    static async startTriviaMatch(req, res, next) {
        try {
            const room = await TriviaRoom.findByPk(req.params.id);
            if (!room) {
                return res.status(404).json({ success: false, message: 'Sala no encontrada' });
            }

            if (!userIsParticipant(room, req.user.id)) {
                return res.status(403).json({ success: false, message: 'Debes unirte a la sala antes de iniciar' });
            }

            const existingMatch = await TriviaMatch.findOne({
                where: { id_sala: room.id_sala, estado: 'playing' },
                order: [['created_at', 'DESC']],
            });

            if (existingMatch) {
                const questions = await Question.findAll({
                    where: { id_pregunta: { [Op.in]: existingMatch.preguntas } },
                });
                return res.status(200).json(toFrontendTriviaMatch(room, existingMatch, questions));
            }

            const questionCount = Math.min(15, Math.max(3, Number(req.body.questionCount) || room.preguntas_count || 5));
            const topic = room.tema;
            const topicWhere = {
                activa: true,
                tipo: 'opcion_multiple',
                [Op.or]: [
                    { materia: { [Op.iLike]: `%${topic}%` } },
                    { tema: { [Op.iLike]: `%${topic}%` } },
                    { enunciado: { [Op.iLike]: `%${topic}%` } },
                ],
            };

            let questions = await Question.findAll({ where: topicWhere, limit: 100 });
            if (questions.length < questionCount) {
                questions = await Question.findAll({
                    where: { activa: true, tipo: 'opcion_multiple' },
                    limit: 100,
                });
            }

            if (questions.length === 0) {
                return res.status(404).json({ success: false, message: 'No hay preguntas de opcion multiple disponibles' });
            }

            const selectedQuestions = shuffle(questions).slice(0, Math.min(questionCount, questions.length));
            const now = new Date();
            const match = await TriviaMatch.create({
                id_sala: room.id_sala,
                preguntas: selectedQuestions.map((question) => question.id_pregunta),
                pregunta_actual: 0,
                respuestas: [],
                marcador: buildInitialScoreboard(room),
                estado: 'playing',
                tiempo_por_pregunta: Math.min(45, Math.max(10, Number(req.body.timePerQuestion) || 30)),
                pregunta_inicia_en: now,
                inicia_en: now,
            });

            await room.update({ estado: 'playing', inicia_en: room.inicia_en || now });
            const payload = toFrontendTriviaMatch(room, match, selectedQuestions);
            emitTriviaRoomUpdated(room.id_sala, { action: 'started', room: toFrontendTriviaRoom(room) });
            emitTriviaGameUpdated(room.id_sala, { action: 'started', game: payload });
            return res.status(201).json(payload);
        } catch (error) {
            return next(error);
        }
    }

    static async getTriviaMatch(req, res, next) {
        try {
            const room = await TriviaRoom.findByPk(req.params.id);
            if (!room) {
                return res.status(404).json({ success: false, message: 'Sala no encontrada' });
            }

            const match = await TriviaMatch.findOne({
                where: { id_sala: room.id_sala },
                order: [['created_at', 'DESC']],
            });

            if (!match) {
                return res.status(404).json({ success: false, message: 'Partida no encontrada' });
            }

            const questions = await Question.findAll({
                where: { id_pregunta: { [Op.in]: match.preguntas } },
            });

            return res.status(200).json(toFrontendTriviaMatch(room, match, questions));
        } catch (error) {
            return next(error);
        }
    }

    static async answerTriviaQuestion(req, res, next) {
        try {
            const room = await TriviaRoom.findByPk(req.params.id);
            if (!room) {
                return res.status(404).json({ success: false, message: 'Sala no encontrada' });
            }

            if (!userIsParticipant(room, req.user.id)) {
                return res.status(403).json({ success: false, message: 'No perteneces a esta sala' });
            }

            const match = await TriviaMatch.findOne({
                where: { id_sala: room.id_sala, estado: 'playing' },
                order: [['created_at', 'DESC']],
            });

            if (!match) {
                return res.status(404).json({ success: false, message: 'No hay partida activa' });
            }

            const questionIds = Array.isArray(match.preguntas) ? match.preguntas : [];
            const currentQuestionId = questionIds[match.pregunta_actual];
            if (String(req.body.questionId) !== String(currentQuestionId)) {
                return res.status(409).json({ success: false, message: 'La pregunta enviada no es la pregunta activa' });
            }

            const answers = Array.isArray(match.respuestas) ? [...match.respuestas] : [];
            const userId = String(req.user.id);
            const alreadyAnswered = hasAlreadyAnswered({ answers, userId, currentQuestionId });
            if (alreadyAnswered) {
                return res.status(409).json({ success: false, message: 'Ya respondiste esta pregunta' });
            }

            const question = await Question.findByPk(currentQuestionId);
            if (!question) {
                return res.status(404).json({ success: false, message: 'Pregunta no encontrada' });
            }

            const now = new Date();
            const startedAt = match.pregunta_inicia_en ? new Date(match.pregunta_inicia_en) : now;
            const responseMs = Math.max(0, now.getTime() - startedAt.getTime());
            const selectedAnswer = Number(req.body.answer);
            const isCorrect = selectedAnswer === question.respuesta_correcta;
            const points = speedScore(isCorrect, responseMs);
            const answerPayload = {
                questionId: String(currentQuestionId),
                userId,
                userName: userDisplayName(req.user),
                answer: selectedAnswer,
                correct: isCorrect,
                points,
                responseMs,
                matchId: String(match.id_partida),
                answeredAt: now.toISOString(),
            };
            answers.push(answerPayload);

            const scoreboard = (Array.isArray(match.marcador) ? [...match.marcador] : buildInitialScoreboard(room))
                .map((row) => {
                    if (String(row.id) !== userId) return row;
                    return {
                        ...row,
                        score: Number(row.score || 0) + points,
                        correctAnswers: Number(row.correctAnswers || 0) + (isCorrect ? 1 : 0),
                        answered: Number(row.answered || 0) + 1,
                    };
                });

            const participants = Array.isArray(room.participantes) ? room.participantes : [];
            const answersForCurrent = answers.filter((answer) => String(answer.questionId) === String(currentQuestionId));
            const allAnswered = participants.length > 0 && participants.every((participant) => (
                answersForCurrent.some((answer) => String(answer.userId) === String(participant.id))
            ));
            const isLastQuestion = match.pregunta_actual >= questionIds.length - 1;

            const update = {
                respuestas: answers,
                marcador: scoreboard,
            };
            if (allAnswered && isLastQuestion) {
                update.estado = 'finished';
                update.finaliza_en = now;
            } else if (allAnswered) {
                update.pregunta_actual = match.pregunta_actual + 1;
                update.pregunta_inicia_en = now;
            }

            await match.update(update);
            if (update.estado === 'finished') {
                await room.update({ estado: 'finished', finaliza_en: now });
            }

            const questions = await Question.findAll({
                where: { id_pregunta: { [Op.in]: match.preguntas } },
            });
            const gamification = await GamificationService.awardLiveAnswer(req.user, answerPayload, 'trivia');
            const payload = toFrontendTriviaMatch(room, match, questions);
            emitTriviaGameUpdated(room.id_sala, { action: update.estado === 'finished' ? 'finished' : 'answered', game: payload, answer: answerPayload });
            if (update.estado === 'finished') {
                emitTriviaRoomUpdated(room.id_sala, { action: 'finished', room: toFrontendTriviaRoom(room) });
            }

            return res.status(200).json({
                ...payload,
                lastAnswer: answerPayload,
                gamification,
            });
        } catch (error) {
            return next(error);
        }
    }

    static async nextTriviaQuestion(req, res, next) {
        try {
            const room = await TriviaRoom.findByPk(req.params.id);
            if (!room) {
                return res.status(404).json({ success: false, message: 'Sala no encontrada' });
            }

            if (String(room.id_anfitrion) !== String(req.user.id)) {
                return res.status(403).json({ success: false, message: 'Solo el anfitrion puede avanzar manualmente' });
            }

            const match = await TriviaMatch.findOne({
                where: { id_sala: room.id_sala, estado: 'playing' },
                order: [['created_at', 'DESC']],
            });
            if (!match) {
                return res.status(404).json({ success: false, message: 'No hay partida activa' });
            }

            const now = new Date();
            const questionIds = Array.isArray(match.preguntas) ? match.preguntas : [];
            if (match.pregunta_actual >= questionIds.length - 1) {
                await match.update({ estado: 'finished', finaliza_en: now });
                await room.update({ estado: 'finished', finaliza_en: now });
            } else {
                await match.update({
                    pregunta_actual: match.pregunta_actual + 1,
                    pregunta_inicia_en: now,
                });
            }

            const questions = await Question.findAll({
                where: { id_pregunta: { [Op.in]: match.preguntas } },
            });
            const payload = toFrontendTriviaMatch(room, match, questions);
            emitTriviaGameUpdated(room.id_sala, { action: match.estado === 'finished' ? 'finished' : 'next', game: payload });
            return res.status(200).json(payload);
        } catch (error) {
            return next(error);
        }
    }
}

module.exports = LearningController;
