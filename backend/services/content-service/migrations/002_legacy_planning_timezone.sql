ALTER TABLE IF EXISTS study_preferences
    ADD COLUMN IF NOT EXISTS zona_horaria VARCHAR(64) NOT NULL DEFAULT 'America/Lima';
