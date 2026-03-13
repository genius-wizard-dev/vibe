import { spawnSync } from "child_process";
import fs from "fs";
import path from "path";
import {
  AGENT_RUNTIMES,
  loadAgentDefinition,
} from "../../core/agent-registry.js";
import { collectToolMentions, normalizeToolName } from "./mentions.service.js";

function normalizeWhitespace(input) {
  return String(input || "").replace(/\s+/g, " ").trim();
}

function clipText(input, maxLength = 1800) {
  const text = String(input || "");
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength - 3)}...`;
}

function latestHistorySnippet(historyRows, limit = 8) {
  const tail = historyRows.slice(-limit);
  if (tail.length === 0) return "(no previous messages)";

  return tail
    .map((row) => {
      const body = normalizeWhitespace(row.body || "");
      const snippet = body ? `: ${clipText(body, 140)}` : "";
      return `#${row.id} ${row.kind} ${row.actor_id}${snippet}`;
    })
    .join("\n");
}

function readBrainSnippet(brainPath) {
  if (!brainPath || !fs.existsSync(brainPath)) return "";
  const lines = fs.readFileSync(brainPath, "utf8").split("\n");
  return lines.slice(0, 40).join("\n");
}

function resolveRuntimeDefaults(runtime) {
  return AGENT_RUNTIMES[runtime] || AGENT_RUNTIMES.opencode;
}

function resolveExecutor(profile) {
  const runtimeDefaults = resolveRuntimeDefaults(profile.runtime);
  const executor = profile.executor || {};

  const command = executor.command || runtimeDefaults.command;
  const mode = executor.mode === "arg" ? "arg" : "stdin";
  const args = Array.isArray(executor.args)
    ? executor.args.map((item) => String(item))
    : runtimeDefaults.args;
  const timeoutMs = Number(executor.timeout_ms) > 0 ? Number(executor.timeout_ms) : 45000;

  return {
    command,
    mode,
    args,
    timeoutMs,
  };
}

function buildPrompt({
  agentProfile,
  topic,
  meetingGoal,
  participants,
  historyRows,
}) {
  const participantText = participants
    .map((item) => `${item.actor_id}(${item.role || "worker"})`)
    .join(", ");

  const historyText = latestHistorySnippet(historyRows, 10);
  const brainSnippet = readBrainSnippet(agentProfile.brainPath);

  return `You are agent '${agentProfile.name}'.
Runtime: ${agentProfile.runtime}
Role: ${agentProfile.role || "specialist"}

Meeting topic:
${topic}

Meeting goal:
${meetingGoal}

Participants:
${participantText || "(none)"}

Relevant brain context:
${brainSnippet || "(none)"}

Conversation history (latest):
${historyText}

Instructions:
1. Provide your contribution in 3-6 concise bullet points.
2. Include specific trade-offs and practical next actions.
3. Tag important tools as @tool-name when relevant.
4. Avoid repeating previous messages.
`;
}

function substitutePromptArgs(args, prompt) {
  const hasPlaceholder = args.some((item) => item.includes("{prompt}"));
  if (hasPlaceholder) {
    return args.map((item) => item.replaceAll("{prompt}", prompt));
  }
  return [...args, prompt];
}

function buildFallbackResponse({ agentName, role, topic, reason }) {
  return [
    `${agentName} (${role || "specialist"}) fallback response for topic: ${topic}`,
    `Could not run external runtime command: ${reason}`,
    "Suggested direction: clarify constraints, agree on plan, then execute in small steps.",
    "Suggested tools: @sqlite @workflow @history",
  ].join("\n");
}

function runExternalExecutor(executor, prompt) {
  const options = {
    encoding: "utf8",
    timeout: executor.timeoutMs,
    maxBuffer: 1024 * 1024,
  };

  const args =
    executor.mode === "arg"
      ? substitutePromptArgs(executor.args, prompt)
      : executor.args;

  if (executor.mode === "stdin") {
    options.input = prompt;
  }

  const result = spawnSync(executor.command, args, options);
  const stdout = normalizeWhitespace(result.stdout || "");
  const stderr = normalizeWhitespace(result.stderr || "");

  if (result.error) {
    return {
      ok: false,
      output: "",
      error: result.error.message,
      stdout,
      stderr,
    };
  }

  if (result.status !== 0) {
    return {
      ok: false,
      output: "",
      error: stderr || `process exited with status ${result.status}`,
      stdout,
      stderr,
    };
  }

  const output = stdout || stderr;
  if (!output) {
    return {
      ok: false,
      output: "",
      error: "empty output from runtime",
      stdout,
      stderr,
    };
  }

  return {
    ok: true,
    output: clipText(output, 2200),
    error: "",
    stdout,
    stderr,
  };
}

function loadAgentProfile(projectRoot, actorId, roleHint) {
  const found = loadAgentDefinition(projectRoot, actorId);
  if (found) {
    return {
      name: found.name,
      runtime: found.profile.runtime,
      role: found.profile.role || roleHint || "specialist",
      skills: Array.isArray(found.profile.skills) ? found.profile.skills : [],
      profile: found.profile,
      brainPath: found.brainPath,
      profilePath: found.profilePath,
    };
  }

  return {
    name: actorId,
    runtime: "opencode",
    role: roleHint || "specialist",
    skills: [],
    profile: {
      runtime: "opencode",
      role: roleHint || "specialist",
      executor: {
        command: "opencode",
        mode: "stdin",
        args: [],
        timeout_ms: 15000,
      },
    },
    brainPath: path.join(projectRoot, ".vibe", "agents", actorId, "brain.md"),
    profilePath: path.join(projectRoot, ".vibe", "agents", actorId, "profile.json"),
  };
}

function mergedMentionCsv(agentSkills, extraMentionCsv) {
  const values = [];
  for (const item of agentSkills || []) {
    const token = normalizeToolName(item);
    if (token) values.push(token);
  }
  if (extraMentionCsv) {
    for (const item of String(extraMentionCsv).split(",")) {
      const token = normalizeToolName(item);
      if (token) values.push(token);
    }
  }

  return Array.from(new Set(values)).join(",");
}

/**
 * Executes one agent contribution round for workflow meetings.
 */
export function runAgentContribution({
  projectRoot,
  actorId,
  role,
  topic,
  meetingGoal,
  participants,
  historyRows,
  extraMentionCsv,
}) {
  const agent = loadAgentProfile(projectRoot, actorId, role);
  const prompt = buildPrompt({
    agentProfile: agent,
    topic,
    meetingGoal,
    participants,
    historyRows,
  });

  const executor = resolveExecutor(agent.profile);
  const execution = runExternalExecutor(executor, prompt);

  const finalText = execution.ok
    ? execution.output
    : buildFallbackResponse({
        agentName: agent.name,
        role: agent.role,
        topic,
        reason: execution.error,
      });

  const mentionCsv = mergedMentionCsv(agent.skills, extraMentionCsv);
  const mentions = collectToolMentions({
    messageText: finalText,
    mentionCsv,
  });

  return {
    agent,
    prompt,
    outputText: finalText,
    mentions,
    runtimeOk: execution.ok,
    runtimeError: execution.ok ? "" : execution.error,
    executor,
  };
}
