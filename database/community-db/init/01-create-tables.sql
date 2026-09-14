-- ========================================
-- Script de inicialización de la base de datos COMMUNITY
-- ========================================

-- ========================================
-- TABLA: Comunidades
-- ========================================
CREATE TABLE IF NOT EXISTS comunidades (
    id_comunidad SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    icono_url VARCHAR(255),
    materia VARCHAR(100),
    profesor_id INTEGER NOT NULL, -- Referencia a usuarios de auth-service
    puntos_prestigio INTEGER NOT NULL DEFAULT 0,
    proximo_hito INTEGER NOT NULL DEFAULT 100,
    es_publica BOOLEAN NOT NULL DEFAULT TRUE,
    activa BOOLEAN NOT NULL DEFAULT TRUE,
    fecha_creacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_eliminacion TIMESTAMP,
    CONSTRAINT comunidades_nombre_length CHECK (LENGTH(nombre) >= 3),
    CONSTRAINT comunidades_puntos_check CHECK (puntos_prestigio >= 0),
    CONSTRAINT comunidades_hito_check CHECK (proximo_hito > 0)
);

-- Índices para comunidades
CREATE INDEX IF NOT EXISTS idx_comunidades_profesor_id ON comunidades(profesor_id);
CREATE INDEX IF NOT EXISTS idx_comunidades_activa ON comunidades(activa);
CREATE INDEX IF NOT EXISTS idx_comunidades_es_publica ON comunidades(es_publica);
CREATE INDEX IF NOT EXISTS idx_comunidades_nombre ON comunidades(nombre);
CREATE INDEX IF NOT EXISTS idx_comunidades_materia ON comunidades(materia);
CREATE INDEX IF NOT EXISTS idx_comunidades_fecha_creacion ON comunidades(fecha_creacion);

-- ========================================
-- TABLA: Miembros de Comunidad
-- ========================================
CREATE TABLE IF NOT EXISTS miembros_comunidad (
    id_miembro SERIAL PRIMARY KEY,
    comunidad_id INTEGER NOT NULL REFERENCES comunidades(id_comunidad) ON DELETE CASCADE,
    usuario_id INTEGER NOT NULL, -- Referencia a usuarios de auth-service
    rol_comunidad VARCHAR(20) NOT NULL DEFAULT 'miembro' CHECK (rol_comunidad IN ('profesor', 'miembro', 'moderador')),
    puntos_individuales INTEGER NOT NULL DEFAULT 0,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    fecha_union TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_expulsion TIMESTAMP,
    motivo_expulsion TEXT,
    CONSTRAINT miembros_comunidad_unique UNIQUE (comunidad_id, usuario_id),
    CONSTRAINT miembros_puntos_check CHECK (puntos_individuales >= 0)
);

-- Índices para miembros
CREATE INDEX IF NOT EXISTS idx_miembros_comunidad_id ON miembros_comunidad(comunidad_id);
CREATE INDEX IF NOT EXISTS idx_miembros_usuario_id ON miembros_comunidad(usuario_id);
CREATE INDEX IF NOT EXISTS idx_miembros_activo ON miembros_comunidad(activo);
CREATE INDEX IF NOT EXISTS idx_miembros_rol_comunidad ON miembros_comunidad(rol_comunidad);

-- ========================================
-- TABLA: Mensajes del Canal
-- ========================================
CREATE TABLE IF NOT EXISTS mensajes_canal (
    id_mensaje SERIAL PRIMARY KEY,
    comunidad_id INTEGER NOT NULL REFERENCES comunidades(id_comunidad) ON DELETE CASCADE,
    usuario_id INTEGER NOT NULL, -- Referencia a usuarios de auth-service
    contenido TEXT NOT NULL,
    fecha_envio TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    editado BOOLEAN NOT NULL DEFAULT FALSE,
    fecha_edicion TIMESTAMP,
    CONSTRAINT mensajes_contenido_length CHECK (LENGTH(contenido) BETWEEN 1 AND 2000)
);

-- Índices para mensajes
CREATE INDEX IF NOT EXISTS idx_mensajes_comunidad_id ON mensajes_canal(comunidad_id);
CREATE INDEX IF NOT EXISTS idx_mensajes_usuario_id ON mensajes_canal(usuario_id);
CREATE INDEX IF NOT EXISTS idx_mensajes_fecha_envio ON mensajes_canal(fecha_envio);

