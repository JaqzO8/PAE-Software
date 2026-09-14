-- Script de inicialización de la base de datos AUTH

-- Tabla de Roles
CREATE TABLE IF NOT EXISTS roles (
    id_rol SERIAL PRIMARY KEY,
    nombre_rol VARCHAR(50) UNIQUE NOT NULL CHECK (nombre_rol IN ('estudiante', 'docente', 'admin')),
    descripcion TEXT,
    CONSTRAINT roles_nombre_rol_unique UNIQUE (nombre_rol)
);

-- Insertar roles por defecto
INSERT INTO roles (nombre_rol, descripcion) VALUES
('estudiante', 'Usuario estudiante con acceso a contenido educativo'),
('docente', 'Usuario docente con permisos para crear y gestionar contenido'),
('admin', 'Administrador con acceso completo al sistema')
ON CONFLICT (nombre_rol) DO NOTHING;

-- Tabla de Usuarios (ACTUALIZADA: separando nombre y apellidos)
CREATE TABLE IF NOT EXISTS usuarios (
    id_usuario SERIAL PRIMARY KEY,
    identificador_unico VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    nombres VARCHAR(100) NOT NULL,
    apellidos VARCHAR(100) NOT NULL,
    carrera_interes VARCHAR(100),
    institucion VARCHAR(200),
    bio TEXT,
    avatar VARCHAR(255),
    rol_id INTEGER NOT NULL REFERENCES roles(id_rol) ON DELETE RESTRICT,
    fecha_registro TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    primer_ingreso BOOLEAN NOT NULL DEFAULT TRUE,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    CONSTRAINT usuarios_email_unique UNIQUE (email),
    CONSTRAINT usuarios_identificador_unico_unique UNIQUE (identificador_unico)
);

-- Índices para usuarios
CREATE INDEX IF NOT EXISTS idx_usuarios_identificador_unico ON usuarios(identificador_unico);
CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);
CREATE INDEX IF NOT EXISTS idx_usuarios_rol_id ON usuarios(rol_id);
CREATE INDEX IF NOT EXISTS idx_usuarios_activo ON usuarios(activo);
CREATE INDEX IF NOT EXISTS idx_usuarios_nombres ON usuarios(nombres);
CREATE INDEX IF NOT EXISTS idx_usuarios_apellidos ON usuarios(apellidos);

-- Tabla de Sesiones
CREATE TABLE IF NOT EXISTS sesiones (
    id_sesion SERIAL PRIMARY KEY,
    id_usuario INTEGER NOT NULL REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
    token_sesion VARCHAR(255) UNIQUE NOT NULL,
    dispositivo VARCHAR(100),
    ip_address VARCHAR(45),
    user_agent TEXT,
    fecha_inicio TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_ultimo_acceso TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    activa BOOLEAN NOT NULL DEFAULT TRUE,
    CONSTRAINT sesiones_token_sesion_unique UNIQUE (token_sesion)
);

-- Índices para sesiones
CREATE INDEX IF NOT EXISTS idx_sesiones_id_usuario ON sesiones(id_usuario);
CREATE INDEX IF NOT EXISTS idx_sesiones_token_sesion ON sesiones(token_sesion);
CREATE INDEX IF NOT EXISTS idx_sesiones_activa ON sesiones(activa);
CREATE INDEX IF NOT EXISTS idx_sesiones_fecha_ultimo_acceso ON sesiones(fecha_ultimo_acceso);

-- Tabla de Historial de Sesiones
CREATE TABLE IF NOT EXISTS historial_sesiones (
    id_historial SERIAL PRIMARY KEY,
    id_usuario INTEGER NOT NULL REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
    dispositivo VARCHAR(100),
    ip_address VARCHAR(45),
    fecha_acceso TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    accion VARCHAR(50) NOT NULL CHECK (accion IN ('login', 'logout', 'cambio_password', 'token_refresh')),
    exitoso BOOLEAN NOT NULL DEFAULT TRUE
);

-- Índices para historial
CREATE INDEX IF NOT EXISTS idx_historial_id_usuario ON historial_sesiones(id_usuario);
CREATE INDEX IF NOT EXISTS idx_historial_fecha_acceso ON historial_sesiones(fecha_acceso);
CREATE INDEX IF NOT EXISTS idx_historial_accion ON historial_sesiones(accion);
CREATE INDEX IF NOT EXISTS idx_historial_exitoso ON historial_sesiones(exitoso);

