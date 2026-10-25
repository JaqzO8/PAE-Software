CREATE TABLE IF NOT EXISTS forum_threads (
 id SERIAL PRIMARY KEY, community_id INTEGER REFERENCES comunidades(id_comunidad), author_id INTEGER NOT NULL,
 title VARCHAR(160) NOT NULL, body TEXT NOT NULL, tags JSONB NOT NULL DEFAULT '[]',
 resolved BOOLEAN NOT NULL DEFAULT false, removed_at TIMESTAMPTZ, version INTEGER NOT NULL DEFAULT 1,
 created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS forum_threads_community ON forum_threads(community_id, id DESC);
CREATE TABLE IF NOT EXISTS forum_comments (
 id SERIAL PRIMARY KEY, thread_id INTEGER NOT NULL REFERENCES forum_threads(id), author_id INTEGER NOT NULL,
 body TEXT NOT NULL, client_id UUID NOT NULL, removed_at TIMESTAMPTZ,
 created_at TIMESTAMPTZ NOT NULL DEFAULT now(), UNIQUE(thread_id, author_id, client_id)
);
CREATE TABLE IF NOT EXISTS forum_likes (
 thread_id INTEGER NOT NULL REFERENCES forum_threads(id), user_id INTEGER NOT NULL,
 PRIMARY KEY(thread_id, user_id)
);
CREATE TABLE IF NOT EXISTS forum_reports (
 id SERIAL PRIMARY KEY, thread_id INTEGER NOT NULL REFERENCES forum_threads(id), reporter_id INTEGER NOT NULL,
 reason VARCHAR(1000) NOT NULL, status VARCHAR(20) NOT NULL DEFAULT 'pending', resolution VARCHAR(1000),
 resolved_by INTEGER, created_at TIMESTAMPTZ NOT NULL DEFAULT now(), resolved_at TIMESTAMPTZ,
 UNIQUE(thread_id, reporter_id)
);
CREATE TABLE IF NOT EXISTS forum_audit (
 id SERIAL PRIMARY KEY, thread_id INTEGER NOT NULL REFERENCES forum_threads(id), actor_id INTEGER NOT NULL,
 action VARCHAR(40) NOT NULL, reason VARCHAR(1000) NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
