import chalk from "chalk";
import inquirer from "inquirer";
import os from "os";
import {
  loadAgentDefinition,
  suggestAgentsForTopic,
} from "../core/agent-registry.js";
import { getWorkspaceStatus } from "../system/workspace-status.js";
import { closeDatabase, openDatabase } from "./db.js";
import { ACTOR_TYPES, MESSAGE_KINDS } from "./contracts.js";
import { ensureInitialized, runMigrations } from "./migrate.js";
import {
  createConversationService,
  joinConversationService,
  listConversationsService,
  leaveConversationService,
  listParticipantsService,
  sendConversationMessageService,
} from "./service/conversation.service.js";
import { listHistoryService } from "./service/history.service.js";
import { normalizeToolName } from "./service/mentions.service.js";
import { listUnreadMessagesService, markReadService } from "./service/unread.service.js";
import {
  listWorkflowRunsService,
  startWorkflowRunService,
} from "./service/workflow.service.js";

function shortenHome(input) {
  return input.replace(os.homedir(), "~");
}

function formatTime(ms) {
  return new Date(Number(ms)).toISOString().replace("T", " ").slice(0, 19);
}

function parseFlags(tokens, { booleanFlags = [] } = {}) {
  const booleans = new Set(booleanFlags);
  const options = {};
  const positional = [];

  for (let i = 0; i < tokens.length; i += 1) {
    const token = tokens[i];
    if (!token.startsWith("--")) {
      positional.push(token);
      continue;
    }

    const key = token.slice(2);
    if (!key) {
      throw new Error(`Invalid option: ${token}`);
    }

    if (booleans.has(key)) {
      options[key] = true;
      continue;
    }

    const next = tokens[i + 1];
    if (!next || next.startsWith("--")) {
      throw new Error(`Missing value for --${key}`);
    }

    options[key] = next;
    i += 1;
  }

  return { options, positional };
}

function requireOption(options, key) {
  const value = options[key];
  if (!value) {
    throw new Error(`Missing required option: --${key}`);
  }
  return value;
}

function parseLimit(value, fallback = 50) {
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed) || parsed <= 0) {
    throw new Error(`Invalid limit: ${value}`);
  }
  return parsed;
}

function parseMessageId(value) {
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed) || parsed < 0) {
    throw new Error(`Invalid message id: ${value}`);
  }
  return parsed;
}

function validateActorType(value) {
  if (!ACTOR_TYPES.has(value)) {
    throw new Error(
      `Invalid actor type: ${value}. Expected one of: ${Array.from(ACTOR_TYPES).join(", ")}`,
    );
  }
}

function validateMessageKind(value) {
  const supportedKinds = Object.values(MESSAGE_KINDS);
  if (!supportedKinds.includes(value)) {
    throw new Error(
      `Invalid message kind: ${value}. Expected one of: ${supportedKinds.join(", ")}`,
    );
  }
}

function parseCsvList(value) {
  if (!value) return [];
  return Array.from(
    new Set(
      String(value)
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
    ),
  );
}

async function confirmAction(message, autoYes) {
  if (autoYes) return;

  if (!process.stdin.isTTY) {
    throw new Error("This action requires confirmation. Re-run with --yes");
  }

  const { accepted } = await inquirer.prompt([
    {
      type: "confirm",
      name: "accepted",
      message,
      default: true,
    },
  ]);

  if (!accepted) {
    throw new Error("Action cancelled by user");
  }
}

function withDb(inputPath, requireInit, handler) {
  const { db, dbPath } = openDatabase(inputPath);
  try {
    if (requireInit) {
      ensureInitialized(db);
    }
    return handler(db, dbPath);
  } finally {
    closeDatabase(db);
  }
}

/**
 * Shows non-blocking workspace setup recommendations for convo operations.
 */
