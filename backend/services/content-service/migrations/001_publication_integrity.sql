ALTER TABLE IF EXISTS recursos
    ADD COLUMN IF NOT EXISTS checksum_sha256 VARCHAR(64) NULL,
    ADD COLUMN IF NOT EXISTS publicado BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS fecha_publicacion TIMESTAMP NULL,
    ADD COLUMN IF NOT EXISTS client_request_id UUID NULL,
    ADD COLUMN IF NOT EXISTS fuente_url VARCHAR(500) NULL,
    ADD COLUMN IF NOT EXISTS licencia VARCHAR(160) NULL,
    ADD COLUMN IF NOT EXISTS estado_editorial VARCHAR(20) NOT NULL DEFAULT 'pendiente',
    ADD COLUMN IF NOT EXISTS revisor_editorial_id INTEGER NULL,
    ADD COLUMN IF NOT EXISTS fecha_revision TIMESTAMP NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_recursos_client_request_id ON recursos(client_request_id) WHERE client_request_id IS NOT NULL;
CREATE TABLE IF NOT EXISTS content_outbox_events (
    event_id UUID PRIMARY KEY, event_type VARCHAR(120) NOT NULL, schema_version INTEGER NOT NULL,
    producer VARCHAR(80) NOT NULL, payload JSONB NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'published', 'failed')),
    attempts INTEGER NOT NULL DEFAULT 0, occurred_at TIMESTAMP NOT NULL, published_at TIMESTAMP NULL,
    last_error VARCHAR(500), created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_content_outbox_pending ON content_outbox_events(status, created_at) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_content_outbox_processing_recovery ON content_outbox_events(status, updated_at) WHERE status = 'processing';
