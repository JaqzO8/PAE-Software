CREATE SCHEMA IF NOT EXISTS gamification;
CREATE TABLE gamification.rules (
    rule_id text NOT NULL, version integer NOT NULL CHECK (version > 0), fingerprint text NOT NULL,
    PRIMARY KEY (rule_id, version)
);
CREATE TABLE gamification.inbox (
    event_id uuid PRIMARY KEY, fingerprint text NOT NULL, received_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE gamification.ledger (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    event_id uuid NOT NULL REFERENCES gamification.inbox(event_id),
    user_id text NOT NULL, source_type text NOT NULL, source_id text NOT NULL,
    rule_id text NOT NULL, rule_version integer NOT NULL, points integer NOT NULL CHECK (points BETWEEN 0 AND 10000),
    created_at timestamptz NOT NULL DEFAULT now(),
    FOREIGN KEY (rule_id, rule_version) REFERENCES gamification.rules(rule_id, version),
    UNIQUE (source_type, source_id, user_id, rule_id, rule_version)
);
CREATE INDEX ledger_user_id ON gamification.ledger(user_id);
CREATE TABLE gamification.balances (
    user_id text PRIMARY KEY, points bigint NOT NULL CHECK (points >= 0)
);
CREATE TABLE gamification.outbox (
    event_id uuid PRIMARY KEY, payload jsonb NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(), published_at timestamptz,
    attempts integer NOT NULL DEFAULT 0 CHECK (attempts >= 0), last_error text
);
CREATE INDEX outbox_pending ON gamification.outbox(created_at) WHERE published_at IS NULL;
