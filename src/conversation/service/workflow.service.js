import { MESSAGE_KINDS, WORKFLOW_STATUS, nowMs } from "../contracts.js";
import { withTransaction } from "../db.js";
import { getConversationById, touchConversation } from "../repo/conversations.repo.js";
import {
  insertMessage,
  insertMessageMentions,
  listMessageHistory,
} from "../repo/messages.repo.js";
import { listParticipants } from "../repo/participants.repo.js";
import {
  createWorkflowRun,
  insertWorkflowStep,
  listWorkflowRuns,
  updateWorkflowRun,
} from "../repo/workflows.repo.js";
import { runAgentContribution } from "./agent-runner.service.js";

function requireConversation(db, conversationId) {
  const conversation = getConversationById(db, conversationId);
  if (!conversation) {
    throw new Error(`Conversation not found: ${conversationId}`);
  }
  return conversation;
}

function createSystemMessage(db, { conversationId, actorId, body, metadata }) {
  return insertMessage(db, {
    conversationId,
    kind: MESSAGE_KINDS.SYSTEM,
    actorId,
    actorType: "system",
    body,
    metadata,
  });
}

function selectMeetingParticipants(db, { conversationId, actorId, requestedMembers }) {
  const rows = listParticipants(db, {
    conversationId,
    activeOnly: true,
  });

  const requestedSet =
    requestedMembers && requestedMembers.length > 0
      ? new Set(requestedMembers.map((item) => String(item)))
      : null;

  const picked = rows.filter((row) => {
    if (row.actor_type !== "agent") return false;
    if (String(row.actor_id) === String(actorId)) return false;
    if (!requestedSet) return true;
    return requestedSet.has(String(row.actor_id));
  });

  const dedup = [];
  const seen = new Set();
  for (const row of picked) {
    if (seen.has(row.actor_id)) continue;
    seen.add(row.actor_id);
    dedup.push(row);
  }

  return dedup;
}

function latestHistoryRows(db, conversationId) {
  return listMessageHistory(db, {
    conversationId,
    afterMessageId: 0,
    limit: 200,
    actorId: null,
    kind: null,
    toolName: null,
  });
}

function buildSummaryText({ topic, meetingGoal, completedSteps }) {
  const lines = [
    `Meeting summary for topic: ${topic}`,
    `Goal: ${meetingGoal}`,
    "",
    "Key points:",
  ];

  for (const step of completedSteps) {
    const firstLine = String(step.outputText || "")
      .split("\n")
      .map((line) => line.trim())
      .find((line) => line.length > 0);

    lines.push(`- ${step.actorId} (${step.role}): ${firstLine || "no output"}`);
  }

  const mergedMentions = Array.from(
    new Set(completedSteps.flatMap((step) => step.mentions || [])),
  );
  lines.push("");
  lines.push(
    `Mentioned tools: ${mergedMentions.length > 0 ? mergedMentions.join(", ") : "none"}`,
  );
  lines.push("Next action: assign owners and convert accepted points into executable tasks.");

  return {
    text: lines.join("\n"),
    mentions: mergedMentions,
  };
}