function printWorkspaceSetupRecommendationForConvo() {
  const status = getWorkspaceStatus(process.cwd());
  if (status.convoReady) return;

  const hints = [];
  if (!status.initReady) {
    hints.push("run vibe setup");
  }
  if (!status.hasResourceState) {
    hints.push("run /resource.setup");
  }
  if (status.hasResourceState && !status.resourceReady) {
    hints.push("complete /resource.findskills and /resource.base");
  }

  const suffix = hints.length > 0 ? ` (${hints.join("; ")})` : "";
  console.log(chalk.yellow(`\nWorkspace setup recommended${suffix}\n`));
}

function parseIntervalMs(value, fallback = 1200) {
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed) || parsed < 300) {
    throw new Error(`Invalid interval: ${value}. Expected integer >= 300`);
  }
  return parsed;
}

function printMessageRow(row) {
  const body = (row.body || "").trim();
  const header = `#${row.id} ${chalk.cyan(row.kind)} ${chalk.white(row.actor_id)} ${chalk.dim(formatTime(row.created_at))}`;
  console.log(`  ${header}`);
  if (body) {
    console.log(`    ${body}`);
  }
  if (row.mentions.length > 0) {
    console.log(chalk.dim(`    mentions: ${row.mentions.join(", ")}`));
  }
}

function printUsage() {
  console.log(`
Usage:
  vibe convo init [--db <db-path>]
  vibe convo list [--active-only] [--db <db-path>]
  vibe convo create <title> --by <actor_id> [--type agent|human|system] [--yes] [--db <db-path>]
  vibe convo suggest <conversation_id> --topic <text> [--limit <n>]
  vibe convo add <conversation_id> --agent <agent_name> [--role <role>] [--yes] [--db <db-path>]
  vibe convo start <conversation_id> --topic <text> [--owner <actor_id>] [--members <csv>] [--yes] [--db <db-path>]
  vibe convo join <conversation_id> --actor <actor_id> [--type agent|human|system] [--role <role>] [--db <db-path>]
  vibe convo send <conversation_id> --actor <actor_id> --text <message> [--type agent|human|system] [--mention toolA,toolB] [--db <db-path>]
  vibe convo leave <conversation_id> --actor <actor_id> [--type agent|human|system] [--db <db-path>]
  vibe convo users <conversation_id> [--active-only] [--db <db-path>]
  vibe convo unread <conversation_id> --actor <actor_id> [--type agent|human|system] [--limit <n>] [--db <db-path>]
  vibe convo history <conversation_id> [--after <message_id>] [--limit <n>] [--actor <actor_id>] [--kind <kind>] [--tool <name>] [--db <db-path>]
  vibe convo read <conversation_id> --actor <actor_id> --until <message_id> [--type agent|human|system] [--db <db-path>]
  vibe convo run <conversation_id> --prompt <text> [--actor <actor_id>] [--members <csv>] [--yes] [--db <db-path>]
  vibe convo runs <conversation_id> [--db <db-path>]
  vibe convo monitor <conversation_id> [--join] [--actor <actor_id>] [--type agent|human|system] [--after <message_id>] [--interval <ms>] [--db <db-path>]
`);
}

function handleInit(args) {
  const { options } = parseFlags(args);

  withDb(options.db, false, (db, dbPath) => {
    const applied = runMigrations(db);

    console.log(chalk.green("\nConversation DB ready."));
    console.log(chalk.dim(`  ${shortenHome(dbPath)}`));

    if (applied.length === 0) {
      console.log(chalk.dim("  No pending migrations."));
    } else {
      console.log(chalk.dim(`  Applied: ${applied.join(", ")}`));
    }

    console.log();
  });
}