-- ========================================
-- TABLA: Recursos de Comunidad
-- ========================================
CREATE TABLE IF NOT EXISTS recursos_comunidad (
    id_recurso SERIAL PRIMARY KEY,
    comunidad_id INTEGER NOT NULL REFERENCES comunidades(id_comunidad) ON DELETE CASCADE,
    profesor_id INTEGER NOT NULL, -- Solo profesores pueden subir recursos
    nombre_archivo VARCHAR(255) NOT NULL,
    url_archivo VARCHAR(500) NOT NULL,
    tipo_archivo VARCHAR(50) NOT NULL DEFAULT 'application/pdf',
    tamano_bytes INTEGER NOT NULL,
    descripcion TEXT,
    fecha_subida TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT recursos_tamano_check CHECK (tamano_bytes > 0 AND tamano_bytes <= 10485760) -- Max 10MB
);

-- Índices para recursos
CREATE INDEX IF NOT EXISTS idx_recursos_comunidad_id ON recursos_comunidad(comunidad_id);
CREATE INDEX IF NOT EXISTS idx_recursos_profesor_id ON recursos_comunidad(profesor_id);
CREATE INDEX IF NOT EXISTS idx_recursos_fecha_subida ON recursos_comunidad(fecha_subida);

-- ========================================
-- TABLA: Desafíos Semanales
-- ========================================
CREATE TABLE IF NOT EXISTS desafios_semanales (
    id_desafio SERIAL PRIMARY KEY,
    comunidad_id INTEGER NOT NULL REFERENCES comunidades(id_comunidad) ON DELETE CASCADE,
    nombre VARCHAR(200) NOT NULL,
    descripcion TEXT,
    fecha_inicio TIMESTAMP NOT NULL,
    fecha_fin TIMESTAMP NOT NULL,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    completado BOOLEAN NOT NULL DEFAULT FALSE,
    fecha_creacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT desafios_fechas_check CHECK (fecha_fin > fecha_inicio)
);

-- Índices para desafíos
CREATE INDEX IF NOT EXISTS idx_desafios_comunidad_id ON desafios_semanales(comunidad_id);
CREATE INDEX IF NOT EXISTS idx_desafios_activo ON desafios_semanales(activo);
CREATE INDEX IF NOT EXISTS idx_desafios_fecha_inicio ON desafios_semanales(fecha_inicio);
CREATE INDEX IF NOT EXISTS idx_desafios_fecha_fin ON desafios_semanales(fecha_fin);

-- ========================================
-- TABLA: Invitaciones a Comunidad
-- ========================================
CREATE TABLE IF NOT EXISTS invitaciones_comunidad (
    id_invitacion SERIAL PRIMARY KEY,
    comunidad_id INTEGER NOT NULL REFERENCES comunidades(id_comunidad) ON DELETE CASCADE,
    profesor_id INTEGER NOT NULL, -- Quien envía la invitación
    estudiante_id INTEGER NOT NULL, -- Usuario invitado
    estado VARCHAR(20) NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'aceptada', 'rechazada', 'expirada')),
    fecha_invitacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_respuesta TIMESTAMP,
    CONSTRAINT invitaciones_unique UNIQUE (comunidad_id, estudiante_id)
);

-- Índices para invitaciones
CREATE INDEX IF NOT EXISTS idx_invitaciones_comunidad_id ON invitaciones_comunidad(comunidad_id);
CREATE INDEX IF NOT EXISTS idx_invitaciones_estudiante_id ON invitaciones_comunidad(estudiante_id);
CREATE INDEX IF NOT EXISTS idx_invitaciones_estado ON invitaciones_comunidad(estado);
CREATE INDEX IF NOT EXISTS idx_invitaciones_fecha ON invitaciones_comunidad(fecha_invitacion);

-- ========================================
-- TABLA: Amistades
-- ========================================
CREATE TABLE IF NOT EXISTS amistades (
    id_amistad SERIAL PRIMARY KEY,
    usuario_solicitante_id INTEGER NOT NULL,
    usuario_receptor_id INTEGER NOT NULL,
    estado VARCHAR(20) NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'aceptada', 'rechazada', 'bloqueada')),
    fecha_solicitud TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_respuesta TIMESTAMP,
    CONSTRAINT amistades_diferentes_usuarios CHECK (usuario_solicitante_id != usuario_receptor_id)
);

