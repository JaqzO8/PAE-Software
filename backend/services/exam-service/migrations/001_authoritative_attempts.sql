ALTER TABLE simulacro_intentos
    ADD COLUMN IF NOT EXISTS preguntas_snapshot JSONB,
    ADD COLUMN IF NOT EXISTS fecha_limite TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS clave_idempotencia VARCHAR(128),
    ADD COLUMN IF NOT EXISTS hash_solicitud CHAR(64),
    ADD COLUMN IF NOT EXISTS resultado_confirmado JSONB;

CREATE UNIQUE INDEX IF NOT EXISTS simulacro_intentos_idempotency
    ON simulacro_intentos (id_intento, clave_idempotencia)
    WHERE clave_idempotencia IS NOT NULL;

CREATE TABLE IF NOT EXISTS exam_outbox (
    event_id UUID PRIMARY KEY,
    aggregate_id VARCHAR(100) NOT NULL,
    event_type VARCHAR(120) NOT NULL,
    payload JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    published_at TIMESTAMPTZ,
    attempts INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS exam_outbox_pending
    ON exam_outbox (created_at) WHERE published_at IS NULL;
