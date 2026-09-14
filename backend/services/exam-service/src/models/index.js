const University = require('./University');
const Question = require('./Question');
const SimulacroAttempt = require('./SimulacroAttempt');
const SavedQuestion = require('./SavedQuestion');
const OpenAnswerReview = require('./OpenAnswerReview');
const ChallengeRoom = require('./ChallengeRoom');
const ChallengeMatch = require('./ChallengeMatch');
const TriviaRoom = require('./TriviaRoom');
const TriviaMatch = require('./TriviaMatch');
const AnalyticsSetting = require('./AnalyticsSetting');
const AchievementDefinition = require('./AchievementDefinition');
const UserAchievement = require('./UserAchievement');
const LearningNotification = require('./LearningNotification');
const GamificationSetting = require('./GamificationSetting');
const GamificationProfile = require('./GamificationProfile');
const GamificationEvent = require('./GamificationEvent');

University.hasMany(Question, { foreignKey: 'id_universidad', as: 'preguntas' });
Question.belongsTo(University, { foreignKey: 'id_universidad', as: 'universidad' });

University.hasMany(SimulacroAttempt, { foreignKey: 'id_universidad', as: 'intentos' });
SimulacroAttempt.belongsTo(University, { foreignKey: 'id_universidad', as: 'universidad' });

Question.hasMany(SavedQuestion, { foreignKey: 'id_pregunta', as: 'guardadas' });
SavedQuestion.belongsTo(Question, { foreignKey: 'id_pregunta', as: 'pregunta' });

SimulacroAttempt.hasMany(OpenAnswerReview, { foreignKey: 'id_intento', as: 'revisiones_abiertas' });
OpenAnswerReview.belongsTo(SimulacroAttempt, { foreignKey: 'id_intento', as: 'intento' });
Question.hasMany(OpenAnswerReview, { foreignKey: 'id_pregunta', as: 'revisiones_abiertas' });
OpenAnswerReview.belongsTo(Question, { foreignKey: 'id_pregunta', as: 'pregunta' });

ChallengeRoom.hasMany(ChallengeMatch, { foreignKey: 'id_sala', as: 'partidas' });
ChallengeMatch.belongsTo(ChallengeRoom, { foreignKey: 'id_sala', as: 'sala' });

TriviaRoom.hasMany(TriviaMatch, { foreignKey: 'id_sala', as: 'partidas' });
TriviaMatch.belongsTo(TriviaRoom, { foreignKey: 'id_sala', as: 'sala' });

AchievementDefinition.hasMany(UserAchievement, { foreignKey: 'id_logro', as: 'usuarios' });
UserAchievement.belongsTo(AchievementDefinition, { foreignKey: 'id_logro', as: 'logro' });

GamificationProfile.hasMany(GamificationEvent, { foreignKey: 'id_usuario', sourceKey: 'id_usuario', as: 'eventos' });
GamificationEvent.belongsTo(GamificationProfile, { foreignKey: 'id_usuario', targetKey: 'id_usuario', as: 'perfil' });

const seedExamData = async () => {
    const universities = [
        { slug: 'unmsm', nombre: 'Universidad Nacional Mayor de San Marcos (UNMSM)' },
        { slug: 'uni', nombre: 'Universidad Nacional de Ingenieria (UNI)' },
        { slug: 'pucp', nombre: 'Pontificia Universidad Catolica del Peru (PUCP)' },
        { slug: 'unfv', nombre: 'Universidad Nacional Federico Villarreal (UNFV)' },
        { slug: 'unac', nombre: 'Universidad Nacional del Callao (UNAC)' },
        { slug: 'upn', nombre: 'Universidad Privada del Norte (UPN)' },
    ];

    const createdUniversities = {};
    for (const uni of universities) {
        const [instance] = await University.findOrCreate({
            where: { slug: uni.slug },
            defaults: uni,
        });
        createdUniversities[uni.slug] = instance;
    }

    const count = await Question.count();
    if (count > 0) return;

    const baseQuestions = [
        {
            materia: 'Matematicas',
            tema: 'Funciones',
            dificultad: 'medio',
            enunciado: 'Si f(x) = 3x^2 + 2x - 5, cual es el valor de f(2)?',
            opciones: ['7', '11', '15', '19'],
            respuesta_correcta: 1,
            explicacion: 'Reemplazando x = 2: 3(4) + 4 - 5 = 11.',
        },
        {
            materia: 'Historia',
            tema: 'Peru republicano',
            dificultad: 'facil',
            enunciado: 'Cual es la capital del Peru?',
            opciones: ['Arequipa', 'Lima', 'Cusco', 'Trujillo'],
            respuesta_correcta: 1,
            explicacion: 'Lima es la capital del Peru.',
        },
        {
            materia: 'Quimica',
            tema: 'Compuestos',
            dificultad: 'facil',
            enunciado: 'La formula quimica del agua es:',
            opciones: ['H2O2', 'H2O', 'H3O', 'HO2'],
            respuesta_correcta: 1,
            explicacion: 'El agua tiene dos atomos de hidrogeno y uno de oxigeno.',
        },
        {
            materia: 'Literatura',
            tema: 'Narrativa latinoamericana',
            dificultad: 'medio',
            enunciado: 'Quien escribio Cien anos de soledad?',
            opciones: ['Mario Vargas Llosa', 'Gabriel Garcia Marquez', 'Pablo Neruda', 'Jorge Luis Borges'],
            respuesta_correcta: 1,
            explicacion: 'La novela fue escrita por Gabriel Garcia Marquez.',
        },
        {
            materia: 'Razonamiento Matematico',
            tema: 'Raices',
            dificultad: 'facil',
            enunciado: 'El resultado de la raiz cuadrada de 144 es:',
            opciones: ['10', '11', '12', '13'],
            respuesta_correcta: 2,
            explicacion: '12 por 12 es igual a 144.',
        },
        {
            materia: 'Comunicacion',
            tema: 'Comprension lectora',
            dificultad: 'dificil',
            tipo: 'abierta',
            enunciado: 'Explica en dos lineas por que la tesis debe aparecer con claridad en un texto argumentativo.',
            opciones: [],
            respuesta_texto: 'La tesis orienta la argumentacion y permite evaluar la coherencia de las razones.',
            explicacion: 'Una tesis clara organiza los argumentos y evita ambiguedad.',
        },
    ];

    const expanded = [];
    Object.values(createdUniversities).forEach((university, uniIndex) => {
        baseQuestions.forEach((question, questionIndex) => {
            expanded.push({
                ...question,
                id_universidad: university.id_universidad,
                etiquetas: [university.slug, question.materia.toLowerCase()],
                enunciado: `${question.enunciado} ${uniIndex > 0 ? `(Modelo ${uniIndex + 1}.${questionIndex + 1})` : ''}`.trim(),
            });
        });
    });

    await Question.bulkCreate(expanded);
};

