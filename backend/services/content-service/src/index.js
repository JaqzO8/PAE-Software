// backend/services/content-service/src/index.js

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const config = require('./config/env');
const { testConnection, syncDatabase } = require('./config/database');
const { initializeCategories, initializeStudySettings, initializePlanningSettings } = require('./models');
const { errorHandler, notFound } = require('./middlewares/errorMiddleware');

// Importar rutas
const statsRoutes = require('./routes/statsRoutes');
const repositoryRoutes = require('./routes/repositoryRoutes');
const resourceRoutes = require('./routes/resourceRoutes');
const favoriteRoutes = require('./routes/favoriteRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const lessonRoutes = require('./routes/lessonRoutes');
const planningRoutes = require('./routes/planningRoutes');

const app = express();
app.set('trust proxy', 1);

const allowedOrigins = [
    config.FRONTEND_URL,
    config.FRONTEND_URL.replace('localhost', '127.0.0.1'),
    'http://localhost:5173',
    'http://127.0.0.1:5173',
];

// =================================================
// MIDDLEWARES BÁSICOS
// =================================================
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" } // ✅ Permite cargar recursos de otros orígenes
}));

app.use(cors({
    origin: allowedOrigins,
    credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// =================================================
// SERVIR ARCHIVOS ESTÁTICOS - UPLOADS
// =================================================
console.log('📁 Sirviendo archivos estáticos desde:', config.UPLOAD_PATH);

// Middleware para servir archivos estáticos con logs
app.use('/uploads', (req, res, next) => {
    console.log('📥 Solicitud de archivo:', req.url);
    next();
}, express.static(config.UPLOAD_PATH, {
    setHeaders: (res, filePath) => {
        // Agregar headers CORS para imágenes
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
        
        // Cache para mejorar performance
        res.setHeader('Cache-Control', 'public, max-age=86400'); // 1 día
        
        console.log('✅ Sirviendo archivo:', filePath);
    }
}));

// Middleware para manejar 404 en uploads
app.use('/uploads', (req, res) => {
    console.error('❌ Archivo no encontrado:', req.url);
    res.status(404).json({
        success: false,
        message: 'Archivo no encontrado',
        path: req.url
    });
});

// =================================================
// RATE LIMITING
// =================================================
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: Number(process.env.CONTENT_RATE_LIMIT_MAX || 3000),
});
app.use('/api/content', limiter);

// =================================================
// RUTAS DE LA API
// =================================================
// IMPORTANTE: Stats debe ir primero
app.use('/api/content/stats', statsRoutes);
app.use('/api/content/repositories', repositoryRoutes);
app.use('/api/content/resources', resourceRoutes);
app.use('/api/content/lessons', lessonRoutes);
app.use('/api/content/planning', planningRoutes);
app.use('/api/content/favorites', favoriteRoutes);
app.use('/api/content/categories', categoryRoutes);
app.use('/api/content/tags', categoryRoutes);

// Health check
app.get('/api/content/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Content Service is healthy',
        timestamp: new Date().toISOString(),
        uploadPath: config.UPLOAD_PATH
    });
});

// =================================================
// MANEJO DE ERRORES
// =================================================
app.use(notFound);
app.use(errorHandler);

// =================================================
// INICIALIZACIÓN DEL SERVIDOR
// =================================================
const startServer = async () => {
    try {
        console.log('🚀 Iniciando Content Service...');
        
        // Verificar conexión a la base de datos
        await testConnection();
        await syncDatabase();
        console.log('✅ Conexión a la base de datos exitosa');
        
        // Inicializar categorías por defecto
        await initializeCategories();
        await initializeStudySettings();
        await initializePlanningSettings();
        console.log('✅ Categorías inicializadas');
        
        // Iniciar servidor
        app.listen(config.PORT, () => {
            console.log(`✅ Content Service escuchando en puerto ${config.PORT}`);
            console.log(`📁 Archivos estáticos en: ${config.UPLOAD_PATH}`);
            console.log(`🔗 URL base: http://localhost:${config.PORT}`);
            console.log(`🖼️ Uploads: http://localhost:${config.PORT}/uploads/`);
        });
    } catch (error) {
        console.error('❌ Error al iniciar el servidor:', error);
        process.exit(1);
    }
};

// Manejo de errores no capturados
process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Promesa rechazada no manejada:', reason);
});

process.on('uncaughtException', (error) => {
    console.error('❌ Excepción no capturada:', error);
    process.exit(1);
});

startServer();
