CREATE TABLE IF NOT EXISTS entries (
  id TEXT PRIMARY KEY,
  category TEXT NOT NULL,
  name TEXT NOT NULL,
  monogram TEXT NOT NULL,
  description TEXT NOT NULL,
  href TEXT,
  app_href TEXT,
  code TEXT,
  action_label TEXT NOT NULL,
  accent TEXT NOT NULL,
  tips_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  notice TEXT NOT NULL DEFAULT '',
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  last_verified_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS entries_category_enabled_sort_idx ON entries(category, enabled, sort_order);
CREATE INDEX IF NOT EXISTS entries_last_verified_at_idx ON entries(last_verified_at);

CREATE TABLE IF NOT EXISTS login_attempts (
  fingerprint TEXT PRIMARY KEY,
  failures INTEGER NOT NULL DEFAULT 0,
  locked_until TEXT,
  last_attempt_at TEXT NOT NULL
);
