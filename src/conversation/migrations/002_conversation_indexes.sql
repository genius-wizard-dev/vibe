CREATE INDEX IF NOT EXISTS idx_messages_conv_id_id
  ON messages (conversation_id, id);

CREATE INDEX IF NOT EXISTS idx_messages_conv_created
  ON messages (conversation_id, created_at);

CREATE INDEX IF NOT EXISTS idx_mentions_tool
  ON message_mentions (tool_name, message_id);

CREATE INDEX IF NOT EXISTS idx_participants_active
  ON participant_state (conversation_id, is_active, updated_at);

CREATE INDEX IF NOT EXISTS idx_workflow_runs_conversation
  ON workflow_runs (conversation_id, updated_at);