function handleList(args) {
  const { options } = parseFlags(args, { booleanFlags: ["active-only"] });

  withDb(options.db, true, (db, dbPath) => {
    const rows = listConversationsService(db, {
      activeOnly: Boolean(options["active-only"]),
    });

    console.log(chalk.green("\nConversations"));
    console.log(chalk.dim(`  db: ${shortenHome(dbPath)}`));

    if (Boolean(options["active-only"])) {
      console.log(chalk.dim("  filter: active-only"));
    }

    if (rows.length === 0) {
      console.log(chalk.dim("  No conversations found."));
      console.log();
      return;
    }

    for (const row of rows) {
      const marker = Number(row.running_workflows) > 0 ? chalk.cyan("●") : chalk.dim("○");
      console.log(
        `  ${marker} ${chalk.white(row.id)} ${chalk.dim(`[${row.status}]`)} ${chalk.white(row.title)}`,
      );
      console.log(
        chalk.dim(
          `    active_participants=${row.active_participants} running_workflows=${row.running_workflows} updated=${formatTime(row.updated_at)}`,
        ),
      );
    }

    console.log();
  });
}

/**
 * Streams conversation messages in realtime and optionally joins as observer.
 */
async function handleMonitor(args) {
  const { options, positional } = parseFlags(args, { booleanFlags: ["join"] });
  const conversationId = positional[0];
  const afterMessageId = options.after ? parseMessageId(options.after) : 0;
  const intervalMs = parseIntervalMs(options.interval, 1200);
  const shouldJoin = Boolean(options.join);
  const actorId = options.actor || "observer";
  const actorType = options.type || "human";

  if (!conversationId) {
    throw new Error("Missing conversation_id");
  }

  validateActorType(actorType);

  const { db, dbPath } = openDatabase(options.db);
  let joined = false;

  try {
    ensureInitialized(db);
    listParticipantsService(db, {
      conversationId,
      activeOnly: false,
    });

    if (shouldJoin) {
      joinConversationService(db, {
        conversationId,
        actorId,
        actorType,
        role: "observer",
      });
      joined = true;
    }

    let lastMessageId = afterMessageId;

    console.log(chalk.green("\nConversation monitor"));
    console.log(chalk.white(`  conversation: ${conversationId}`));
    console.log(chalk.dim(`  db: ${shortenHome(dbPath)}`));
    console.log(chalk.dim(`  after: ${afterMessageId} | interval: ${intervalMs}ms`));
    if (shouldJoin) {
      console.log(chalk.dim(`  joined as: ${actorId} (${actorType})`));
    }
    console.log(chalk.dim("  Press q, b, or Ctrl+C to exit monitor"));
    console.log();

    const initialRows = listHistoryService(db, {
      conversationId,
      afterMessageId,
      limit: 200,
      actorId: "",
      kind: "",
      toolName: "",
    });

    if (initialRows.length === 0) {
      console.log(chalk.dim("  No messages yet."));
    } else {
      initialRows.forEach((row) => {
        printMessageRow(row);
        lastMessageId = row.id;
      });
    }

    if (!process.stdin.isTTY || typeof process.stdin.setRawMode !== "function") {
      console.log();
      console.log(chalk.yellow("  Realtime monitor requires an interactive TTY."));
      console.log();
      return;
    }

    await new Promise((resolve) => {
      let finished = false;

      const finish = () => {
        if (finished) return;
        finished = true;
        clearInterval(interval);
        process.stdin.off("data", onKeypress);
        process.stdin.setRawMode(false);
        process.stdin.pause();
        resolve();
      };

      const onKeypress = (buf) => {
        const key = buf.toString();
        const normalized = key.toLowerCase();
        if (key === "\x03" || normalized === "q" || normalized === "b") {
          finish();
        }
      };

      const interval = setInterval(() => {
        try {
          const rows = listHistoryService(db, {
            conversationId,
            afterMessageId: lastMessageId,
            limit: 200,
            actorId: "",
            kind: "",
            toolName: "",
          });

          rows.forEach((row) => {
            printMessageRow(row);
            lastMessageId = row.id;
          });
        } catch (error) {
          console.log();
          console.log(chalk.red(`  monitor error: ${error.message}`));
          finish();
        }
      }, intervalMs);

      process.stdin.setRawMode(true);
      process.stdin.resume();
      process.stdin.on("data", onKeypress);
    });

    console.log();
    console.log(chalk.green("Monitor stopped."));
    console.log();
  } finally {
    if (joined) {
      try {
        leaveConversationService(db, {
          conversationId,
          actorId,
          actorType,
        });
      } catch {
        // no-op
      }
    }

    closeDatabase(db);
  }
}

