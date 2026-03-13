export function normalizeToolName(value) {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9._-]/g, "");
}

function parseCsvMentions(rawValue) {
  if (!rawValue) return [];

  return rawValue
    .split(",")
    .map((item) => normalizeToolName(item))
    .filter(Boolean);
}

function parseInlineMentions(messageText) {
  if (!messageText) return [];

  const matches = messageText.matchAll(/@([a-zA-Z0-9._-]+)/g);
  const tools = [];
  for (const match of matches) {
    const tool = normalizeToolName(match[1] || "");
    if (tool) tools.push(tool);
  }

  return tools;
}

export function collectToolMentions({ messageText, mentionCsv }) {
  const set = new Set();
  for (const tool of parseCsvMentions(mentionCsv)) set.add(tool);
  for (const tool of parseInlineMentions(messageText)) set.add(tool);
  return Array.from(set);
}
