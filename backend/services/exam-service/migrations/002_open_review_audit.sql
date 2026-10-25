ALTER TABLE revision_respuestas_abiertas
    ADD COLUMN IF NOT EXISTS version INTEGER NOT NULL DEFAULT 1;

CREATE TABLE IF NOT EXISTS revision_respuestas_abiertas_audit (
    id_auditoria BIGSERIAL PRIMARY KEY,
    id_revision INTEGER NOT NULL REFERENCES revision_respuestas_abiertas(id_revision),
    version INTEGER NOT NULL,
    id_revisor INTEGER NOT NULL,
    puntaje INTEGER NOT NULL CHECK (puntaje BETWEEN 0 AND 5),
    feedback TEXT,
    fecha TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (id_revision, version)
);
