import fs from "fs";
import path from "path";

// Agent registry manages local agent profiles under `.vibe/agents`.
// It also keeps compatibility with the legacy `.vibe/agenst` path.

const AGENTS_ROOT_NAME = "agents";
const LEGACY_AGENTS_ROOT_NAME = "agenst";

export const AGENT_RUNTIMES = {
  opencode: {
    label: "OpenCode",
    command: "opencode",
    mode: "stdin",
    args: [],
  },
  claude: {
    label: "Claude Code",
    command: "claude",
    mode: "stdin",
    args: [],
  },
  codex: {
    label: "Codex CLI",
    command: "codex",
    mode: "stdin",
    args: [],
  },
  gemini: {
    label: "Gemini CLI",
    command: "gemini",
    mode: "stdin",
    args: [],
  },
  kirocli: {
    label: "Kiro CLI",
    command: "kiro",
    mode: "stdin",
    args: [],
  },
};

const DEFAULT_AGENT_RUNTIME = "opencode";

/**
 * Normalizes user-provided names/keywords into stable slugs.
 */
export function toSlug(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function ensureFile(filePath, content) {
  if (fs.existsSync(filePath)) return;
  fs.writeFileSync(filePath, content, "utf8");
}

function walkMarkdownFiles(rootDir) {
  if (!fs.existsSync(rootDir)) return [];

  const output = [];
  const stack = [rootDir];

  while (stack.length > 0) {
    const current = stack.pop();
    const entries = fs.readdirSync(current, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        stack.push(fullPath);
        continue;
      }
      if (entry.isFile() && entry.name.endsWith(".md")) {
        output.push(fullPath);
      }
    }
  }

  return output;
}

function parseSkillsCsv(input) {
  if (!input) return [];

  return Array.from(
    new Set(
      input
        .split(",")
        .map((item) => toSlug(item))
        .filter(Boolean),
    ),
  );
}

function defaultOverviewContent() {
  return `## Agent Summary

- mission: local multi-agent collaboration for CLI workflows
- profile source: .vibe/agents/<agent>/profile.json
- skill source: .agents/skills

## Agents

| agent | runtime | role | updated_at | brain |
| --- | --- | --- | --- | --- |
`;
}

function upsertOverviewRow(overviewPath, rowData) {
  const content = fs.readFileSync(overviewPath, "utf8");
  const lines = content.split("\n");
  const row = `| ${rowData.agent} | ${rowData.runtime} | ${rowData.role} | ${rowData.updatedAt} | ${rowData.brainPath} |`;
  const rowPattern = new RegExp(`^\\|\\s*${rowData.agent}\\s*\\|`);

  const existingIndex = lines.findIndex((line) => rowPattern.test(line));
  if (existingIndex >= 0) {
    lines[existingIndex] = row;
  } else {
    lines.push(row);
  }

  fs.writeFileSync(overviewPath, `${lines.join("\n").replace(/\n*$/, "\n")}`, "utf8");
}

/**
 * Returns the canonical agents root, with fallback to legacy folder when present.
 */
export function resolveAgentsRoot(cwd = process.cwd()) {
  const preferred = path.join(cwd, ".vibe", AGENTS_ROOT_NAME);
  if (fs.existsSync(preferred)) return preferred;

  const legacy = path.join(cwd, ".vibe", LEGACY_AGENTS_ROOT_NAME);
  if (fs.existsSync(legacy)) return legacy;

  return preferred;
}

/**
 * Ensures canonical and legacy agent directories/files exist.
 */
