import fs from "fs";
import path from "path";
import { rawUrl } from "./registry.js";

export async function fetchFile(
  remotePath,
  localDest,
  { dryRun = false, force = false } = {},
) {
  if (!force && fs.existsSync(localDest)) {
    return { status: "skipped", path: localDest };
  }

  if (dryRun) {
    return { status: "would-create", path: localDest };
  }

  const url = rawUrl(remotePath);

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status} — ${url}`);
    const content = await res.text();
    fs.mkdirSync(path.dirname(localDest), { recursive: true });
    fs.writeFileSync(localDest, content, "utf8");
    return {
      status: fs.existsSync(localDest) ? "updated" : "created",
      path: localDest,
    };
  } catch (err) {
    return { status: "failed", path: localDest, error: err.message };
  }
}

export async function fetchMany(items, opts = {}) {
  const results = await Promise.all(
    items.map(({ remote, local }) => fetchFile(remote, local, opts)),
  );
  return results;
}
