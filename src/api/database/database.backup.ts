import { mkdir, mkdtemp, link, rm, access } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { DatabaseSync, backup } from "node:sqlite";

export async function createDatabaseBackup(sourcePath: string, destinationPath: string) {
  if (!sourcePath.trim() || !destinationPath.trim() || sourcePath === ":memory:") {
    throw new Error("Backup requires a source file and a new destination file.");
  }
  const source = resolve(sourcePath);
  const destination = resolve(destinationPath);
  if (source === destination) throw new Error("Backup destination must differ from its source.");
  await access(source);
  await mkdir(dirname(destination), { recursive: true });
  const directory = await mkdtemp(join(dirname(destination), ".sqlite-backup-"));
  const snapshot = join(directory, "snapshot.sqlite");
  let database: DatabaseSync | undefined;
  try {
    database = new DatabaseSync(source, { readOnly: true });
    await backup(database, snapshot);
    verifyDatabaseBackup(snapshot);
    // Exclusive linking preserves an existing destination and exposes only a complete snapshot.
    await link(snapshot, destination);
  } finally {
    database?.close();
    await rm(directory, { recursive: true, force: true });
  }
}

export function verifyDatabaseBackup(path: string) {
  const database = new DatabaseSync(resolve(path), { readOnly: true });
  try {
    const checks = database.prepare("PRAGMA integrity_check").all();
    if (checks.length !== 1 || checks[0].integrity_check !== "ok") {
      throw new Error("SQLite backup integrity check failed.");
    }
    if (database.prepare("PRAGMA foreign_key_check").all().length) {
      throw new Error("SQLite backup contains foreign key violations.");
    }
  } finally {
    database.close();
  }
}
