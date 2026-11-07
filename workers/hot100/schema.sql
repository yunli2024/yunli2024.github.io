CREATE TABLE IF NOT EXISTS login_attempts (
  state TEXT PRIMARY KEY,
  verifier TEXT NOT NULL,
  challenge TEXT NOT NULL,
  expires INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS login_tickets (
  digest TEXT PRIMARY KEY,
  challenge TEXT NOT NULL,
  account TEXT NOT NULL,
  login TEXT NOT NULL,
  expires INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS sessions (
  digest TEXT PRIMARY KEY,
  account TEXT NOT NULL,
  login TEXT NOT NULL,
  expires INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS progress (
  account TEXT PRIMARY KEY,
  revision INTEGER NOT NULL DEFAULT 0,
  document TEXT NOT NULL,
  write_id TEXT NOT NULL DEFAULT ''
);
CREATE TABLE IF NOT EXISTS applied_edits (
  account TEXT NOT NULL,
  uid TEXT NOT NULL,
  PRIMARY KEY (account, uid)
);
CREATE TABLE IF NOT EXISTS statement_cache (
  account TEXT NOT NULL,
  question_id INTEGER NOT NULL,
  language TEXT NOT NULL,
  html TEXT NOT NULL,
  source_url TEXT NOT NULL,
  source_sha TEXT NOT NULL,
  fetched_at INTEGER NOT NULL,
  PRIMARY KEY (account, question_id, language)
);
