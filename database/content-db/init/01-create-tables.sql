-- database/content-db/init/01_schema.sql

-- ========================================
-- TABLA: CATEGORÍAS
-- ========================================
CREATE TABLE IF NOT EXISTS categorias (
    id_categoria SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE,
    slug VARCHAR(100) NOT NULL UNIQUE,
    descripcion TEXT,
    icono VARCHAR(50),
    activa BOOLEAN NOT NULL DEFAULT TRUE,
    fecha_creacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ========================================
-- TABLA: TAGS
-- ========================================
CREATE TABLE IF NOT EXISTS tags (
    id_tag SERIAL PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL,
    slug VARCHAR(50) NOT NULL UNIQUE,
    cantidad_uso INTEGER NOT NULL DEFAULT 0,
    fecha_creacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ========================================
-- TABLA: REPOSITORIOS
-- ========================================
CREATE TABLE IF NOT EXISTS repositorios (
    id_repositorio SERIAL PRIMARY KEY,
    id_profesor INTEGER NOT NULL,
    titulo VARCHAR(200) NOT NULL,
    descripcion TEXT,
    portada VARCHAR(255),
    id_categoria INTEGER REFERENCES categorias(id_categoria) ON DELETE SET NULL,
    publico BOOLEAN NOT NULL DEFAULT TRUE,
    destacado BOOLEAN NOT NULL DEFAULT FALSE,
    fecha_creacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP,
    cantidad_vistas INTEGER NOT NULL DEFAULT 0,
    cantidad_descargas INTEGER NOT NULL DEFAULT 0,
    rating_promedio DECIMAL(3,2) NOT NULL DEFAULT 0.00 CHECK (rating_promedio >= 0 AND rating_promedio <= 10),
    activo BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE INDEX idx_repositorios_profesor ON repositorios(id_profesor);
CREATE INDEX idx_repositorios_categoria ON repositorios(id_categoria);
CREATE INDEX idx_repositorios_publico ON repositorios(publico);
CREATE INDEX idx_repositorios_destacado ON repositorios(destacado);
CREATE INDEX idx_repositorios_vistas ON repositorios(cantidad_vistas);
CREATE INDEX idx_repositorios_descargas ON repositorios(cantidad_descargas);
CREATE INDEX idx_repositorios_rating ON repositorios(rating_promedio);
CREATE INDEX idx_repositorios_activo ON repositorios(activo);

-- ========================================
-- TABLA: RECURSOS
-- ========================================
CREATE TABLE IF NOT EXISTS recursos (
    id_recurso SERIAL PRIMARY KEY,
    id_repositorio INTEGER NOT NULL REFERENCES repositorios(id_repositorio) ON DELETE CASCADE,
    titulo VARCHAR(200) NOT NULL,
    descripcion TEXT,
    tipo_recurso VARCHAR(50) NOT NULL CHECK (tipo_recurso IN ('pdf', 'video', 'audio', 'imagen', 'enlace', 'otro')),
    url_archivo VARCHAR(500),
    url_externa VARCHAR(500),
    tamaño_archivo BIGINT,
    extension VARCHAR(10),
    orden INTEGER NOT NULL DEFAULT 0,
    descargas INTEGER NOT NULL DEFAULT 0,
    fecha_subida TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    activo BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE INDEX idx_recursos_repositorio ON recursos(id_repositorio);
CREATE INDEX idx_recursos_tipo ON recursos(tipo_recurso);
CREATE INDEX idx_recursos_activo ON recursos(activo);
CREATE INDEX idx_recursos_orden ON recursos(orden);

-- ========================================
-- TABLA: FAVORITOS
-- ========================================
CREATE TABLE IF NOT EXISTS favoritos (
    id_favorito SERIAL PRIMARY KEY,
    id_usuario INTEGER NOT NULL,
    id_repositorio INTEGER NOT NULL REFERENCES repositorios(id_repositorio) ON DELETE CASCADE,
    fecha_creacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(id_usuario, id_repositorio)
);

CREATE INDEX idx_favoritos_usuario ON favoritos(id_usuario);
CREATE INDEX idx_favoritos_repositorio ON favoritos(id_repositorio);

-- ========================================
-- TABLA: CALIFICACIONES
-- ========================================
CREATE TABLE IF NOT EXISTS calificaciones (
    id_calificacion SERIAL PRIMARY KEY,
    id_usuario INTEGER NOT NULL,
    id_repositorio INTEGER NOT NULL REFERENCES repositorios(id_repositorio) ON DELETE CASCADE,
    puntuacion INTEGER NOT NULL CHECK (puntuacion >= 1 AND puntuacion <= 10),
    comentario TEXT,
    fecha_creacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP,
    UNIQUE(id_usuario, id_repositorio)
);

CREATE INDEX idx_calificaciones_usuario ON calificaciones(id_usuario);
CREATE INDEX idx_calificaciones_repositorio ON calificaciones(id_repositorio);

-- ========================================
-- TABLA: REPOSITORIO_TAGS (Relación Many-to-Many)
-- ========================================
CREATE TABLE IF NOT EXISTS repositorio_tags (
    id SERIAL PRIMARY KEY,
    id_repositorio INTEGER NOT NULL REFERENCES repositorios(id_repositorio) ON DELETE CASCADE,
    id_tag INTEGER NOT NULL REFERENCES tags(id_tag) ON DELETE CASCADE,
    UNIQUE(id_repositorio, id_tag)
);

CREATE INDEX idx_repositorio_tags_repo ON repositorio_tags(id_repositorio);
CREATE INDEX idx_repositorio_tags_tag ON repositorio_tags(id_tag);

-- ========================================
-- TRIGGER: Actualizar rating promedio automáticamente
-- ========================================
CREATE OR REPLACE FUNCTION actualizar_rating_promedio()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE repositorios
    SET rating_promedio = (
        SELECT ROUND(AVG(puntuacion)::numeric, 2)
        FROM calificaciones
        WHERE id_repositorio = COALESCE(NEW.id_repositorio, OLD.id_repositorio)
    )
    WHERE id_repositorio = COALESCE(NEW.id_repositorio, OLD.id_repositorio);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_actualizar_rating
AFTER INSERT OR UPDATE OR DELETE ON calificaciones
FOR EACH ROW
EXECUTE FUNCTION actualizar_rating_promedio();

-- ========================================
-- TRIGGER: Actualizar fecha de actualización
-- ========================================
CREATE OR REPLACE FUNCTION actualizar_fecha_actualizacion()
RETURNS TRIGGER AS $$
BEGIN
    NEW.fecha_actualizacion = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_fecha_actualizacion_repositorios
BEFORE UPDATE ON repositorios
FOR EACH ROW
EXECUTE FUNCTION actualizar_fecha_actualizacion();

CREATE TRIGGER trigger_fecha_actualizacion_calificaciones
BEFORE UPDATE ON calificaciones
FOR EACH ROW
EXECUTE FUNCTION actualizar_fecha_actualizacion();