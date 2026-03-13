import chalk from "chalk";
import readline from "readline";

// ─── ASCII Art ────────────────────────────────────────────────────────────────

export const VIBE_ART =
  chalk.cyan(`
██╗   ██╗██╗██████╗ ███████╗
██║   ██║██║██╔══██╗██╔════╝
██║   ██║██║██████╔╝█████╗
╚██╗ ██╔╝██║██╔══██╗██╔══╝
 ╚████╔╝ ██║██████╔╝███████╗
  ╚═══╝  ╚═╝╚═════╝ ╚══════╝
`) + chalk.dim("  AI vibe Bootstrap  v0.1.0\n");

export const BACK_ACTION = "__vibe_back__";

function isBackKey(key) {
  return key === "b" || key === "B" || key === "\x1b[D";
}

// ─── Key handling ─────────────────────────────────────────────────────────────

function getRawKey() {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin });
    process.stdin.setRawMode(true);
    process.stdin.once("data", (buf) => {
      process.stdin.setRawMode(false);
      rl.close();
      resolve(buf.toString());
    });
  });
}

// ─── Multi-select widget ──────────────────────────────────────────────────────

export async function multiSelect({
  title,
  options,
  required = [],
  initial = [],
  allowBack = false,
}) {
  const selected = new Set([...required, ...initial]);
  let cursor = 0;

  const render = () => {
    process.stdout.write("\x1b[2J\x1b[H"); // clear
    console.log(VIBE_ART);
    console.log(chalk.bold(`  ${title}\n`));
    const controls = allowBack
      ? "  [Space] toggle  [Enter] confirm  [↑↓] move  [B] back\n"
      : "  [Space] toggle  [Enter] confirm  [↑↓] move\n";
    console.log(chalk.dim(controls));

    options.forEach((opt, i) => {
      const isSelected = selected.has(opt.value);
      const isCursor = i === cursor;
      const isRequired = required.includes(opt.value);

      const bullet = isSelected ? chalk.cyan("  ◉ ") : chalk.dim("  ○ ");
      const label = isCursor
        ? chalk.bold.white(opt.label)
        : chalk.white(opt.label);
      const desc = chalk.dim(`  ${opt.desc || ""}`);
      const req = isRequired ? chalk.dim(" (required)") : "";
      const cursor_mark = isCursor ? chalk.cyan(" ◀") : "";

      console.log(`${bullet}${label}${req}${cursor_mark}`);
      if (opt.desc) console.log(`      ${desc}`);
    });

    console.log();
    if (required.length > 0) {
      const count = selected.size - required.length;
      console.log(
        chalk.dim(`  ${count} selected (+ ${required.length} required)`),
      );
    } else {
      console.log(chalk.dim(`  ${selected.size} selected`));
    }
  };

  render();

  while (true) {
    const key = await getRawKey();

    if (key === "\r" || key === "\n") break; // Enter
    if (allowBack && isBackKey(key)) return BACK_ACTION;
    if (key === "\x1b[A" && cursor > 0) cursor--; // Up
    if (key === "\x1b[B" && cursor < options.length - 1) cursor++; // Down
    if (key === " ") {
      const val = options[cursor].value;
      if (!required.includes(val)) {
        selected.has(val) ? selected.delete(val) : selected.add(val);
      }
    }
    if (key === "\x03") process.exit(); // Ctrl+C

    render();
  }

  return [...selected];
}

// ─── Single select (radio) ────────────────────────────────────────────────────

export async function singleSelect({
  title,
  options,
  subtitle = "",
  initial = 0,
  allowBack = false,
}) {
  let cursor = Math.min(Math.max(initial, 0), Math.max(options.length - 1, 0));

  const render = () => {
    process.stdout.write("\x1b[2J\x1b[H");
    console.log(VIBE_ART);
    console.log(chalk.bold(`  ${title}\n`));
    if (subtitle) console.log(chalk.dim(`  ${subtitle}\n`));
    const controls = allowBack
      ? "  [↑↓] move  [Enter] select  [B] back\n"
      : "  [↑↓] move  [Enter] select\n";
    console.log(chalk.dim(controls));

    options.forEach((opt, i) => {
      const isCursor = i === cursor;
      const bullet = isCursor ? chalk.cyan("  ▶ ") : chalk.dim("    ");
      const label = isCursor
        ? chalk.bold.white(opt.label)
        : chalk.white(opt.label);
      console.log(`${bullet}${label}`);
      if (opt.desc) console.log(chalk.dim(`      ${opt.desc}`));
    });
  };

  render();

  while (true) {
    const key = await getRawKey();
    if (key === "\r" || key === "\n") break;
    if (allowBack && isBackKey(key)) return BACK_ACTION;
    if (key === "\x1b[A" && cursor > 0) cursor--;
    if (key === "\x1b[B" && cursor < options.length - 1) cursor++;
    if (key === "\x03") process.exit();
    render();
  }

  return options[cursor].value;
}

// ─── Confirm prompt ───────────────────────────────────────────────────────────

