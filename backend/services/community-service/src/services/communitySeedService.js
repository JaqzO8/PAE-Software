const { CommunitySetting, WellbeingContent, UniversityNews } = require('../models');
const { DEFAULT_SETTING_ROWS } = require('./communityConfigService');

const wellbeingSeed = [
    {
        tipo: 'descanso',
        titulo: 'Respiracion 4-4-6',
        descripcion: 'Pausa breve para bajar activacion antes de volver a estudiar o participar en el chat.',
        accion_label: 'Iniciar pausa',
        duracion_minutos: 4,
        etiquetas: ['ansiedad', 'concentracion'],
        orden: 1,
    },
    {
        tipo: 'descanso',
        titulo: 'Estiramiento de escritorio',
        descripcion: 'Rutina corta para cuello, hombros y espalda despues de una sesion larga.',
        accion_label: 'Ver rutina',
        duracion_minutos: 6,
        etiquetas: ['pausa-activa', 'salud'],
        orden: 2,
    },
    {
        tipo: 'orientacion',
        titulo: 'Explora carreras por area de interes',
        descripcion: 'Compara carreras afines a ciencias, letras, gestion y tecnologia antes de elegir tu meta.',
        accion_label: 'Revisar guia',
        duracion_minutos: 12,
        etiquetas: ['vocacional', 'carreras'],
        orden: 1,
    },
    {
        tipo: 'orientacion',
        titulo: 'Checklist para elegir universidad',
        descripcion: 'Evalua malla curricular, costos, modalidad, ubicacion, empleabilidad y becas.',
        accion_label: 'Abrir checklist',
        duracion_minutos: 10,
        etiquetas: ['universidad', 'decision'],
        orden: 2,
    },
    {
        tipo: 'bienestar',
        titulo: 'Plan antiansiedad para simulacros',
        descripcion: 'Secuencia de preparacion antes, durante y despues de un simulacro exigente.',
        accion_label: 'Aplicar plan',
        duracion_minutos: 8,
        etiquetas: ['simulacros', 'bienestar'],
        orden: 1,
    },
    {
        tipo: 'bienestar',
        titulo: 'Conversacion de apoyo con tu comunidad',
        descripcion: 'Usa preguntas guia para pedir ayuda academica sin sentirte expuesto.',
        accion_label: 'Ver preguntas',
        duracion_minutos: 5,
        etiquetas: ['comunidad', 'apoyo'],
        orden: 2,
    },
];

const newsSeed = [
    {
        titulo: 'Calendarios de admision: confirma fechas oficiales',
        resumen: 'Centraliza enlaces y recordatorios para revisar cronogramas de universidades antes de planificar simulacros.',
        universidad: 'General',
        categoria: 'admision',
    },
    {
        titulo: 'Becas y beneficios: prepara documentos con anticipacion',
        resumen: 'Lista de documentos frecuentes para postulaciones a becas, escalas y beneficios socioeconomicos.',
        universidad: 'General',
        categoria: 'becas',
    },
    {
        titulo: 'Ferias vocacionales y charlas informativas',
        resumen: 'Revisa eventos de orientacion para comparar carreras, sedes y modalidades de estudio.',
        universidad: 'General',
        categoria: 'orientacion',
    },
];

const seedCommunityDefaults = async () => {
    for (const setting of DEFAULT_SETTING_ROWS) {
        await CommunitySetting.findOrCreate({
            where: { clave: setting.clave },
            defaults: setting,
        });
    }

    for (const content of wellbeingSeed) {
        await WellbeingContent.findOrCreate({
            where: { tipo: content.tipo, titulo: content.titulo },
            defaults: content,
        });
    }

    for (const news of newsSeed) {
        await UniversityNews.findOrCreate({
            where: { titulo: news.titulo },
            defaults: news,
        });
    }
};

module.exports = { seedCommunityDefaults };