async function handleCreate(args) {
  const { options, positional } = parseFlags(args, { booleanFlags: ["yes"] });
  const title = positional.join(" ").trim();
  const createdBy = requireOption(options, "by");
  const createdByType = options.type || "agent";

  if (!title) {
    throw new Error("Missing conversation title");
  }

  validateActorType(createdByType);

  await confirmAction(
    `Create conversation '${title}' by '${createdBy}' (${createdByType})?`,
    Boolean(options.yes),
  );

  withDb(options.db, true, (db, dbPath) => {
    const conversation = createConversationService(db, {
      title,
      createdBy,
      createdByType,
    });

    console.log(chalk.green("\nConversation created."));
    console.log(chalk.white(`  id: ${conversation.id}`));
    console.log(chalk.dim(`  title: ${conversation.title}`));
    console.log(chalk.dim(`  db: ${shortenHome(dbPath)}`));
    console.log();
  });
}

function handleSuggest(args) {
  const { options, positional } = parseFlags(args);
  const conversationId = positional[0];
  const topic = requireOption(options, "topic");
  const limit = parseLimit(options.limit, 5);

  if (!conversationId) {
    throw new Error("Missing conversation_id");
  }

  withDb(options.db, true, (db) => {
    listParticipantsService(db, {
      conversationId,
      activeOnly: false,
    });
  });

  const suggestions = suggestAgentsForTopic(process.cwd(), topic, limit);
  if (suggestions.length === 0) {
    console.log(chalk.yellow("\nNo agents available for suggestion."));
    console.log(chalk.dim("  Create one with: vibe agents create planner --runtime opencode"));
    console.log();
    return;
  }

  console.log(chalk.green("\nSuggested agents for meeting"));
  console.log(chalk.white(`  conversation: ${conversationId}`));
  console.log(chalk.dim(`  topic: ${topic}`));

  for (const entry of suggestions) {
    const matched = entry.matched.length > 0 ? entry.matched.join(", ") : "none";
    console.log(
      `  - ${chalk.white(entry.name)} ${chalk.dim(`[score=${entry.score}]`)} runtime=${entry.profile.runtime} role=${entry.profile.role || "-"}`,
    );
    console.log(chalk.dim(`    matched: ${matched}`));
  }

  console.log();
}

async function handleAdd(args) {
  const { options, positional } = parseFlags(args, { booleanFlags: ["yes"] });
  const conversationId = positional[0];
  const agentName = requireOption(options, "agent");

  if (!conversationId) {
    throw new Error("Missing conversation_id");
  }

  const agent = loadAgentDefinition(process.cwd(), agentName);
  if (!agent) {
    throw new Error(`Agent not found: ${agentName}. Create one with: vibe agents create ${agentName}`);
  }

  const role = options.role || agent.profile.role || "specialist";

  await confirmAction(
    `Add agent '${agent.name}' (runtime=${agent.profile.runtime}, role=${role}) to conversation '${conversationId}'?`,
    Boolean(options.yes),
  );

  withDb(options.db, true, (db) => {
    const messageId = joinConversationService(db, {
      conversationId,
      actorId: agent.name,
      actorType: "agent",
      role,
    });

    console.log(chalk.green("\nAgent added to conversation."));
    console.log(chalk.white(`  conversation: ${conversationId}`));
    console.log(chalk.white(`  agent: ${agent.name}`));
    console.log(chalk.dim(`  runtime: ${agent.profile.runtime}`));
    console.log(chalk.dim(`  role: ${role}`));
    console.log(chalk.dim(`  event message id: ${messageId}`));
    console.log();
  });
}

