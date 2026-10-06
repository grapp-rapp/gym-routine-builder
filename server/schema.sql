CREATE TABLE IF NOT EXISTS gym_members (
  id text PRIMARY KEY, data jsonb NOT NULL, revision integer NOT NULL DEFAULT 1,
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS gym_routines (
  token_hash text PRIMARY KEY, snapshot jsonb NOT NULL, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS gym_login_attempts (
  id text PRIMARY KEY, attempts integer NOT NULL, started_at timestamptz NOT NULL
);
