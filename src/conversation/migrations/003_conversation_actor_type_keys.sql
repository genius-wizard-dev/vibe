ALTER TABLE participant_state RENAME TO participant_state_old;

CREATE TABLE participant_state (
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

INSERT INTO participant_state (
  conversation_id,
  actor_id,
  actor_type,
  role,
  is_active,
  joined_at,
  left_at,
  updated_at
)
SELECT
  conversation_id,
  actor_id,
  actor_type,
  role,
  is_active,
  joined_at,
  left_at,
  updated_at
FROM participant_state_old;

DROP TABLE participant_state_old;

CREATE INDEX IF NOT EXISTS idx_participants_active
  ON participant_state (conversation_id, is_active, updated_at);

ALTER TABLE read_cursors RENAME TO read_cursors_old;

CREATE TABLE read_cursors (
  conversation_id TEXT NOT NULL,
  actor_id TEXT NOT NULL,
  actor_type TEXT NOT NULL,
  last_read_message_id INTEGER NOT NULL DEFAULT 0,
  updated_at INTEGER NOT NULL,
  PRIMARY KEY (conversation_id, actor_id, actor_type),
  FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
);

INSERT INTO read_cursors (
  conversation_id,
  actor_id,
  actor_type,
  last_read_message_id,
  updated_at
)
SELECT
  rc.conversation_id,
  rc.actor_id,
  COALESCE(ps.actor_type, 'agent') AS actor_type,
  rc.last_read_message_id,
  rc.updated_at
FROM read_cursors_old rc
LEFT JOIN (
  SELECT
    conversation_id,
    actor_id,
    MIN(actor_type) AS actor_type
  FROM participant_state
  GROUP BY conversation_id, actor_id
) ps
  ON ps.conversation_id = rc.conversation_id
 AND ps.actor_id = rc.actor_id;

DROP TABLE read_cursors_old;
