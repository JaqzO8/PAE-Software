CREATE SCHEMA IF NOT EXISTS planning;

CREATE TABLE planning.preferences (
    user_id bigint PRIMARY KEY,
    preferred_days smallint[] NOT NULL DEFAULT ARRAY[1,2,3,4,5],
    start_time time NOT NULL DEFAULT '18:00',
    end_time time NOT NULL DEFAULT '21:00',
    subjects text[] NOT NULL DEFAULT ARRAY['General'],
    reminders_enabled boolean NOT NULL DEFAULT true,
    time_zone text NOT NULL DEFAULT 'America/Lima',
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE planning.reminders (
    id bigserial PRIMARY KEY,
    user_id bigint NOT NULL,
    title text NOT NULL,
    subject text,
    scheduled_at timestamptz NOT NULL,
    duration_minutes integer NOT NULL CHECK (duration_minutes BETWEEN 10 AND 240),
    status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','claimed','sent','failed','cancelled')),
    origin text NOT NULL DEFAULT 'manual',
    worker_id text,
    claimed_at timestamptz,
    delivered_at timestamptz,
    delivery_error text,
    created_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (user_id, scheduled_at, title)
);
CREATE INDEX planning_reminders_due ON planning.reminders(status, scheduled_at);
CREATE INDEX planning_reminders_user ON planning.reminders(user_id, scheduled_at);

CREATE TABLE planning.missions (
    mission_id text PRIMARY KEY,
    user_id bigint NOT NULL,
    mission_date date NOT NULL,
    lesson_ids bigint[] NOT NULL,
    question_count integer NOT NULL CHECK (question_count BETWEEN 1 AND 20),
    status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','completed')),
    completed_at timestamptz,
    UNIQUE (user_id, mission_date)
);
