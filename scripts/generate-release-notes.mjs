#!/usr/bin/env node

import { execSync } from "node:child_process";
import fs from "node:fs";

function run(command) {
  try {
    return execSync(command, { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
  } catch {
    return "";
  }
}

function getArg(name, fallback = "") {
  const key = `--${name}`;
  const idx = process.argv.indexOf(key);
  if (idx === -1) return fallback;
  return process.argv[idx + 1] || fallback;
}

function lines(value) {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function classifyCommit(subject) {
  if (/^feat(\(.+\))?:\s+/i.test(subject)) return "Features";
  if (/^fix(\(.+\))?:\s+/i.test(subject)) return "Fixes";
  if (/^perf(\(.+\))?:\s+/i.test(subject)) return "Performance";
  if (/^refactor(\(.+\))?:\s+/i.test(subject)) return "Refactors";
  if (/^docs(\(.+\))?:\s+/i.test(subject)) return "Docs";
  if (/^test(\(.+\))?:\s+/i.test(subject)) return "Tests";
  if (/^(chore|build|ci)(\(.+\))?:\s+/i.test(subject)) return "Maintenance";
  return "Other";
}

function cleanSubject(subject) {
  return subject.replace(/^(feat|fix|perf|refactor|docs|test|chore|build|ci)(\(.+\))?:\s+/i, "");
}

const version = getArg("version", "0.0.0");
const tag = getArg("tag", `v${version}`);
const prevTag = getArg("prev-tag", "");
const output = getArg("output", "RELEASE_NOTES.md");

const repo = "genius-wizard-dev/vibe";
const today = new Date().toISOString().slice(0, 10);
const range = prevTag ? `${prevTag}..HEAD` : "HEAD";

const commitRows = lines(run(`git log ${range} --pretty=format:%h%x09%s`)).map((row) => {
  const [hash, ...rest] = row.split("\t");
  return { hash, subject: rest.join("\t").trim() };
});

const sections = {
  Features: [],
  Fixes: [],
  Performance: [],
  Refactors: [],
  Docs: [],
  Tests: [],
  Maintenance: [],
  Other: [],
};

for (const commit of commitRows) {
  const bucket = classifyCommit(commit.subject);
  const subject = cleanSubject(commit.subject);
  sections[bucket].push(`- ${subject} (${commit.hash})`);
}

const changedFiles = prevTag
  ? lines(run(`git diff --name-only ${range}`))
  : lines(run("git ls-files"));
const contributors = [...new Set(lines(run(`git log ${range} --pretty=format:%an`)))];

const notes = [];
notes.push(`# ${tag}`);
notes.push("");

if (!prevTag) {
  notes.push("_No previous version tag found. This note set is generated from repository history._");
  notes.push("");
}
notes.push(`Released: ${today}`);
if (prevTag) {
  notes.push(`Compare: https://github.com/${repo}/compare/${prevTag}...${tag}`);
}
notes.push("");

const orderedSections = [
  "Features",
  "Fixes",
  "Performance",
  "Refactors",
  "Docs",
  "Tests",
  "Maintenance",
  "Other",
];

let hasChanges = false;
for (const name of orderedSections) {
  if (sections[name].length === 0) continue;
  hasChanges = true;
  notes.push(`## ${name}`);
  notes.push(...sections[name]);
  notes.push("");
}

if (!hasChanges) {
  notes.push("## Changes");
  notes.push("- No commits detected in range.");
  notes.push("");
}

notes.push("## Changed Files");
if (changedFiles.length === 0) {
  notes.push("- No file diff available.");
} else {
  const preview = changedFiles.slice(0, 60);
  preview.forEach((file) => notes.push(`- ${file}`));
  if (changedFiles.length > preview.length) {
    notes.push(`- ...and ${changedFiles.length - preview.length} more files`);
  }
}
notes.push("");

if (contributors.length > 0) {
  notes.push("## Contributors");
  contributors.forEach((name) => notes.push(`- ${name}`));
  notes.push("");
}

fs.writeFileSync(output, `${notes.join("\n")}\n`, "utf8");
process.stdout.write(`Generated ${output}\n`);
