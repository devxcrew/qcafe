import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { NodeSqliteDatabase } from "./database.sqlite.js";

test("separate SQLite writer processes preserve all committed updates", async () => {
  const directory = await mkdtemp(join(tmpdir(), "qcafe-writers-"));
  const path = join(directory, "writers.sqlite");
  const database = new NodeSqliteDatabase(path);
  try {
    database
      .prepare("CREATE TABLE counter(id INTEGER PRIMARY KEY, value INTEGER NOT NULL)")
      .run([]);
    database.prepare("INSERT INTO counter VALUES(1, 0)").run([]);
    await Promise.all(Array.from({ length: 4 }, () => runWriter(path)));
    assert.equal(database.prepare("SELECT value FROM counter WHERE id=1").all([])[0].value, 80n);
  } finally {
    database.close();
    await rm(directory, { recursive: true, force: true });
  }
});

function runWriter(path: string) {
  const program = `
    import { NodeSqliteDatabase } from './src/api/database/database.sqlite.ts';
    const database = new NodeSqliteDatabase(process.argv[1]);
    try {
      for(let index=0;index<20;index++) {
        database.prepare('BEGIN IMMEDIATE').run([]);
        try {
          const value=database.prepare('SELECT value FROM counter WHERE id=1').all([])[0].value;
          database.prepare('UPDATE counter SET value=? WHERE id=1').run([value+1n]);
          database.prepare('COMMIT').run([]);
        } catch(error) {
          database.prepare('ROLLBACK').run([]);
          throw error;
        }
      }
    } finally { database.close(); }
  `;
  return new Promise<void>((resolve, reject) => {
    const child = spawn(
      process.execPath,
      ["--import", "tsx", "--input-type=module", "-e", program, path],
      {
        windowsHide: true,
        stdio: "ignore",
      },
    );
    const timeout = setTimeout(() => {
      child.kill();
      reject(new Error("SQLite writer exceeded its verification deadline."));
    }, 15_000);
    child.once("error", (error) => {
      clearTimeout(timeout);
      reject(error);
    });
    child.once("exit", (code) => {
      clearTimeout(timeout);
      if (code === 0) resolve();
      else reject(new Error("Independent SQLite writer failed."));
    });
  });
}