-- Índices para amistades
CREATE INDEX IF NOT EXISTS idx_amistades_solicitante ON amistades(usuario_solicitante_id);
CREATE INDEX IF NOT EXISTS idx_amistades_receptor ON amistades(usuario_receptor_id);
CREATE INDEX IF NOT EXISTS idx_amistades_estado ON amistades(estado);

-- ========================================
-- TABLA: Reportes de Comunidad
-- ========================================
CREATE TABLE IF NOT EXISTS reportes_comunidad (
    id_reporte SERIAL PRIMARY KEY,
    comunidad_id INTEGER NOT NULL REFERENCES comunidades(id_comunidad) ON DELETE CASCADE,
    usuario_reporta_id INTEGER NOT NULL, -- Usuario que hace el reporte
    tipo_reporte VARCHAR(50) NOT NULL CHECK (tipo_reporte IN ('spam', 'acoso', 'contenido_inapropiado', 'otro')),
    motivo TEXT NOT NULL,
    estado VARCHAR(20) NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'en_revision', 'resuelto', 'descartado')),
    fecha_reporte TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_resolucion TIMESTAMP,
    notas_admin TEXT
);

-- Índices para reportes
CREATE INDEX IF NOT EXISTS idx_reportes_comunidad_id ON reportes_comunidad(comunidad_id);
CREATE INDEX IF NOT EXISTS idx_reportes_usuario_reporta ON reportes_comunidad(usuario_reporta_id);
CREATE INDEX IF NOT EXISTS idx_reportes_estado ON reportes_comunidad(estado);
CREATE INDEX IF NOT EXISTS idx_reportes_fecha ON reportes_comunidad(fecha_reporte);

-- ========================================
-- FUNCIONES Y TRIGGERS
-- ========================================

-- Función para actualizar puntos de prestigio de la comunidad
CREATE OR REPLACE FUNCTION actualizar_puntos_comunidad()
RETURNS TRIGGER AS $$
BEGIN
    -- Cada mensaje suma 1 punto a la comunidad
    IF TG_OP = 'INSERT' AND TG_TABLE_NAME = 'mensajes_canal' THEN
        UPDATE comunidades 
        SET puntos_prestigio = puntos_prestigio + 1 
        WHERE id_comunidad = NEW.comunidad_id;
        RETURN NEW;
    END IF;
    
    -- Cada recurso suma 5 puntos
    IF TG_OP = 'INSERT' AND TG_TABLE_NAME = 'recursos_comunidad' THEN
        UPDATE comunidades 
        SET puntos_prestigio = puntos_prestigio + 5 
        WHERE id_comunidad = NEW.comunidad_id;
        RETURN NEW;
    END IF;
    
    -- Cada desafío completado suma 10 puntos
    IF TG_OP = 'UPDATE' AND TG_TABLE_NAME = 'desafios_semanales' THEN
        IF OLD.completado = FALSE AND NEW.completado = TRUE THEN
            UPDATE comunidades
            SET puntos_prestigio = puntos_prestigio + 10
            WHERE id_comunidad = NEW.comunidad_id;
        END IF;
        RETURN NEW;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para mensajes
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_puntos_mensajes') THEN
        CREATE TRIGGER trigger_puntos_mensajes
            AFTER INSERT ON mensajes_canal
            FOR EACH ROW
            EXECUTE FUNCTION actualizar_puntos_comunidad();
    END IF;
END
$$;

-- Trigger para recursos
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_puntos_recursos') THEN
        CREATE TRIGGER trigger_puntos_recursos
            AFTER INSERT ON recursos_comunidad
            FOR EACH ROW
            EXECUTE FUNCTION actualizar_puntos_comunidad();
    END IF;
END
$$;

-- Trigger para desafíos
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_puntos_desafios') THEN
        CREATE TRIGGER trigger_puntos_desafios
            AFTER UPDATE ON desafios_semanales
            FOR EACH ROW
            EXECUTE FUNCTION actualizar_puntos_comunidad();
    END IF;
END
$$;

