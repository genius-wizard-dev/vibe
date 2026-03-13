import chalk from "chalk";
import fs from "fs";
import os from "os";
import path from "path";
import { RUNTIMES } from "./registry.js";
import { VIBE_ART, printHeader } from "./tui.js";

function expandHome(p) {
  return p?.startsWith("~") ? path.join(os.homedir(), p.slice(1)) : p;
}

export async function runList() {
  const cwd = process.cwd();
  process.stdout.write("\x1b[2J\x1b[H");
  console.log(VIBE_ART);
  printHeader("Installed Commands");

  for (const rt of Object.values(RUNTIMES)) {
    const locations = [
      {
        scope: "local",
        dir: rt.localDir ? path.join(cwd, rt.localDir) : null,
      },
      {
        scope: "global",
        dir: expandHome(rt.globalDir),
      },
    ];

    for (const location of locations) {
      if (!location.dir || !fs.existsSync(location.dir)) continue;

      const files = fs
        .readdirSync(location.dir)
        .filter((f) => f.endsWith(".md") && f.startsWith("vibe."));
      if (files.length === 0) continue;

      const shortDir = location.dir.replace(os.homedir(), "~");
      console.log(
        chalk.cyan(`  ${rt.label} (${location.scope})`) + chalk.dim(`  ${shortDir}/`),
      );
      files.forEach((f) => {
        const name = f.replace(".md", "");
        console.log(`    ${chalk.white("/" + name)}`);
      });
      console.log();
    }
  }

  // State file
  const stateFile = path.join(cwd, ".vibe/state.md");
  printHeader("State");
  if (fs.existsSync(stateFile)) {
    const content = fs.readFileSync(stateFile, "utf8");
    const steps = content.match(/## \[(.*?)\] status: (.*)/g) || [];
    steps.forEach((s) => {
      const [, step, status] = s.match(/## \[(.*?)\] status: (.*)/) || [];
      const icon = status?.includes("✅")
        ? chalk.green("✅")
        : status?.includes("🔄")
          ? chalk.cyan("🔄")
          : status?.includes("❌")
            ? chalk.red("❌")
            : chalk.dim("⏸");
      console.log(
        `  ${icon}  ${chalk.dim(step?.toLowerCase())}  ${chalk.dim(status?.replace(/[✅🔄⏸❌]/g, "").trim())}`,
      );
    });
    console.log();
    console.log(chalk.dim("  Run /vibe.resume to continue setup"));
  } else {
    console.log(chalk.dim("  No state yet — run /vibe.setup to start"));
  }
  console.log();

}

export async function runUpdate(args) {
  console.log(chalk.cyan("\n  🔄 Updating vibe commands from GitHub...\n"));
  const { runSetup } = await import("./setup.js");
  await runSetup([...args, "--force"]);
}