export function startWorkflowRunService(db, {
  conversationId,
  triggerPrompt,
  actorId,
  meetingGoal,
  projectRoot,
  requestedMembers,
}) {
  requireConversation(db, conversationId);

  const participants = selectMeetingParticipants(db, {
    conversationId,
    actorId,
    requestedMembers,
  });

  if (participants.length === 0) {
    throw new Error(
      "No active agent participants found. Add members first with: vibe convo add <conversation_id> --agent <name>",
    );
  }

  const run = withTransaction(db, () => {
    const created = createWorkflowRun(db, {
      conversationId,
      triggerPrompt,
      status: WORKFLOW_STATUS.RUNNING,
      currentStep: participants[0].actor_id,
    });

    createSystemMessage(db, {
      conversationId,
      actorId,
      body: "workflow meeting started",
      metadata: {
        run_id: created.runId,
        step: "start",
        total_steps: participants.length,
        members: participants.map((item) => item.actor_id),
      },
    });

    touchConversation(db, conversationId);
    return created;
  });

  const completedSteps = [];

  for (let index = 0; index < participants.length; index += 1) {
    const participant = participants[index];
    const stepNo = index + 1;
    const stepName = participant.actor_id;
    const stepStartedAt = nowMs();

    try {
      withTransaction(db, () => {
        updateWorkflowRun(db, {
          runId: run.runId,
          status: WORKFLOW_STATUS.RUNNING,
          currentStep: stepName,
          errorText: null,
        });
      });

      const historyRows = latestHistoryRows(db, conversationId);
      const contribution = runAgentContribution({
        projectRoot: projectRoot || process.cwd(),
        actorId: participant.actor_id,
        role: participant.role,
        topic: triggerPrompt,
        meetingGoal:
          meetingGoal ||
          "Discuss options, converge on decision, and provide concrete implementation actions.",
        participants,
        historyRows,
        extraMentionCsv: participant.role,
      });

      const stepEndedAt = nowMs();

      const messageId = withTransaction(db, () => {
        const insertedMessageId = insertMessage(db, {
          conversationId,
          kind: MESSAGE_KINDS.MESSAGE,
          actorId: participant.actor_id,
          actorType: "agent",
          body: contribution.outputText,
          metadata: {
            run_id: run.runId,
            step: stepName,
            role: participant.role,
            runtime: contribution.agent.runtime,
            runtime_ok: contribution.runtimeOk,
            runtime_error: contribution.runtimeError || null,
            executor_command: contribution.executor.command,
          },
        });

        insertMessageMentions(db, insertedMessageId, contribution.mentions);

        insertWorkflowStep(db, {
          runId: run.runId,
          stepNo,
          stepName,
          status: contribution.runtimeOk ? "done" : "done_with_fallback",
          errorText: contribution.runtimeOk ? null : contribution.runtimeError,
          startedAt: stepStartedAt,
          endedAt: stepEndedAt,
        });

        touchConversation(db, conversationId);
        return insertedMessageId;
      });

      completedSteps.push({
        stepName,
        actorId: participant.actor_id,
        role: participant.role,
        messageId,
        mentions: contribution.mentions,
        runtime: contribution.agent.runtime,
        runtimeOk: contribution.runtimeOk,
        outputText: contribution.outputText,
      });
    } catch (error) {
      withTransaction(db, () => {
        const failedAt = nowMs();

        insertWorkflowStep(db, {
          runId: run.runId,
          stepNo,
          stepName,
          status: "failed",
          errorText: error.message,
          startedAt: failedAt,
          endedAt: failedAt,
        });

        updateWorkflowRun(db, {
          runId: run.runId,
          status: WORKFLOW_STATUS.FAILED,
          currentStep: stepName,
          errorText: error.message,
        });

        createSystemMessage(db, {
          conversationId,
          actorId,
          body: `workflow run failed at step ${stepName}`,
          metadata: {
            run_id: run.runId,
            step: stepName,
            error: error.message,
          },
        });

        touchConversation(db, conversationId);
      });

      throw error;
    }
  }

  const summary = buildSummaryText({
    topic: triggerPrompt,
    meetingGoal:
      meetingGoal ||
      "Discuss options, converge on decision, and provide concrete implementation actions.",
    completedSteps,
  });

  const summaryMessageId = withTransaction(db, () => {
    const summaryId = createSystemMessage(db, {
      conversationId,
      actorId,
      body: summary.text,
      metadata: {
        run_id: run.runId,
        step: "summary",
        completed_steps: completedSteps.length,
      },
    });

    insertMessageMentions(db, summaryId, summary.mentions);

    insertWorkflowStep(db, {
      runId: run.runId,
      stepNo: participants.length + 1,
      stepName: "summary",
      status: "done",
      errorText: null,
      startedAt: nowMs(),
      endedAt: nowMs(),
    });

    updateWorkflowRun(db, {
      runId: run.runId,
      status: WORKFLOW_STATUS.DONE,
      currentStep: null,
      errorText: null,
    });

    createSystemMessage(db, {
      conversationId,
      actorId,
      body: "workflow run completed",
      metadata: {
        run_id: run.runId,
        step: "complete",
        completed_steps: completedSteps.length,
      },
    });

    touchConversation(db, conversationId);
    return summaryId;
  });

  return {
    runId: run.runId,
    status: WORKFLOW_STATUS.DONE,
    completedSteps,
    summaryMessageId,
    summaryText: summary.text,
    participants: participants.map((item) => item.actor_id),
  };
}

export function listWorkflowRunsService(db, { conversationId }) {
  requireConversation(db, conversationId);
  return listWorkflowRuns(db, { conversationId });
}