export async function confirm(message, defaultYes = true) {
  const hint = defaultYes ? "(Y/n)" : "(y/N)";
  process.stdout.write(`\n  ${chalk.bold(message)} ${chalk.dim(hint)} `);

  if (!process.stdin.isTTY || typeof process.stdin.setRawMode !== "function") {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    return new Promise((resolve) => {
      rl.question("", (answer) => {
        rl.close();
        const key = answer.trim().toLowerCase();
        if (!key) {
          resolve(defaultYes);
          return;
        }
        resolve(key === "y" || key === "yes");
      });
    });
  }

  return new Promise((resolve) => {
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.once("data", (buf) => {
      process.stdin.setRawMode(false);
      process.stdin.pause();
      const key = buf.toString().toLowerCase();
      console.log();
      if (key === "\x03") process.exit();
      resolve(key === "y" || (defaultYes && (key === "\r" || key === "\n")));
    });
  });
}

// ─── Progress display ─────────────────────────────────────────────────────────

export function printStep(label, status, detail = "") {
  const icons = {
    done: chalk.green("✓"),
    skip: chalk.dim("⏭"),
    fail: chalk.red("✗"),
    working: chalk.cyan("◌"),
  };
  const icon = icons[status] || chalk.dim("·");
  const text = status === "done" ? chalk.white(label) : chalk.dim(label);
  const det = detail ? chalk.dim(` — ${detail}`) : "";
  console.log(`  ${icon}  ${text}${det}`);
}

export function printHeader(text) {
  console.log();
  console.log(chalk.cyan.bold(`  ── ${text} ──`));
  console.log();
}

function isFullWidthCodePoint(codePoint) {
  if (Number.isNaN(codePoint)) return false;

  if (
    codePoint >= 0x1100 &&
    (codePoint <= 0x115f ||
      codePoint === 0x2329 ||
      codePoint === 0x232a ||
      (0x2e80 <= codePoint && codePoint <= 0x3247 && codePoint !== 0x303f) ||
      (0x3250 <= codePoint && codePoint <= 0x4dbf) ||
      (0x4e00 <= codePoint && codePoint <= 0xa4c6) ||
      (0xa960 <= codePoint && codePoint <= 0xa97c) ||
      (0xac00 <= codePoint && codePoint <= 0xd7a3) ||
      (0xf900 <= codePoint && codePoint <= 0xfaff) ||
      (0xfe10 <= codePoint && codePoint <= 0xfe19) ||
      (0xfe30 <= codePoint && codePoint <= 0xfe6b) ||
      (0xff01 <= codePoint && codePoint <= 0xff60) ||
      (0xffe0 <= codePoint && codePoint <= 0xffe6) ||
      (0x1b000 <= codePoint && codePoint <= 0x1b001) ||
      (0x1f200 <= codePoint && codePoint <= 0x1f251) ||
      (0x20000 <= codePoint && codePoint <= 0x3fffd))
  ) {
    return true;
  }

  return false;
}

const COMBINING_MARK_REGEX = /\p{Mark}/u;
const EMOJI_REGEX = /\p{Extended_Pictographic}/u;

function getDisplayWidth(input) {
  let width = 0;

  for (const char of String(input ?? "")) {
    const codePoint = char.codePointAt(0);
    if (!codePoint) continue;

    if (
      codePoint <= 0x1f ||
      (codePoint >= 0x7f && codePoint <= 0x9f) ||
      codePoint === 0x200d ||
      (codePoint >= 0xfe00 && codePoint <= 0xfe0f)
    ) {
      continue;
    }

    if (COMBINING_MARK_REGEX.test(char)) continue;

    width +=
      EMOJI_REGEX.test(char) || isFullWidthCodePoint(codePoint) ? 2 : 1;
  }

  return width;
}

function padDisplay(input, targetWidth) {
  const text = String(input ?? "");
  const displayWidth = getDisplayWidth(text);
  if (displayWidth >= targetWidth) return text;
  return text + " ".repeat(targetWidth - displayWidth);
}

function wrapDisplay(input, maxWidth) {
  const text = String(input ?? "");
  if (!text) return [""];
  if (maxWidth <= 0) return [text];

  const lines = [];
  let line = "";
  let lineWidth = 0;

  for (const char of text) {
    const charWidth = getDisplayWidth(char);
    if (line && lineWidth + charWidth > maxWidth) {
      lines.push(line);
      line = "";
      lineWidth = 0;
    }

    line += char;
    lineWidth += charWidth;
  }

  if (line || lines.length === 0) lines.push(line);
  return lines;
}

export function printSummary(lines) {
  const minContentWidth = 44;
  const absoluteMinContentWidth = 20;
  const framePaddingWidth = 6;
  const longestLineWidth = lines.reduce(
    (max, line) => Math.max(max, getDisplayWidth(line)),
    0,
  );
  const terminalColumns = Number(process.stdout.columns) || 0;
  const maxContentWidth =
    terminalColumns > 0
      ? Math.max(absoluteMinContentWidth, terminalColumns - framePaddingWidth)
      : Math.max(minContentWidth, longestLineWidth);
  const preferredContentWidth = Math.max(minContentWidth, longestLineWidth);
  const contentWidth = Math.min(preferredContentWidth, maxContentWidth);
  const wrappedLines = lines.flatMap((line) => wrapDisplay(line, contentWidth));
  const frameWidth = contentWidth + 2;

  console.log();
  console.log(chalk.cyan("  ╔" + "═".repeat(frameWidth) + "╗"));
  wrappedLines.forEach((l) => {
    const padded = padDisplay(l, contentWidth);
    console.log(chalk.cyan("  ║") + ` ${padded} ` + chalk.cyan("║"));
  });
  console.log(chalk.cyan("  ╚" + "═".repeat(frameWidth) + "╝"));
  console.log();
}
