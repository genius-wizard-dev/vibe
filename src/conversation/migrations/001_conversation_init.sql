PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS conversations (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  created_by TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  metadata_json TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS participant_state (
  conversation_id TEXT NOT NULL,
  actor_id TEXT NOT NULL,
  actor_type TEXT NOT NULL,
  role TEXT NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 1,
  joined_at INTEGER NOT NULL,
  left_at INTEGER,
  updated_at INTEGER NOT NULL,
  PRIMARY KEY (conversation_id, actor_id, actor_type),
  FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  conversation_id TEXT NOT NULL,
  kind TEXT NOT NULL,
  actor_id TEXT NOT NULL,
  actor_type TEXT NOT NULL,
  body TEXT,
  metadata_json TEXT,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS message_mentions (
  message_id INTEGER NOT NULL,
  tool_name TEXT NOT NULL,
  mention_type TEXT NOT NULL DEFAULT 'tool',
  PRIMARY KEY (message_id, tool_name),
  FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS read_cursors (
  conversation_id TEXT NOT NULL,
  actor_id TEXT NOT NULL,
  actor_type TEXT NOT NULL,
  last_read_message_id INTEGER NOT NULL DEFAULT 0,
  updated_at INTEGER NOT NULL,
  PRIMARY KEY (conversation_id, actor_id, actor_type),
  FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS workflow_runs (
  run_id TEXT PRIMARY KEY,
  conversation_id TEXT NOT NULL,
  trigger_prompt TEXT NOT NULL,
  status TEXT NOT NULL,
  current_step TEXT,
  error_text TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS workflow_steps (
  run_id TEXT NOT NULL,
  step_no INTEGER NOT NULL,
  step_name TEXT NOT NULL,
  status TEXT NOT NULL,
  error_text TEXT,
  started_at INTEGER,
  ended_at INTEGER,
  PRIMARY KEY (run_id, step_no),
  FOREIGN KEY (run_id) REFERENCES workflow_runs(run_id) ON DELETE CASCADE
);
