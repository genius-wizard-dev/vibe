import fs from "fs";
import { createRequire } from "module";
import path from "path";
import { DEFAULT_BUSY_TIMEOUT_MS, DEFAULT_DB_PATH } from "./contracts.js";

const require = createRequire(import.meta.url);
let CachedDatabaseSync = null;

function getDatabaseSync() {
  if (!CachedDatabaseSync) {
    try {
      ({ DatabaseSync: CachedDatabaseSync } = require("node:sqlite"));
    } catch (error) {
      throw new Error(
        "Conversation database requires Node.js 22+ (built-in module 'node:sqlite'). Upgrade Node.js and retry.",
        { cause: error },
      );
    }
  }
  return CachedDatabaseSync;
}

export function resolveDbPath(inputPath) {
  const rawPath = inputPath || DEFAULT_DB_PATH;
  return path.resolve(process.cwd(), rawPath);
}

function ensureParentDir(dbPath) {
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
}

export function openDatabase(inputPath) {
  const dbPath = resolveDbPath(inputPath);
  ensureParentDir(dbPath);

  const DatabaseSync = getDatabaseSync();
  const db = new DatabaseSync(dbPath);
  db.exec("PRAGMA foreign_keys = ON;");
  db.exec("PRAGMA journal_mode = WAL;");
  db.exec(`PRAGMA busy_timeout = ${DEFAULT_BUSY_TIMEOUT_MS};`);

  return { db, dbPath };
}

export function closeDatabase(db) {
  if (!db) return;
  db.close();
}

export function withTransaction(db, handler) {
  db.exec("BEGIN IMMEDIATE;");
  try {
    const result = handler();
    db.exec("COMMIT;");
    return result;
  } catch (error) {
    try {
      db.exec("ROLLBACK;");
    } catch {
      // no-op
    }
    throw error;
  }
}
