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
`) + chalk.dim("  AI Vibe Coding Bootstrap  v0.1.0\n");

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
}) {
  const selected = new Set([...required, ...initial]);
  let cursor = 0;

  const render = () => {
    process.stdout.write("\x1b[2J\x1b[H"); // clear
    console.log(VIBE_ART);
    console.log(chalk.bold(`  ${title}\n`));
    console.log(chalk.dim("  [Space] toggle  [Enter] confirm  [↑↓] move\n"));

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
    const count = selected.size - required.length;
    console.log(
      chalk.dim(`  ${count} selected (+ ${required.length} required)`),
    );
  };

  render();

  while (true) {
    const key = await getRawKey();

    if (key === "\r" || key === "\n") break; // Enter
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

export async function singleSelect({ title, options, subtitle = "", initial = 0 }) {
  let cursor = Math.min(Math.max(initial, 0), Math.max(options.length - 1, 0));

  const render = () => {
    process.stdout.write("\x1b[2J\x1b[H");
    console.log(VIBE_ART);
    console.log(chalk.bold(`  ${title}\n`));
    if (subtitle) console.log(chalk.dim(`  ${subtitle}\n`));
    console.log(chalk.dim("  [↑↓] move  [Enter] select\n"));

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

  return new Promise((resolve) => {
    process.stdin.setRawMode(true);
    process.stdin.once("data", (buf) => {
      process.stdin.setRawMode(false);
      const key = buf.toString().toLowerCase();
      console.log();
      if (key === "\x03") process.exit();
      resolve(key === "y" || (defaultYes && key === "\r"));
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

export function printSummary(lines) {
  console.log();
  console.log(chalk.cyan("  ╔" + "═".repeat(44) + "╗"));
  lines.forEach((l) => {
    const padded = l.padEnd(44);
    console.log(chalk.cyan("  ║") + ` ${padded}` + chalk.cyan(" ║"));
  });
  console.log(chalk.cyan("  ╚" + "═".repeat(44) + "╝"));
  console.log();
}