-- Función para expirar invitaciones antiguas
CREATE OR REPLACE FUNCTION expirar_invitaciones_antiguas()
RETURNS void AS $$
BEGIN
    UPDATE invitaciones_comunidad
    SET estado = 'expirada'
    WHERE estado = 'pendiente'
    AND fecha_invitacion < CURRENT_TIMESTAMP - INTERVAL '7 days';
END;
$$ LANGUAGE plpgsql;

-- Función para limpiar datos antiguos
CREATE OR REPLACE FUNCTION limpiar_datos_antiguos()
RETURNS void AS $$
BEGIN
    -- Eliminar mensajes de comunidades inactivas de más de 6 meses
    DELETE FROM mensajes_canal
    WHERE comunidad_id IN (
        SELECT id_comunidad FROM comunidades 
        WHERE activa = FALSE 
        AND fecha_eliminacion < CURRENT_TIMESTAMP - INTERVAL '6 months'
    );
    
    -- Eliminar invitaciones expiradas de más de 30 días
    DELETE FROM invitaciones_comunidad
    WHERE estado IN ('expirada', 'rechazada')
    AND fecha_invitacion < CURRENT_TIMESTAMP - INTERVAL '30 days';
    
    -- Eliminar reportes resueltos de más de 90 días
    DELETE FROM reportes_comunidad
    WHERE estado IN ('resuelto', 'descartado')
    AND fecha_resolucion < CURRENT_TIMESTAMP - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- VISTAS
-- ========================================

-- Vista: Comunidades con estadísticas
CREATE OR REPLACE VIEW vista_comunidades_stats AS
SELECT 
    c.id_comunidad,
    c.nombre,
    c.descripcion,
    c.materia,
    c.profesor_id,
    c.puntos_prestigio,
    c.proximo_hito,
    c.es_publica,
    c.activa,
    c.fecha_creacion,
    COUNT(DISTINCT mc.usuario_id) FILTER (WHERE mc.activo = TRUE) AS total_miembros,
    COUNT(DISTINCT m.id_mensaje) AS total_mensajes,
    COUNT(DISTINCT r.id_recurso) AS total_recursos,
    COUNT(DISTINCT d.id_desafio) FILTER (WHERE d.activo = TRUE) AS desafios_activos,
    MAX(m.fecha_envio) AS ultimo_mensaje
FROM comunidades c
LEFT JOIN miembros_comunidad mc ON c.id_comunidad = mc.comunidad_id
LEFT JOIN mensajes_canal m ON c.id_comunidad = m.comunidad_id
LEFT JOIN recursos_comunidad r ON c.id_comunidad = r.comunidad_id
LEFT JOIN desafios_semanales d ON c.id_comunidad = d.comunidad_id
GROUP BY c.id_comunidad;

-- Vista: Miembros activos por comunidad
CREATE OR REPLACE VIEW vista_miembros_activos AS
SELECT 
    mc.comunidad_id,
    c.nombre AS nombre_comunidad,
    mc.usuario_id,
    mc.rol_comunidad,
    mc.puntos_individuales,
    mc.fecha_union,
    COUNT(m.id_mensaje) AS mensajes_enviados,
    MAX(m.fecha_envio) AS ultimo_mensaje
FROM miembros_comunidad mc
JOIN comunidades c ON mc.comunidad_id = c.id_comunidad
LEFT JOIN mensajes_canal m ON mc.usuario_id = m.usuario_id AND mc.comunidad_id = m.comunidad_id
WHERE mc.activo = TRUE AND c.activa = TRUE
GROUP BY mc.id_miembro, mc.comunidad_id, c.nombre, mc.usuario_id, mc.rol_comunidad, mc.puntos_individuales, mc.fecha_union
ORDER BY mc.comunidad_id, mc.puntos_individuales DESC;

-- Vista: Top comunidades por actividad
CREATE OR REPLACE VIEW vista_top_comunidades AS
SELECT 
    c.id_comunidad,
    c.nombre,
    c.materia,
    c.profesor_id,
    c.puntos_prestigio,
    COUNT(DISTINCT mc.usuario_id) FILTER (WHERE mc.activo = TRUE) AS miembros,
    COUNT(m.id_mensaje) AS mensajes_mes,
    COUNT(DISTINCT m.usuario_id) AS usuarios_activos_mes
