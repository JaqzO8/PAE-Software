const { Sequelize } = require('sequelize');
const { readFileSync, readdirSync } = require('node:fs');
const path = require('node:path');
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
        underscored: true,
        freezeTableName: true,
    },
});

const testConnection = async () => {
    await sequelize.authenticate();
    console.log('Conexion a PostgreSQL (Exam DB) establecida correctamente');
};

const syncDatabase = async () => {
    await sequelize.sync();
    const migrationsPath = path.join(__dirname, '../../migrations');
    const migrations = readdirSync(migrationsPath).filter((file) => file.endsWith('.sql')).sort();
    await migrations.reduce(async (previousPromise, file) => {
        await previousPromise;
        const sql = readFileSync(path.join(migrationsPath, file), 'utf8');
        return sequelize.query(sql);
    }, Promise.resolve());
    console.log('Base de datos de examenes sincronizada');
};

module.exports = {
    sequelize,
    testConnection,
    syncDatabase,
};
