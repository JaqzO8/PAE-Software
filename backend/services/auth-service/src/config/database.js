const { Sequelize } = require('sequelize');
const config = require('./env');

const sequelize = new Sequelize({
    host: config.DB_HOST,
    port: config.DB_PORT,
    database: config.DB_NAME,
    username: config.DB_USER,
    password: config.DB_PASSWORD,
    dialect: 'postgres',
    logging: config.LOG_SQL ? console.log : false,
    pool: {
        max: config.DB_POOL_MAX,
        min: config.DB_POOL_MIN,
        acquire: config.DB_POOL_ACQUIRE_MS,
        idle: config.DB_POOL_IDLE_MS,
    },
    define: {
        timestamps: true,
        underscored: true,
        freezeTableName: true,
    },
});

// Función para probar la conexión
const testConnection = async () => {
    try {
        await sequelize.authenticate();
        console.log('✅ Conexión a PostgreSQL establecida correctamente');
        return true;
    } catch (error) {
        console.error('❌ Error al conectar con PostgreSQL:', error.message);
        return false;
    }
};

// Función para sincronizar modelos
const syncDatabase = async (options = {}) => {
    try {
        await sequelize.sync(options);
        console.log('✅ Base de datos sincronizada');
    } catch (error) {
        console.error('❌ Error al sincronizar base de datos:', error.message);
        throw error;
    }
};

module.exports = {
    sequelize,
    testConnection,
    syncDatabase,
};
