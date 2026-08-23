-- Canonical schema for the tasks table.
-- Postgres runs every .sql file in /docker-entrypoint-initdb.d ONCE, the first
-- time the data volume is created. That is why this is safe to keep simple.

CREATE TABLE IF NOT EXISTS tasks (
    id    SERIAL PRIMARY KEY,
    title TEXT    NOT NULL,
    done  BOOLEAN NOT NULL DEFAULT FALSE
);