async function handleStart(args) {
  const { options, positional } = parseFlags(args, { booleanFlags: ["yes"] });
  const conversationId = positional[0];
  const topic = requireOption(options, "topic");
  const owner = options.owner || "meeting-host";
  const requestedMembers = parseCsvList(options.members || "");

  if (!conversationId) {
    throw new Error("Missing conversation_id");
  }

  const activeAgents = withDb(options.db, true, (db) => {
    const rows = listParticipantsService(db, {
      conversationId,
      activeOnly: true,
    });
    return rows.filter((row) => row.actor_type === "agent");
  });

  if (activeAgents.length === 0) {
    throw new Error(
      "No active agents in this conversation. Add members first with: vibe convo add <conversation_id> --agent <name>",
    );
  }

  const selected =
    requestedMembers.length > 0
      ? activeAgents.filter((row) => requestedMembers.includes(String(row.actor_id)))
      : activeAgents;

  if (selected.length === 0) {
    throw new Error("No selected members match active participants in this conversation");
  }

  const memberLabel = selected.map((row) => `${row.actor_id}(${row.role || "worker"})`).join(", ");
  await confirmAction(
    `Start AI meeting for '${conversationId}' with members [${memberLabel}] on topic '${topic}'?`,
    Boolean(options.yes),
  );

  withDb(options.db, true, (db) => {
    const runResult = startWorkflowRunService(db, {
      conversationId,
      triggerPrompt: topic,
      actorId: owner,
      meetingGoal:
        "Phan tich van de, tranh luan phuong an, thong nhat huong giai quyet, va tao ban tong ket hanh dong.",
      projectRoot: process.cwd(),
      requestedMembers: selected.map((row) => String(row.actor_id)),
    });

    console.log(chalk.green("\nAI meeting completed."));
    console.log(chalk.white(`  conversation: ${conversationId}`));
    console.log(chalk.white(`  run_id: ${runResult.runId}`));
    console.log(chalk.dim(`  participants: ${runResult.participants.join(", ")}`));
    console.log(chalk.dim(`  steps: ${runResult.completedSteps.length}`));
    console.log(chalk.dim(`  summary message id: ${runResult.summaryMessageId}`));

    for (const step of runResult.completedSteps) {
      const mentionLabel = step.mentions.length > 0 ? step.mentions.join(", ") : "none";
      console.log(
        chalk.dim(
          `  - ${step.stepName} (${step.runtime}) message_id=${step.messageId} runtime_ok=${step.runtimeOk} mentions=${mentionLabel}`,
        ),
      );
    }

    console.log();
    console.log(runResult.summaryText);
    console.log();
  });
}

function handleJoin(args) {
  const { options, positional } = parseFlags(args);
  const conversationId = positional[0];
  const actorId = requireOption(options, "actor");
  const actorType = options.type || "agent";
  const role = options.role || "worker";

  if (!conversationId) {
    throw new Error("Missing conversation_id");
  }

  validateActorType(actorType);

  withDb(options.db, true, (db) => {
    const messageId = joinConversationService(db, {
      conversationId,
      actorId,
      actorType,
      role,
    });

    console.log(chalk.green("\nParticipant joined."));
    console.log(chalk.white(`  conversation: ${conversationId}`));
    console.log(chalk.white(`  actor: ${actorId}`));
    console.log(chalk.dim(`  event message id: ${messageId}`));
    console.log();
  });
}

function handleSend(args) {
  const { options, positional } = parseFlags(args);
  const conversationId = positional[0];
  const actorId = requireOption(options, "actor");
  const actorType = options.type || "agent";
  const messageText = requireOption(options, "text");

  if (!conversationId) {
    throw new Error("Missing conversation_id");
  }

  validateActorType(actorType);

  withDb(options.db, true, (db) => {
    const result = sendConversationMessageService(db, {
      conversationId,
      actorId,
      actorType,
      messageText,
      mentionCsv: options.mention || "",
      metadata: null,
    });

    const mentionLabel =
      result.tools.length > 0 ? result.tools.join(", ") : "none";

    console.log(chalk.green("\nMessage sent."));
    console.log(chalk.white(`  conversation: ${conversationId}`));
    console.log(chalk.white(`  actor: ${actorId}`));
    console.log(chalk.dim(`  message id: ${result.messageId}`));
    console.log(chalk.dim(`  mentions: ${mentionLabel}`));
    console.log();
  });
}

