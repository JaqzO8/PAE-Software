-- Preserve every invitation issuance; retain closed rows and their original IDs.
DO $$ BEGIN
  IF to_regclass('public.invitaciones_comunidad') IS NOT NULL THEN
    ALTER TABLE invitaciones_comunidad DROP CONSTRAINT IF EXISTS invitaciones_comunidad_comunidad_id_estudiante_id_key;
    ALTER TABLE invitaciones_comunidad DROP CONSTRAINT IF EXISTS invitaciones_unique;
    ALTER TABLE invitaciones_comunidad DROP CONSTRAINT IF EXISTS invitaciones_comunidad_estado_check;
    ALTER TABLE invitaciones_comunidad ADD CONSTRAINT invitaciones_comunidad_estado_check CHECK (estado IN ('pendiente', 'aceptada', 'rechazada', 'expirada', 'revocada'));
    DROP INDEX IF EXISTS invitaciones_comunidad_comunidad_id_estudiante_id;
    CREATE UNIQUE INDEX IF NOT EXISTS invitation_pending_recipient
      ON invitaciones_comunidad (comunidad_id, estudiante_id) WHERE estado = 'pendiente';
  END IF;
  IF to_regclass('public.amistades') IS NOT NULL THEN
    ALTER TABLE amistades DROP CONSTRAINT IF EXISTS amistades_estado_check;
    ALTER TABLE amistades ADD CONSTRAINT amistades_estado_check CHECK (estado IN ('pendiente', 'aceptada', 'rechazada', 'bloqueada', 'cancelada', 'eliminada'));
  END IF;
  IF to_regclass('public.mensajes_canal') IS NOT NULL THEN
    ALTER TABLE mensajes_canal ADD COLUMN IF NOT EXISTS client_id UUID;
    ALTER TABLE mensajes_canal ADD COLUMN IF NOT EXISTS request_hash VARCHAR(64);
    ALTER TABLE mensajes_canal ADD COLUMN IF NOT EXISTS version INTEGER NOT NULL DEFAULT 1;
    ALTER TABLE mensajes_canal ADD COLUMN IF NOT EXISTS fecha_eliminacion TIMESTAMPTZ;
    ALTER TABLE mensajes_canal ADD COLUMN IF NOT EXISTS eliminado_por INTEGER;
    ALTER TABLE mensajes_canal ADD COLUMN IF NOT EXISTS motivo_eliminacion VARCHAR(1000);
    CREATE UNIQUE INDEX IF NOT EXISTS message_client_request
      ON mensajes_canal (comunidad_id, usuario_id, client_id);
  END IF;
END $$;
