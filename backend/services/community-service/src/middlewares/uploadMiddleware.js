const multer = require('multer');
const path = require('path');
const config = require('../config/env');

// Configuración de almacenamiento
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, config.UPLOAD_PATH);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, `resource-${uniqueSuffix}${path.extname(file.originalname)}`);
    },
});

// Filtro de archivos
const fileFilter = (req, file, cb) => {
    if (config.ALLOWED_FILE_TYPES.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Tipo de archivo no permitido. Solo PDF.'), false);
    }
};

// Configuración de multer
const upload = multer({
    storage: storage,
    limits: {
        fileSize: config.MAX_FILE_SIZE,
    },
    fileFilter: fileFilter,
});

module.exports = {
    uploadSingle: upload.single('file'),
};