-- Tabla de preferencias de interfaz y accesibilidad
CREATE TABLE IF NOT EXISTS preferencias_usuario (
    id_preferencia SERIAL PRIMARY KEY,
    id_usuario INTEGER UNIQUE NOT NULL REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
    tema VARCHAR(20) NOT NULL DEFAULT 'light' CHECK (tema IN ('light', 'dark')),
    tamano_fuente VARCHAR(20) NOT NULL DEFAULT 'medium' CHECK (tamano_fuente IN ('small', 'medium', 'large')),
    reducir_movimiento BOOLEAN NOT NULL DEFAULT FALSE,
    alto_contraste BOOLEAN NOT NULL DEFAULT FALSE,
    notificaciones_email BOOLEAN NOT NULL DEFAULT TRUE,
    notificaciones_desafios BOOLEAN NOT NULL DEFAULT TRUE,
    notificaciones_comunidad BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_preferencias_usuario_id_usuario ON preferencias_usuario(id_usuario);
CREATE INDEX IF NOT EXISTS idx_preferencias_usuario_tema ON preferencias_usuario(tema);

-- Tabla de soporte tecnico, privacidad y accesibilidad
CREATE TABLE IF NOT EXISTS tickets_soporte (
    id_ticket SERIAL PRIMARY KEY,
    id_usuario INTEGER NOT NULL REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
    asunto VARCHAR(160) NOT NULL,
    descripcion TEXT NOT NULL,
    categoria VARCHAR(40) NOT NULL DEFAULT 'tecnico' CHECK (categoria IN ('tecnico', 'cuenta', 'privacidad', 'contenido', 'accesibilidad')),
    prioridad VARCHAR(20) NOT NULL DEFAULT 'media' CHECK (prioridad IN ('baja', 'media', 'alta')),
    estado VARCHAR(20) NOT NULL DEFAULT 'abierto' CHECK (estado IN ('abierto', 'en_revision', 'resuelto', 'cerrado')),
    respuesta TEXT,
    fecha_respuesta TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_tickets_soporte_id_usuario ON tickets_soporte(id_usuario);
CREATE INDEX IF NOT EXISTS idx_tickets_soporte_estado ON tickets_soporte(estado);
CREATE INDEX IF NOT EXISTS idx_tickets_soporte_categoria ON tickets_soporte(categoria);
CREATE INDEX IF NOT EXISTS idx_tickets_soporte_prioridad ON tickets_soporte(prioridad);

-- ========================================
-- Función para limpiar sesiones antiguas
-- ========================================
CREATE OR REPLACE FUNCTION limpiar_sesiones_antiguas()
RETURNS void AS $$
BEGIN
    -- Eliminar sesiones inactivas de más de 30 días
    DELETE FROM sesiones
    WHERE activa = FALSE
    AND fecha_ultimo_acceso < CURRENT_TIMESTAMP - INTERVAL '30 days';
    
    -- Eliminar historial de más de 90 días
    DELETE FROM historial_sesiones
    WHERE fecha_acceso < CURRENT_TIMESTAMP - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- Trigger para actualizar fecha_ultimo_acceso
-- ========================================
CREATE OR REPLACE FUNCTION actualizar_fecha_ultimo_acceso()
RETURNS TRIGGER AS $$
BEGIN
    NEW.fecha_ultimo_acceso = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Solo crear el trigger si no existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'trigger_actualizar_fecha_ultimo_acceso'
    ) THEN
        CREATE TRIGGER trigger_actualizar_fecha_ultimo_acceso
            BEFORE UPDATE ON sesiones
            FOR EACH ROW
            WHEN (OLD.activa = TRUE AND NEW.activa = TRUE)
            EXECUTE FUNCTION actualizar_fecha_ultimo_acceso();
    END IF;
END
$$;

-- ========================================
-- Vista para sesiones activas
-- ========================================
CREATE OR REPLACE VIEW vista_sesiones_activas AS
SELECT 
    s.id_sesion,
    s.id_usuario,
    u.identificador_unico,
    u.email,
    CONCAT(u.nombres, ' ', u.apellidos) AS nombre_completo,
    r.nombre_rol AS rol,
    s.dispositivo,
    s.ip_address,
    s.fecha_inicio,
    s.fecha_ultimo_acceso,
    EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - s.fecha_ultimo_acceso)) / 60 AS minutos_inactivo
FROM sesiones s
JOIN usuarios u ON s.id_usuario = u.id_usuario
JOIN roles r ON u.rol_id = r.id_rol
WHERE s.activa = TRUE
ORDER BY s.fecha_ultimo_acceso DESC;

-- ========================================
-- Vista para estadísticas de usuarios
-- ========================================
CREATE OR REPLACE VIEW vista_estadisticas_usuarios AS
SELECT 
    r.nombre_rol AS rol,
    COUNT(u.id_usuario) AS total_usuarios,
    COUNT(CASE WHEN u.activo = TRUE THEN 1 END) AS usuarios_activos,
    COUNT(CASE WHEN u.primer_ingreso = TRUE THEN 1 END) AS usuarios_nuevos,
    COUNT(CASE WHEN DATE(u.fecha_registro) = CURRENT_DATE THEN 1 END) AS registros_hoy
FROM roles r
LEFT JOIN usuarios u ON r.id_rol = u.rol_id
GROUP BY r.nombre_rol, r.id_rol
ORDER BY r.id_rol;

-- ========================================
-- Grants de permisos
-- ========================================
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO auth_user;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO auth_user;

-- ========================================
-- Información del schema
-- ========================================
SELECT 'Inicialización de Auth DB completada' AS mensaje;
SELECT COUNT(*) AS total_roles FROM roles;
SELECT COUNT(*) AS total_usuarios FROM usuarios;