function handleLeave(args) {
  const { options, positional } = parseFlags(args);
  const conversationId = positional[0];
  const actorId = requireOption(options, "actor");
  const actorType = options.type || "agent";

  if (!conversationId) {
    throw new Error("Missing conversation_id");
  }

  validateActorType(actorType);

  withDb(options.db, true, (db) => {
    const messageId = leaveConversationService(db, {
      conversationId,
      actorId,
      actorType,
    });

    console.log(chalk.green("\nParticipant left."));
    console.log(chalk.white(`  conversation: ${conversationId}`));
    console.log(chalk.white(`  actor: ${actorId}`));
    console.log(chalk.dim(`  event message id: ${messageId}`));
    console.log();
  });
}

function handleUsers(args) {
  const { options, positional } = parseFlags(args, {
    booleanFlags: ["active-only"],
  });
  const conversationId = positional[0];

  if (!conversationId) {
    throw new Error("Missing conversation_id");
  }

  withDb(options.db, true, (db) => {
    const rows = listParticipantsService(db, {
      conversationId,
      activeOnly: Boolean(options["active-only"]),
    });

    console.log(chalk.green("\nParticipants"));
    console.log(chalk.white(`  conversation: ${conversationId}`));

    if (rows.length === 0) {
      console.log(chalk.dim("  No participants found."));
      console.log();
      return;
    }

    for (const row of rows) {
      const active = Number(row.is_active) === 1 ? "active" : "left";
      const leftAt = row.left_at ? formatTime(row.left_at) : "-";
      console.log(
        `  - ${chalk.white(row.actor_id)} (${row.actor_type}, ${row.role}) ${chalk.dim(`[${active}]`)}`,
      );
      console.log(
        chalk.dim(
          `    joined: ${formatTime(row.joined_at)} | left: ${leftAt} | updated: ${formatTime(
            row.updated_at,
          )}`,
        ),
      );
    }

    console.log();
  });
}

function handleUnread(args) {
  const { options, positional } = parseFlags(args);
  const conversationId = positional[0];
  const actorId = requireOption(options, "actor");
  const actorType = options.type || "agent";
  const limit = parseLimit(options.limit, 50);

  if (!conversationId) {
    throw new Error("Missing conversation_id");
  }

  validateActorType(actorType);

  withDb(options.db, true, (db) => {
    const unread = listUnreadMessagesService(db, {
      conversationId,
      actorId,
      actorType,
      limit,
    });

    console.log(chalk.green("\nUnread messages"));
    console.log(chalk.white(`  conversation: ${conversationId}`));
    console.log(chalk.white(`  actor: ${actorId} (${actorType})`));
    console.log(chalk.dim(`  after message id: ${unread.afterMessageId}`));

    if (unread.messages.length === 0) {
      console.log(chalk.dim("  No unread messages."));
      console.log();
      return;
    }

    for (const row of unread.messages) {
      const body = row.body || "";
      console.log(
        `  - #${row.id} ${chalk.cyan(row.kind)} ${chalk.white(row.actor_id)} ${chalk.dim(formatTime(row.created_at))}`,
      );
      if (body) {
        console.log(`    ${body}`);
      }
      if (row.mentions.length > 0) {
        console.log(chalk.dim(`    mentions: ${row.mentions.join(", ")}`));
      }
    }

    console.log();
  });
}

