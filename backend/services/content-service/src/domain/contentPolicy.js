class ContentError extends Error {
    constructor(code, message, status = 400) {
        super(message);
        this.name = 'ContentError';
        this.code = code;
        this.status = status;
    }
}

const fail = (code, message, status = 400) => {
    throw new ContentError(code, message, status);
};

const positiveId = (value) => {
    if (!/^[1-9]\d*$/.test(String(value)) || !Number.isSafeInteger(Number(value))) {
        fail('INVALID_ID', 'Identificador numérico inválido');
    }
    return Number(value);
};

const requireTeacherOrAdmin = (actor) => {
    if (!actor || (actor.rol !== 'docente' && actor.rol !== 'admin')) {
        fail('TEACHER_REQUIRED', 'Se requieren permisos de docente', 403);
    }
};

const requireRepositoryOwner = (repository, actor) => {
    if (!repository || !repository.activo) {
        fail('REPOSITORY_NOT_FOUND', 'Repositorio no encontrado o inactivo', 404);
    }
    if (Number(repository.id_profesor) !== positiveId(actor.id) && actor.rol !== 'admin') {
        fail('OWNER_REQUIRED', 'Solo el docente propietario puede realizar esta acción', 403);
    }
};

const DANGEROUS_EXTENSIONS = new Set([
    '.exe', '.bat', '.cmd', '.sh', '.php', '.phtml', '.js', '.vbs', '.py', '.msi', '.com', '.scr',
]);

const sanitizeFileName = (originalName) => {
    if (typeof originalName !== 'string' || !originalName.trim()) {
        fail('INVALID_FILE_NAME', 'Nombre de archivo inválido');
    }
    const clean = originalName.replace(/[\/\\]/g, '_').replace(/[^a-zA-Z0-9.\-_]/g, '_');
    if (clean.includes('..')) {
        fail('PATH_TRAVERSAL_DETECTED', 'Intento de evasión de ruta detectado', 403);
    }
    return clean;
};

const validateFileIntegrity = (file) => {
    if (!file) return;

    const extMatch = String(file.originalname || '').match(/\.[a-zA-Z0-9]+$/);
    const ext = extMatch ? extMatch[0].toLowerCase() : '';

    if (DANGEROUS_EXTENSIONS.has(ext)) {
        fail('DANGEROUS_FILE_EXTENSION', 'Extensión de archivo bloqueada por política de seguridad', 422);
    }

    if (file.buffer && file.buffer.length >= 4) {
        const header = file.buffer.subarray(0, 5).toString('ascii');

        // Validación de magic bytes para PDF (RQ14 / CP-02)
        if (ext === '.pdf' || file.mimetype === 'application/pdf') {
            if (!header.startsWith('%PDF-')) {
                fail('INVALID_PDF_HEADER', 'El archivo PDF está dañado o no es válido', 422);
            }
        }

        // Validación para imágenes PNG
        if (ext === '.png' || file.mimetype === 'image/png') {
            const isPng = file.buffer[0] === 0x89 && file.buffer[1] === 0x50 && file.buffer[2] === 0x4E && file.buffer[3] === 0x47;
            if (!isPng) {
                fail('INVALID_PNG_HEADER', 'El archivo PNG no tiene formato válido', 422);
            }
        }

        // Validación para imágenes JPEG
        if (ext === '.jpg' || ext === '.jpeg' || file.mimetype === 'image/jpeg') {
            const isJpeg = file.buffer[0] === 0xFF && file.buffer[1] === 0xD8 && file.buffer[2] === 0xFF;
            if (!isJpeg) {
                fail('INVALID_JPEG_HEADER', 'El archivo JPEG no tiene formato válido', 422);
            }
        }
    }
};

const RESOURCE_STATES = ['borrador', 'subiendo', 'revisado', 'publicado', 'retirado'];

const validateResourceTransition = (currentState, nextState) => {
    if (!RESOURCE_STATES.includes(nextState)) {
        fail('INVALID_STATE', `Estado de recurso no reconocido: ${nextState}`);
    }
    const allowedTransitions = {
        borrador: ['subiendo', 'revisado', 'publicado', 'retirado'],
        subiendo: ['revisado', 'publicado', 'borrador'],
        revisado: ['publicado', 'borrador', 'retirado'],
        publicado: ['retirado'],
        retirado: ['borrador', 'revisado'],
    };
    if (currentState && !allowedTransitions[currentState]?.includes(nextState)) {
        fail('INVALID_TRANSITION', `Transición de estado no permitida de ${currentState} a ${nextState}`);
    }
};

const canDownloadResource = (resource, actor) => {
    if (!resource || !resource.activo) {
        fail('RESOURCE_NOT_FOUND', 'Recurso no encontrado', 404);
    }
    if (resource.repositorio?.publico === false) {
        if (!actor || !actor.id) {
            fail('AUTHENTICATION_REQUIRED', 'Autenticación requerida para acceder a este recurso privado', 401);
        }
        if (Number(resource.repositorio.id_profesor) !== positiveId(actor.id) && actor.rol !== 'admin') {
            fail('ACCESS_DENIED', 'No tienes permisos para descargar este recurso privado', 403);
        }
    }
    return true;
};

module.exports = {
    ContentError,
    fail,
    positiveId,
    requireTeacherOrAdmin,
    requireRepositoryOwner,
    sanitizeFileName,
    validateFileIntegrity,
    RESOURCE_STATES,
    validateResourceTransition,
    canDownloadResource,
};