FROM comunidades c
LEFT JOIN miembros_comunidad mc ON c.id_comunidad = mc.comunidad_id
LEFT JOIN mensajes_canal m ON c.id_comunidad = m.comunidad_id 
    AND m.fecha_envio >= CURRENT_TIMESTAMP - INTERVAL '30 days'
WHERE c.activa = TRUE AND c.es_publica = TRUE
GROUP BY c.id_comunidad
ORDER BY c.puntos_prestigio DESC, miembros DESC
LIMIT 50;

-- Vista: Invitaciones pendientes
CREATE OR REPLACE VIEW vista_invitaciones_pendientes AS
SELECT 
    i.id_invitacion,
    i.comunidad_id,
    c.nombre AS nombre_comunidad,
    c.descripcion,
    c.materia,
    i.profesor_id,
    i.estudiante_id,
    i.estado,
    i.fecha_invitacion,
    EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - i.fecha_invitacion)) / 3600 AS horas_desde_invitacion
FROM invitaciones_comunidad i
JOIN comunidades c ON i.comunidad_id = c.id_comunidad
WHERE i.estado = 'pendiente' AND c.activa = TRUE
ORDER BY i.fecha_invitacion DESC;

-- Vista: Reportes pendientes
CREATE OR REPLACE VIEW vista_reportes_pendientes AS
SELECT 
    r.id_reporte,
    r.comunidad_id,
    c.nombre AS nombre_comunidad,
    r.usuario_reporta_id,
    r.tipo_reporte,
    r.motivo,
    r.estado,
    r.fecha_reporte,
    EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - r.fecha_reporte)) / 3600 AS horas_desde_reporte
FROM reportes_comunidad r
JOIN comunidades c ON r.comunidad_id = c.id_comunidad
WHERE r.estado IN ('pendiente', 'en_revision')
ORDER BY r.fecha_reporte ASC;

-- ========================================
-- GRANTS DE PERMISOS
-- ========================================
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO community_user;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO community_user;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO community_user;

-- ========================================
-- INFORMACIÓN DEL SCHEMA
-- ========================================
SELECT 'Inicialización de Community DB completada' AS mensaje;

-- Estadísticas iniciales
SELECT 
    'comunidades' AS tabla,
    COUNT(*) AS total_registros
FROM comunidades
UNION ALL
SELECT 
    'miembros_comunidad' AS tabla,
    COUNT(*) AS total_registros
FROM miembros_comunidad
UNION ALL
SELECT 
    'mensajes_canal' AS tabla,
    COUNT(*) AS total_registros
FROM mensajes_canal
UNION ALL
SELECT 
    'recursos_comunidad' AS tabla,
    COUNT(*) AS total_registros
FROM recursos_comunidad
UNION ALL
SELECT 
    'desafios_semanales' AS tabla,
    COUNT(*) AS total_registros
FROM desafios_semanales;

-- Verificar tablas creadas
SELECT 
    table_name,
    pg_size_pretty(pg_total_relation_size(quote_ident(table_name)::regclass)) AS tamaño
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- Verificar índices creados
SELECT 
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- ========================================
-- DATOS DE PRUEBA (Opcional - Solo en desarrollo)
-- ========================================
-- Descomentar solo para desarrollo local

/*
-- Comunidad de ejemplo
INSERT INTO comunidades (nombre, descripcion, materia, profesor_id, puntos_prestigio, es_publica)
VALUES 
    ('Matemáticas Avanzadas', 'Comunidad para discutir cálculo y álgebra', 'Matemáticas', 1, 50, TRUE),
    ('Programación Web', 'Aprende desarrollo frontend y backend', 'Informática', 1, 100, TRUE),
    ('Física Cuántica', 'Comunidad privada de física avanzada', 'Física', 1, 25, FALSE);

-- Miembros de ejemplo
INSERT INTO miembros_comunidad (comunidad_id, usuario_id, rol_comunidad, puntos_individuales)
VALUES 
    (1, 1, 'profesor', 0),
    (1, 2, 'miembro', 10),
    (2, 1, 'profesor', 0);

-- Mensajes de ejemplo
INSERT INTO mensajes_canal (comunidad_id, usuario_id, contenido)
VALUES 
    (1, 1, '¡Bienvenidos a la comunidad de Matemáticas Avanzadas!'),
    (1, 2, 'Gracias profesor, tengo una duda sobre derivadas');
*/