function handleHistory(args) {
  const { options, positional } = parseFlags(args);
  const conversationId = positional[0];
  const afterMessageId = options.after ? parseMessageId(options.after) : 0;
  const limit = parseLimit(options.limit, 100);
  const actorId = options.actor || "";
  const kind = options.kind || "";
  const rawToolName = options.tool || options.mention || "";
  const toolName = rawToolName ? normalizeToolName(rawToolName) : "";

  if (!conversationId) {
    throw new Error("Missing conversation_id");
  }

  if (kind) {
    validateMessageKind(kind);
  }

  if (rawToolName && !toolName) {
    throw new Error(`Invalid tool filter: ${rawToolName}`);
  }

  withDb(options.db, true, (db) => {
    const rows = listHistoryService(db, {
      conversationId,
      afterMessageId,
      limit,
      actorId,
      kind,
      toolName,
    });

    console.log(chalk.green("\nConversation history"));
    console.log(chalk.white(`  conversation: ${conversationId}`));
    console.log(chalk.dim(`  after message id: ${afterMessageId}`));
    console.log(chalk.dim(`  limit: ${limit}`));

    const activeFilters = [];
    if (actorId) activeFilters.push(`actor=${actorId}`);
    if (kind) activeFilters.push(`kind=${kind}`);
    if (toolName) activeFilters.push(`tool=${toolName}`);
    if (activeFilters.length > 0) {
      console.log(chalk.dim(`  filters: ${activeFilters.join(", ")}`));
    }

    if (rows.length === 0) {
      console.log(chalk.dim("  No messages found for current filters."));
      console.log();
      return;
    }

    for (const row of rows) {
      console.log(
        `  - #${row.id} ${chalk.cyan(row.kind)} ${chalk.white(row.actor_id)} ${chalk.dim(formatTime(row.created_at))}`,
      );
      if (row.body) {
        console.log(`    ${row.body}`);
      }
      if (row.mentions.length > 0) {
        console.log(chalk.dim(`    mentions: ${row.mentions.join(", ")}`));
      }
    }

    console.log();
  });
}

function handleRead(args) {
  const { options, positional } = parseFlags(args);
  const conversationId = positional[0];
  const actorId = requireOption(options, "actor");
  const actorType = options.type || "agent";
  const untilMessageId = parseMessageId(requireOption(options, "until"));

  if (!conversationId) {
    throw new Error("Missing conversation_id");
  }

  validateActorType(actorType);

  withDb(options.db, true, (db) => {
    const cursorValue = markReadService(db, {
      conversationId,
      actorId,
      actorType,
      untilMessageId,
    });

    console.log(chalk.green("\nRead cursor updated."));
    console.log(chalk.white(`  conversation: ${conversationId}`));
    console.log(chalk.white(`  actor: ${actorId} (${actorType})`));
    console.log(chalk.dim(`  last_read_message_id: ${cursorValue}`));
    console.log();
  });
}

async function handleRun(args) {
  const { options, positional } = parseFlags(args, { booleanFlags: ["yes"] });
  const conversationId = positional[0];
  const prompt = requireOption(options, "prompt");
  const actorId = options.actor || "system";
  const requestedMembers = parseCsvList(options.members || "");

  if (!conversationId) {
    throw new Error("Missing conversation_id");
  }

  const activeAgents = withDb(options.db, true, (db) => {
    const rows = listParticipantsService(db, {
      conversationId,
      activeOnly: true,
    });
    return rows.filter((row) => row.actor_type === "agent");
  });

  if (activeAgents.length === 0) {
    throw new Error(
      "No active agents in this conversation. Add members first with: vibe convo add <conversation_id> --agent <name>",
    );
  }

  const selected =
    requestedMembers.length > 0
      ? activeAgents.filter((row) => requestedMembers.includes(String(row.actor_id)))
      : activeAgents;

  if (selected.length === 0) {
    throw new Error("No selected members match active participants in this conversation");
  }

  const memberLabel = selected.map((row) => `${row.actor_id}(${row.role || "worker"})`).join(", ");
  await confirmAction(
    `Run multi-agent workflow for '${conversationId}' with members [${memberLabel}]?`,
    Boolean(options.yes),
  );

  withDb(options.db, true, (db) => {
    const runResult = startWorkflowRunService(db, {
      conversationId,
      triggerPrompt: prompt,
      actorId,
      meetingGoal:
        "Phan tich prompt, de xuat huong giai quyet, va tao tong ket de co the implement ngay.",
      projectRoot: process.cwd(),
      requestedMembers: selected.map((row) => String(row.actor_id)),
    });

    console.log(chalk.green("\nWorkflow run executed."));
    console.log(chalk.white(`  conversation: ${conversationId}`));
    console.log(chalk.white(`  run_id: ${runResult.runId}`));
    console.log(chalk.dim(`  status: ${runResult.status}`));
    console.log(chalk.dim(`  steps: ${runResult.completedSteps.length}`));

    for (const step of runResult.completedSteps) {
      const mentionLabel = step.mentions.length > 0 ? step.mentions.join(", ") : "none";
      console.log(
        chalk.dim(
          `  - ${step.stepName} (${step.runtime}) message_id=${step.messageId} runtime_ok=${step.runtimeOk} mentions=${mentionLabel}`,
        ),
      );
    }

    console.log(chalk.dim(`  summary message id: ${runResult.summaryMessageId}`));
    console.log();
    console.log(runResult.summaryText);
    console.log();
  });
}

