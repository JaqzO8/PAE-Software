CREATE TABLE IF NOT EXISTS planning.pomodoro_sessions (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    previous_state VARCHAR(20) NOT NULL,
    current_state VARCHAR(20) NOT NULL,
    action VARCHAR(20) NOT NULL,
    seconds_elapsed INTEGER NOT NULL DEFAULT 0 CHECK (seconds_elapsed >= 0),
    occurred_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_planning_pomodoro_user_occurred
    ON planning.pomodoro_sessions(user_id, occurred_at DESC);
