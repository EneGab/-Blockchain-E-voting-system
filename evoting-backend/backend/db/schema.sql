-- db/schema.sql
-- Run automatically on first startup via database.js

-- ── Voters ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS voters (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  unique_id     TEXT    NOT NULL UNIQUE,   -- e.g. VT-4821A9
  full_name     TEXT    NOT NULL,
  email         TEXT    NOT NULL UNIQUE,
  password_hash TEXT    NOT NULL,
  has_voted     INTEGER NOT NULL DEFAULT 0, -- 0 = false, 1 = true
  created_at    TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- ── Candidates ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS candidates (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  name       TEXT    NOT NULL,
  party      TEXT,
  vote_count INTEGER NOT NULL DEFAULT 0,
  created_at TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- ── Votes (audit log) ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS votes (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  voter_id     INTEGER NOT NULL REFERENCES voters(id),
  candidate_id INTEGER NOT NULL REFERENCES candidates(id),
  vote_hash    TEXT    NOT NULL UNIQUE,  -- hash sent to blockchain
  tx_hash      TEXT,                     -- blockchain transaction hash
  created_at   TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- ── Admin ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS admins (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  username      TEXT    NOT NULL UNIQUE,
  password_hash TEXT    NOT NULL,
  created_at    TEXT    NOT NULL DEFAULT (datetime('now'))
);