function handleRuns(args) {
  const { options, positional } = parseFlags(args);
  const conversationId = positional[0];

  if (!conversationId) {
    throw new Error("Missing conversation_id");
  }

  withDb(options.db, true, (db) => {
    const rows = listWorkflowRunsService(db, { conversationId });

    console.log(chalk.green("\nWorkflow runs"));
    console.log(chalk.white(`  conversation: ${conversationId}`));

    if (rows.length === 0) {
      console.log(chalk.dim("  No workflow runs found."));
      console.log();
      return;
    }

    for (const row of rows) {
      console.log(
        `  - ${chalk.white(row.run_id)} ${chalk.dim(`[${row.status}]`)} step=${row.current_step || "-"}`,
      );
      console.log(
        chalk.dim(
          `    created: ${formatTime(row.created_at)} | updated: ${formatTime(row.updated_at)}`,
        ),
      );
    }

    console.log();
  });
}

/**
 * Routes `vibe convo ...` subcommands.
 */
export async function runConvo(args) {
  const [subcmd, ...rest] = args;

  if (!subcmd || subcmd === "--help" || subcmd === "-h") {
    printUsage();
    return;
  }

  try {
    if (subcmd !== "init") {
      printWorkspaceSetupRecommendationForConvo();
    }

    if (subcmd === "init") {
      handleInit(rest);
      return;
    }

    if (subcmd === "list") {
      handleList(rest);
      return;
    }

    if (subcmd === "create") {
      await handleCreate(rest);
      return;
    }

    if (subcmd === "suggest") {
      handleSuggest(rest);
      return;
    }

    if (subcmd === "add") {
      await handleAdd(rest);
      return;
    }

    if (subcmd === "start") {
      await handleStart(rest);
      return;
    }

    if (subcmd === "join") {
      handleJoin(rest);
      return;
    }

    if (subcmd === "send") {
      handleSend(rest);
      return;
    }

    if (subcmd === "leave") {
      handleLeave(rest);
      return;
    }

    if (subcmd === "users") {
      handleUsers(rest);
      return;
    }

    if (subcmd === "unread") {
      handleUnread(rest);
      return;
    }

    if (subcmd === "history") {
      handleHistory(rest);
      return;
    }

    if (subcmd === "read") {
      handleRead(rest);
      return;
    }

    if (subcmd === "run") {
      await handleRun(rest);
      return;
    }

    if (subcmd === "runs") {
      handleRuns(rest);
      return;
    }

    if (subcmd === "monitor") {
      await handleMonitor(rest);
      return;
    }

    throw new Error(`Unknown convo command: ${subcmd}`);
  } catch (error) {
    console.error(chalk.red(`\n${error.message}\n`));
    printUsage();
    process.exitCode = 1;
  }
}