const seedAnalyticsSettings = async () => {
    await AnalyticsSetting.findOrCreate({
        where: { id_configuracion: 1 },
        defaults: { id_configuracion: 1 },
    });
};

const seedAchievementDefinitions = async () => {
    const definitions = [
        {
            codigo: 'primer_simulacro',
            titulo: 'Primer simulacro',
            descripcion: 'Completaste tu primer simulacro en PAE.',
            icono: 'trophy',
            condicion: 'attempts_count',
            umbral: 1,
            puntos: 10,
        },
        {
            codigo: 'practica_constante',
            titulo: 'Practica constante',
            descripcion: 'Completaste cinco simulacros registrados.',
            icono: 'target',
            condicion: 'attempts_count',
            umbral: 5,
            puntos: 25,
        },
        {
            codigo: 'precision_destacada',
            titulo: 'Precision destacada',
            descripcion: 'Alcanzaste una precision de al menos 80% en un simulacro.',
            icono: 'sparkles',
            condicion: 'single_attempt_accuracy',
            umbral: 80,
            puntos: 20,
        },
        {
            codigo: 'simulacro_perfecto',
            titulo: 'Simulacro perfecto',
            descripcion: 'Respondiste correctamente todas las preguntas evaluables.',
            icono: 'medal',
            condicion: 'single_attempt_accuracy',
            umbral: 100,
            puntos: 40,
        },
    ];

    for (const definition of definitions) {
        await AchievementDefinition.findOrCreate({
            where: { codigo: definition.codigo },
            defaults: definition,
        });
    }
};

const seedGamificationSettings = async () => {
    await GamificationSetting.findOrCreate({
        where: { id_configuracion: 1 },
        defaults: {
            id_configuracion: 1,
            onboarding_steps: [
                {
                    id: 'perfil_objetivo',
                    title: 'Define tu meta',
                    description: 'Revisa tu perfil y confirma la universidad o carrera objetivo.',
                    route: '/perfil',
                },
                {
                    id: 'primer_simulacro',
                    title: 'Completa un simulacro',
                    description: 'Haz tu primer intento para desbloquear diagnostico y recomendaciones.',
                    route: '/aprendizaje/simulacros',
                },
                {
                    id: 'repaso_guardado',
                    title: 'Guarda una pregunta dificil',
                    description: 'Usa el solucionario para crear tu lista personal de repaso.',
                    route: '/aprendizaje/preguntas-guardadas',
                },
                {
                    id: 'reto_en_vivo',
                    title: 'Participa en una actividad en vivo',
                    description: 'Responde una pregunta en desafio o trivia para ganar puntos por velocidad.',
                    route: '/aprendizaje/desafios',
                },
            ],
        },
    });
};

module.exports = {
    University,
    Question,
    SimulacroAttempt,
    SavedQuestion,
    OpenAnswerReview,
    ChallengeRoom,
    ChallengeMatch,
    TriviaRoom,
    TriviaMatch,
    AnalyticsSetting,
    AchievementDefinition,
    UserAchievement,
    LearningNotification,
    GamificationSetting,
    GamificationProfile,
    GamificationEvent,
    seedExamData,
    seedAnalyticsSettings,
    seedAchievementDefinitions,
    seedGamificationSettings,
};
