import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { closeDatabase, openDatabase, withTransaction } from "./db.js";

const CURRENT_DIR = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_MIGRATIONS_DIR = path.resolve(CURRENT_DIR, "migrations");

function ensureMigrationsTable(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      applied_at INTEGER NOT NULL
    );
  `);
}

function listMigrationFiles(migrationsDir) {
  if (!fs.existsSync(migrationsDir)) return [];

  return fs
    .readdirSync(migrationsDir)
    .filter((fileName) => /^\d+_.*\.sql$/i.test(fileName))
    .sort((a, b) => {
      const versionA = Number.parseInt(a.split("_")[0], 10);
      const versionB = Number.parseInt(b.split("_")[0], 10);
      return versionA - versionB;
    });
}

function getAppliedVersions(db) {
  ensureMigrationsTable(db);
  const rows = db.prepare("SELECT version FROM schema_migrations").all();
  return new Set(rows.map((row) => Number(row.version)));
}

function parseVersion(fileName) {
  const prefix = fileName.split("_")[0];
  const version = Number.parseInt(prefix, 10);
  if (Number.isNaN(version)) {
    throw new Error(`Invalid migration filename: ${fileName}`);
  }
  return version;
}

export function runMigrations(db, migrationsDir = DEFAULT_MIGRATIONS_DIR) {
  ensureMigrationsTable(db);

  const files = listMigrationFiles(migrationsDir);
  const appliedVersions = getAppliedVersions(db);
  const applied = [];

  for (const fileName of files) {
    const version = parseVersion(fileName);
    if (appliedVersions.has(version)) continue;

    const migrationPath = path.join(migrationsDir, fileName);
    const sql = fs.readFileSync(migrationPath, "utf8").trim();
    if (!sql) continue;

    withTransaction(db, () => {
      db.exec(sql);
      db.prepare(
        "INSERT INTO schema_migrations (version, name, applied_at) VALUES (?, ?, ?)",
      ).run(version, fileName, Date.now());
    });

    applied.push(fileName);
  }

  return applied;
}

export function ensureInitialized(db) {
  const tableExists = db
    .prepare(
      "SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'schema_migrations'",
    )
    .get();

  if (!tableExists) {
    throw new Error("Conversation DB is not initialized. Run: vibe convo init");
  }
}

export function initializeDatabase(inputPath) {
  const { db, dbPath } = openDatabase(inputPath);
  try {
    const applied = runMigrations(db);
    return { dbPath, applied };
  } finally {
    closeDatabase(db);
  }
}