export function ensureAgentsWorkspace(cwd = process.cwd()) {
  const preferredRoot = path.join(cwd, ".vibe", AGENTS_ROOT_NAME);
  const legacyRoot = path.join(cwd, ".vibe", LEGACY_AGENTS_ROOT_NAME);

  fs.mkdirSync(preferredRoot, { recursive: true });
  fs.mkdirSync(legacyRoot, { recursive: true });

  ensureFile(path.join(preferredRoot, "overview.md"), defaultOverviewContent());
  ensureFile(path.join(preferredRoot, "active.md"), "");

  ensureFile(
    path.join(legacyRoot, "README.md"),
    "# legacy agents path\n\nUse `.vibe/agents/` as the canonical location.\n",
  );

  const existingAgents = fs
    .readdirSync(preferredRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .filter((name) => !name.startsWith("."));

  for (const name of existingAgents) {
    const canonicalDir = path.join(preferredRoot, name);
    const legacyAgentDir = path.join(legacyRoot, name);
    if (fs.existsSync(legacyAgentDir)) continue;

    try {
      const rel = path.relative(path.dirname(legacyAgentDir), canonicalDir);
      fs.symlinkSync(rel, legacyAgentDir, "dir");
    } catch {
      // best effort compatibility path
    }
  }

  return preferredRoot;
}

/**
 * Resolves skill markdown references for the provided skill keywords.
 */
export function findSkillRefs(cwd, skills) {
  if (!skills || skills.length === 0) return [];

  const normalizedSkills = new Set(skills.map((skill) => toSlug(skill)));
  const skillsRoot = path.join(cwd, ".agents", "skills");
  const files = walkMarkdownFiles(skillsRoot);

  const refs = [];
  for (const filePath of files) {
    const basename = path.basename(filePath, ".md").toLowerCase();
    for (const skill of normalizedSkills) {
      if (!skill) continue;
      if (!basename.includes(skill)) continue;

      const rel = path.relative(cwd, filePath).replace(/\\/g, "/");
      refs.push(rel);
      break;
    }
  }

  return refs.sort();
}

function buildBrainContent({
  agent,
  role,
  runtime,
  goal,
  skills,
  skillRefs,
  createdAt,
}) {
  const skillList = skills.length > 0 ? skills.map((item) => `- ${item}`).join("\n") : "- none";
  const refsList =
    skillRefs.length > 0 ? skillRefs.map((item) => `- ${item}`).join("\n") : "- none";

  return `# ${agent} brain

created_at: ${createdAt}
runtime: ${runtime}
role: ${role}

## mission

${goal}

## thinking model

1. clarify the problem and constraints
2. propose a practical plan
3. execute with minimal complexity
4. report status and risks explicitly

## primary skills

${skillList}

## skill references (.agents/skills)

${refsList}

## collaboration rules

- stay within assigned role and scope
- reference tools as @tool when relevant
- leave clear handoff notes for other agents
- provide concrete next actions
`;
}

function ensureTrailingNewline(text) {
  return `${String(text || "").replace(/\n*$/, "")}
`;
}

function formatBulletList(items) {
  if (!Array.isArray(items) || items.length === 0) return "- none";
  return items.map((item) => `- ${item}`).join("\n");
}

function upsertMetadataLine(content, key, value) {
  const safeValue = String(value ?? "").trim() || "-";
  const line = `${key}: ${safeValue}`;
  const lineRegex = new RegExp(`^${key}:\\s*.*$`, "m");

  if (lineRegex.test(content)) {
    return content.replace(lineRegex, line);
  }

  if (/^created_at:\s*.*$/m.test(content)) {
    return content.replace(/^created_at:\s*.*$/m, (matched) => `${matched}\n${line}`);
  }

  if (/^#\s+.+$/m.test(content)) {
    return content.replace(/^#\s+.+$/m, (matched) => `${matched}\n\n${line}`);
  }

  return `${line}\n${content}`;
}

function escapeRegExp(input) {
  return String(input).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function replaceSection(content, heading, body) {
  const escaped = escapeRegExp(heading);
  const sectionRegex = new RegExp(`(^## ${escaped}\\n\\n)([\\s\\S]*?)(?=\\n## |$)`, "m");

  if (sectionRegex.test(content)) {
    return content.replace(sectionRegex, `$1${body}\n`);
  }

  const normalized = ensureTrailingNewline(content).replace(/\n$/, "");
  return `${normalized}\n\n## ${heading}\n\n${body}\n`;
}

function syncBrainMetadataFile(brainPath, profile) {
  const createdAt = profile.created_at || new Date().toISOString();
  const role = profile.role || "specialist";
  const runtime = profile.runtime || DEFAULT_AGENT_RUNTIME;
  const goal =
    profile.goal ||
    "Analyze assigned topic and collaborate with other agents to reach practical decisions.";
  const skills = Array.isArray(profile.skills) ? profile.skills : [];
  const skillRefs = Array.isArray(profile.skill_refs) ? profile.skill_refs : [];

  let content = fs.existsSync(brainPath)
    ? fs.readFileSync(brainPath, "utf8")
    : buildBrainContent({
        agent: profile.name || path.basename(path.dirname(brainPath)),
        role,
        runtime,
        goal,
        skills,
        skillRefs,
        createdAt,
      });

  content = upsertMetadataLine(content, "runtime", runtime);
  content = upsertMetadataLine(content, "role", role);
  content = replaceSection(content, "primary skills", formatBulletList(skills));
  content = replaceSection(
    content,
    "skill references (.agents/skills)",
    formatBulletList(skillRefs),
  );

  fs.writeFileSync(brainPath, ensureTrailingNewline(content), "utf8");
}

function parseArgsTemplate(rawValue) {
  if (!rawValue) return null;
  const input = rawValue.trim();
  if (!input) return null;

  if (input.startsWith("[")) {
    try {
      const parsed = JSON.parse(input);
      if (Array.isArray(parsed)) {
        return parsed.map((item) => String(item));
      }
    } catch {
      // fallback below
    }
  }

  return input.split(/\s+/).filter(Boolean);
}

function runtimeDefault(runtime) {
  return AGENT_RUNTIMES[runtime] || AGENT_RUNTIMES[DEFAULT_AGENT_RUNTIME];
}

function normalizeMode(mode) {
  if (!mode) return null;
  if (mode !== "stdin" && mode !== "arg") {
    throw new Error(`Invalid mode: ${mode}. Expected stdin or arg`);
  }
  return mode;
}

function normalizeTimeout(value) {
  if (value === undefined || value === null || value === "") return null;
  const parsed = Number.parseInt(String(value), 10);
  if (Number.isNaN(parsed) || parsed <= 0) {
    throw new Error(`Invalid timeout: ${value}`);
  }
  return parsed;
}

function syncLegacyAgentEntry(cwd, slug, agentDir) {
  const legacyAgentDir = path.join(cwd, ".vibe", LEGACY_AGENTS_ROOT_NAME, slug);

  try {
    if (fs.existsSync(legacyAgentDir)) {
      fs.rmSync(legacyAgentDir, { recursive: true, force: true });
    }
    const rel = path.relative(path.dirname(legacyAgentDir), agentDir);
    fs.symlinkSync(rel, legacyAgentDir, "dir");
  } catch {
    fs.mkdirSync(legacyAgentDir, { recursive: true });
    fs.writeFileSync(
      path.join(legacyAgentDir, "README.md"),
      `Use canonical agent folder: ${path.relative(legacyAgentDir, agentDir).replace(/\\/g, "/")}\n`,
      "utf8",
    );
  }
}

/**
 * Creates a new agent folder with profile/brain/memory defaults.
 */
export function createAgentDefinition(cwd, {
  name,
  runtime,
  role,
  goal,
  skillsCsv,
  command,
  mode,
  argsTemplate,
}) {
  const slug = toSlug(name || "");
  if (!slug) {
    throw new Error("Missing or invalid agent name");
  }

  const root = ensureAgentsWorkspace(cwd);
  const agentDir = path.join(root, slug);
  if (fs.existsSync(agentDir)) {
    throw new Error(`Agent already exists: ${slug}`);
  }

  const runtimeKey = runtime && AGENT_RUNTIMES[runtime] ? runtime : DEFAULT_AGENT_RUNTIME;
  const runtimeCfg = runtimeDefault(runtimeKey);
  const createdAt = new Date().toISOString();

  const skills = parseSkillsCsv(skillsCsv);
  const skillRefs = findSkillRefs(cwd, skills);
  const executorArgs = parseArgsTemplate(argsTemplate) || runtimeCfg.args;
  const executorMode = mode || runtimeCfg.mode;

  const profile = {
    name: slug,
    runtime: runtimeKey,
    role: role || "specialist",
    goal:
      goal ||
      "Analyze assigned topic and collaborate with other agents to reach practical decisions.",
    skills,
    skill_refs: skillRefs,
    executor: {
      command: command || runtimeCfg.command,
      mode: executorMode,
      args: executorArgs,
      timeout_ms: 45000,
    },
    created_at: createdAt,
    updated_at: createdAt,
  };

  fs.mkdirSync(agentDir, { recursive: true });
  fs.writeFileSync(
    path.join(agentDir, "profile.json"),
    `${JSON.stringify(profile, null, 2)}\n`,
    "utf8",
  );
  fs.writeFileSync(
    path.join(agentDir, "brain.md"),
    buildBrainContent({
      agent: slug,
      role: profile.role,
      runtime: profile.runtime,
      goal: profile.goal,
      skills: profile.skills,
      skillRefs: profile.skill_refs,
      createdAt,
    }),
    "utf8",
  );
  fs.writeFileSync(
    path.join(agentDir, "memory.md"),
    `# ${slug} memory\n\n- created_at: ${createdAt}\n- notes: \n`,
    "utf8",
  );

  syncLegacyAgentEntry(cwd, slug, agentDir);

  const activeFile = path.join(root, "active.md");
  fs.writeFileSync(activeFile, `${slug}\n`, "utf8");

  const overviewFile = path.join(root, "overview.md");
  upsertOverviewRow(overviewFile, {
    agent: slug,
    runtime: profile.runtime,
    role: profile.role,
    updatedAt: createdAt,
    brainPath: `.vibe/agents/${slug}/brain.md`,
  });

  return {
    root,
    agentDir,
    profile,
  };
}

/**
 * Updates an existing agent profile and optional brain metadata.
 */
export function updateAgentDefinition(cwd, {
  name,
  runtime,
  role,
  goal,
  skillsCsv,
  command,
  mode,
  argsTemplate,
  timeoutMs,
  syncBrain = false,
}) {
  const slug = toSlug(name || "");
  if (!slug) {
    throw new Error("Missing or invalid agent name");
  }

  const found = loadAgentDefinition(cwd, slug);
  if (!found) {
    throw new Error(`Agent not found: ${slug}`);
  }

  const existing = found.profile || {};
  const existingExecutor = existing.executor || {};

  const runtimeKey =
    runtime && AGENT_RUNTIMES[runtime]
      ? runtime
      : AGENT_RUNTIMES[existing.runtime]
        ? existing.runtime
        : DEFAULT_AGENT_RUNTIME;
  if (!AGENT_RUNTIMES[runtimeKey]) {
    throw new Error(
      `Invalid runtime: ${runtime}. Expected one of: ${Object.keys(AGENT_RUNTIMES).join(", ")}`,
    );
  }

  const runtimeCfg = runtimeDefault(runtimeKey);
  const nextRole = role || existing.role || "specialist";
  const nextGoal =
    goal ||
    existing.goal ||
    "Analyze assigned topic and collaborate with other agents to reach practical decisions.";

  const skillsProvided = skillsCsv !== undefined;
  const nextSkills = skillsProvided
    ? parseSkillsCsv(skillsCsv)
    : Array.isArray(existing.skills)
      ? existing.skills
      : [];
  const nextSkillRefs = skillsProvided
    ? findSkillRefs(cwd, nextSkills)
    : Array.isArray(existing.skill_refs)
      ? existing.skill_refs
      : [];

  const parsedArgs = argsTemplate !== undefined ? parseArgsTemplate(argsTemplate) || [] : null;
  const parsedMode = normalizeMode(mode);
  const parsedTimeout = normalizeTimeout(timeoutMs);

  const nextExecutor = {
    command: command || existingExecutor.command || runtimeCfg.command,
    mode: parsedMode || existingExecutor.mode || runtimeCfg.mode,
    args:
      parsedArgs ||
      (Array.isArray(existingExecutor.args) ? existingExecutor.args : runtimeCfg.args),
    timeout_ms:
      parsedTimeout ||
      (Number.isFinite(Number(existingExecutor.timeout_ms))
        ? Number(existingExecutor.timeout_ms)
        : 45000),
  };

  if (nextExecutor.mode !== "stdin" && nextExecutor.mode !== "arg") {
    throw new Error(`Invalid executor mode: ${nextExecutor.mode}`);
  }

  const updatedAt = new Date().toISOString();
  const nextProfile = {
    ...existing,
    name: slug,
    runtime: runtimeKey,
    role: nextRole,
    goal: nextGoal,
    skills: nextSkills,
    skill_refs: nextSkillRefs,
    executor: nextExecutor,
    created_at: existing.created_at || updatedAt,
    updated_at: updatedAt,
  };

  fs.writeFileSync(
    found.profilePath,
    `${JSON.stringify(nextProfile, null, 2)}\n`,
    "utf8",
  );

  if (syncBrain) {
    syncBrainMetadataFile(found.brainPath, nextProfile);
  }

  syncLegacyAgentEntry(cwd, slug, found.dir);

  const root = ensureAgentsWorkspace(cwd);
  const activeFile = path.join(root, "active.md");
  fs.writeFileSync(activeFile, `${slug}\n`, "utf8");

  const overviewFile = path.join(root, "overview.md");
  upsertOverviewRow(overviewFile, {
    agent: slug,
    runtime: nextProfile.runtime,
    role: nextProfile.role,
    updatedAt,
    brainPath: `.vibe/agents/${slug}/brain.md`,
  });

  return {
    root,
    agentDir: found.dir,
    profile: nextProfile,
    brainSynced: Boolean(syncBrain),
  };
}

/**
 * Lists all valid agent profiles from the canonical agents directory.
 */
export function listAgentDefinitions(cwd = process.cwd()) {
  const root = resolveAgentsRoot(cwd);
  if (!fs.existsSync(root)) return [];

  const dirs = fs
    .readdirSync(root, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .filter((name) => !name.startsWith("."));

  const output = [];
  for (const dirName of dirs) {
    const profilePath = path.join(root, dirName, "profile.json");
    const brainPath = path.join(root, dirName, "brain.md");
    if (!fs.existsSync(profilePath)) continue;

    try {
      const profile = JSON.parse(fs.readFileSync(profilePath, "utf8"));
      output.push({
        name: dirName,
        dir: path.join(root, dirName),
        profile,
        profilePath,
        brainPath,
      });
    } catch {
      // ignore invalid profile
    }
  }

  return output.sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Loads one agent profile by slug/name.
 */
export function loadAgentDefinition(cwd, name) {
  const slug = toSlug(name || "");
  if (!slug) return null;

  const all = listAgentDefinitions(cwd);
  return all.find((item) => item.name === slug) || null;
}

/**
 * Suggests best-matching agents for a given topic.
 */
export function suggestAgentsForTopic(cwd, topic, limit = 5) {
  const topicTokens = String(topic || "")
    .toLowerCase()
    .split(/\s+/)
    .map((token) => toSlug(token))
    .filter((token) => token.length >= 3);

  const agents = listAgentDefinitions(cwd);
  const scored = agents.map((agent) => {
    const haystack = [
      agent.name,
      agent.profile.role || "",
      agent.profile.goal || "",
      ...(agent.profile.skills || []),
      ...(agent.profile.skill_refs || []),
    ]
      .join(" ")
      .toLowerCase();

    let score = 0;
    const matched = [];

    for (const token of topicTokens) {
      if (!token) continue;
      if (haystack.includes(token)) {
        score += 1;
        matched.push(token);
      }
    }

    return {
      ...agent,
      score,
      matched: Array.from(new Set(matched)),
    };
  });

  return scored
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.name.localeCompare(b.name);
    })
    .slice(0, limit);
}
