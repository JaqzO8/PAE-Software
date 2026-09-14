const Category = require('./Category');
const Tag = require('./Tag');
const Repository = require('./Repository');
const Resource = require('./Resource');
const Favorite = require('./Favorite');
const Rating = require('./Rating');
const RepositoryTag = require('./RepositoryTag');
const Lesson = require('./Lesson');
const LessonProgress = require('./LessonProgress');
const StudySetting = require('./StudySetting');
const PlanningSetting = require('./PlanningSetting');
const StudyPreference = require('./StudyPreference');
const StudyReminder = require('./StudyReminder');

// ========================================
// RELACIONES
// ========================================

// Repository - Category (Muchos a Uno)
Repository.belongsTo(Category, { 
    foreignKey: 'id_categoria', 
    as: 'categoria' 
});
Category.hasMany(Repository, { 
    foreignKey: 'id_categoria', 
    as: 'repositorios' 
});

// Repository - Tag (Muchos a Muchos)
Repository.belongsToMany(Tag, { 
    through: RepositoryTag, 
    foreignKey: 'id_repositorio',
    otherKey: 'id_tag',
    as: 'tags' 
});
Tag.belongsToMany(Repository, { 
    through: RepositoryTag, 
    foreignKey: 'id_tag',
    otherKey: 'id_repositorio',
    as: 'repositorios' 
});

// Repository - Resource (Uno a Muchos)
Repository.hasMany(Resource, { 
    foreignKey: 'id_repositorio', 
    as: 'recursos',
    onDelete: 'CASCADE',
});
Resource.belongsTo(Repository, { 
    foreignKey: 'id_repositorio', 
    as: 'repositorio' 
});

// Repository - Lesson (Uno a Muchos)
Repository.hasMany(Lesson, {
    foreignKey: 'id_repositorio',
    as: 'lecciones',
    onDelete: 'CASCADE',
});
Lesson.belongsTo(Repository, {
    foreignKey: 'id_repositorio',
    as: 'repositorio',
});

// Lesson - LessonProgress (Uno a Muchos)
Lesson.hasMany(LessonProgress, {
    foreignKey: 'id_leccion',
    as: 'progresos',
    onDelete: 'CASCADE',
});
LessonProgress.belongsTo(Lesson, {
    foreignKey: 'id_leccion',
    as: 'leccion',
});

// Repository - Favorite (Uno a Muchos)
Repository.hasMany(Favorite, { 
    foreignKey: 'id_repositorio', 
    as: 'favoritos',
    onDelete: 'CASCADE',
});
Favorite.belongsTo(Repository, { 
    foreignKey: 'id_repositorio', 
    as: 'repositorio' 
});

// Repository - Rating (Uno a Muchos)
Repository.hasMany(Rating, { 
    foreignKey: 'id_repositorio', 
    as: 'calificaciones',
    onDelete: 'CASCADE',
});
Rating.belongsTo(Repository, { 
    foreignKey: 'id_repositorio', 
    as: 'repositorio' 
});

// ========================================
// FUNCIÓN PARA INICIALIZAR CATEGORÍAS
// ========================================
const initializeCategories = async () => {
    try {
        const categories = [
            { nombre: 'Matemáticas', slug: 'matematicas', descripcion: 'Álgebra, cálculo, geometría', icono: '🔢' },
            { nombre: 'Comunicación', slug: 'comunicacion', descripcion: 'Lengua, literatura, redacción', icono: '📝' },
            { nombre: 'Ciencias', slug: 'ciencias', descripcion: 'Física, química, biología', icono: '🔬' },
            { nombre: 'Historia', slug: 'historia', descripcion: 'Historia universal y regional', icono: '📚' },
            { nombre: 'Geografía', slug: 'geografia', descripcion: 'Geografía física y humana', icono: '🌎' },
            { nombre: 'Razonamiento Verbal', slug: 'razonamiento-verbal', descripcion: 'Comprensión lectora y lógica verbal', icono: '💭' },
            { nombre: 'Razonamiento Matemático', slug: 'razonamiento-matematico', descripcion: 'Lógica matemática', icono: '🧮' },
            { nombre: 'Inglés', slug: 'ingles', descripcion: 'Idioma inglés', icono: '🇬🇧' },
            { nombre: 'Filosofía', slug: 'filosofia', descripcion: 'Pensamiento filosófico', icono: '🤔' },
            { nombre: 'Economía', slug: 'economia', descripcion: 'Economía y finanzas', icono: '💰' },
        ];

        for (const cat of categories) {
            await Category.findOrCreate({
                where: { slug: cat.slug },
                defaults: cat,
            });
        }
        console.log('✅ Categorías inicializadas correctamente');
    } catch (error) {
        console.error('❌ Error inicializando categorías:', error.message);
    }
};

const initializeStudySettings = async () => {
    await StudySetting.findOrCreate({
        where: { id_configuracion: 1 },
        defaults: { id_configuracion: 1 },
    });
};

const initializePlanningSettings = async () => {
    await PlanningSetting.findOrCreate({
        where: { id_configuracion: 1 },
        defaults: { id_configuracion: 1 },
    });
};

module.exports = {
    Category,
    Tag,
    Repository,
    Resource,
    Favorite,
    Rating,
    RepositoryTag,
    Lesson,
    LessonProgress,
    StudySetting,
    PlanningSetting,
    StudyPreference,
    StudyReminder,
    initializeCategories,
    initializeStudySettings,
    initializePlanningSettings,
};
