// backend/services/content-service/src/middlewares/uploadMiddleware.js

const multer = require('multer');
const path = require('path');
const fs = require('fs');
const config = require('../config/env');

// ✅ CORRECCIÓN: Asegurar que los directorios existan
const ensureDirectoryExists = (dir) => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`✅ Directorio creado: ${dir}`);
    }
};

// ✅ CORRECCIÓN: Inicializar directorios al cargar el módulo
const initUploadDirectories = () => {
    const baseUploadPath = config.UPLOAD_PATH;
    const subdirs = ['resources/pdfs', 'resources/videos', 'resources/audios', 'resources/images', 'resources/others'];
    
    subdirs.forEach(subdir => {
        const fullPath = path.join(baseUploadPath, subdir);
        ensureDirectoryExists(fullPath);
    });
};

// Inicializar directorios
initUploadDirectories();

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        let uploadPath = '';
        
        if (file.mimetype.startsWith('application/pdf')) {
            uploadPath = path.join(config.UPLOAD_PATH, 'resources', 'pdfs');
        } else if (file.mimetype.startsWith('video/')) {
            uploadPath = path.join(config.UPLOAD_PATH, 'resources', 'videos');
        } else if (file.mimetype.startsWith('audio/')) {
            uploadPath = path.join(config.UPLOAD_PATH, 'resources', 'audios');
        } else if (file.mimetype.startsWith('image/')) {
            uploadPath = path.join(config.UPLOAD_PATH, 'resources', 'images');
        } else {
            uploadPath = path.join(config.UPLOAD_PATH, 'resources', 'others');
        }

        ensureDirectoryExists(uploadPath);
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        const nameWithoutExt = path.basename(file.originalname, ext);
        const sanitizedName = nameWithoutExt.replace(/[^a-zA-Z0-9]/g, '_');
        
        cb(null, `${sanitizedName}-${uniqueSuffix}${ext}`);
    }
});

const fileFilter = (req, file, cb) => {
    const allowedTypes = [
        ...config.ALLOWED_FILE_TYPES.pdf,
        ...config.ALLOWED_FILE_TYPES.video,
        ...config.ALLOWED_FILE_TYPES.audio,
        ...config.ALLOWED_FILE_TYPES.image,
    ];

    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error(`Tipo de archivo no permitido: ${file.mimetype}`), false);
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: config.MAX_FILE_SIZE,
    },
});

const uploadSingle = (fieldName = 'file') => {
    return upload.single(fieldName);
};

const uploadMultiple = (fieldName = 'files', maxCount = 10) => {
    return upload.array(fieldName, maxCount);
};

const uploadCover = upload.single('portada');

module.exports = {
    uploadSingle,
    uploadMultiple,
    uploadCover,
};