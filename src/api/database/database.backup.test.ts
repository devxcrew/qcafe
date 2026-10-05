import assert from "node:assert/strict";
import { mkdtemp, rm, readFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { DatabaseSync } from "node:sqlite";
import { test } from "node:test";
import { createDatabaseBackup, verifyDatabaseBackup } from "./database.backup.js";

test("SQLite backup restores committed WAL data and refuses destination overwrite", async () => {
  const directory = await mkdtemp(join(tmpdir(), "qcafe-backup-"));
  const source = join(directory, "source.sqlite");
  const destination = join(directory, "backup.sqlite");
  const database = new DatabaseSync(source);
  try {
    database.exec(
      "PRAGMA journal_mode=WAL; CREATE TABLE records(id INTEGER PRIMARY KEY, value TEXT)",
    );
    database.prepare("INSERT INTO records(value) VALUES(?)").run("persisted");
    await createDatabaseBackup(source, destination);
    verifyDatabaseBackup(destination);
    const restored = new DatabaseSync(destination);
    try {
      assert.equal(restored.prepare("SELECT value FROM records").get()?.value, "persisted");
    } finally {
      restored.close();
    }
    const original = await readFile(destination);
    await assert.rejects(createDatabaseBackup(source, destination), { code: "EEXIST" });
    assert.deepEqual(await readFile(destination), original);
    await assert.rejects(createDatabaseBackup(source, source), /must differ/);
  } finally {
    database.close();
    await rm(directory, { recursive: true, force: true });
  }
});
