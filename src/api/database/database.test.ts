import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { sql } from "kysely";
import { createDatabaseProvider } from "./database.provider.js";

test("SQLite migrations, seeds, transactions, and persistence", async () => {
  const directory = await mkdtemp(join(tmpdir(), "qcafe-sqlite-"));
  const environment = {
    DB_SQLITE_PATH: join(directory, "nested", "test.sqlite"),
    APP_NAME: "Test app",
  };
  let provider = createDatabaseProvider(environment);
  try {
    await provider.verify();
    assert.equal((await provider.migrate())[0].status, "Success");
    assert.deepEqual(await provider.migrate(), []);
    await provider.seed();
    await provider.seed();
    assert.deepEqual(
      (await provider.database.selectFrom("application_metadata").selectAll().execute()).map(
        (row) => ({ ...row }),
      ),
      [{ key: "application_name", value: "Test app" }],
    );
    await assert.rejects(
      provider.database.transaction().execute(async (transaction) => {
        await transaction
          .insertInto("application_metadata")
          .values({ key: "rollback", value: "temporary" })
          .execute();
        throw new Error("Rollback test");
      }),
      /Rollback test/,
    );
    assert.equal(
      (await provider.database.selectFrom("application_metadata").selectAll().execute()).length,
      1,
    );
    const result = await sql<{ foreign_keys: bigint }>`PRAGMA foreign_keys`.execute(
      provider.database,
    );
    assert.equal(result.rows[0].foreign_keys, 1n);
    await provider.close();
    provider = createDatabaseProvider(environment);
    assert.equal(
      (await provider.database.selectFrom("application_metadata").selectAll().execute())[0].value,
      "Test app",
    );
    await provider.database
      .updateTable("application_metadata")
      .set({ value: "Edited" })
      .where("key", "=", "application_name")
      .execute();
    await provider.seed();
    assert.equal(
      (await provider.database.selectFrom("application_metadata").selectAll().execute())[0].value,
      "Edited",
    );
  } finally {
    await provider.close();
    await rm(directory, { recursive: true, force: true });
  }
});

test("SQLite rejects empty paths and seed before migration", async () => {
  assert.throws(() => createDatabaseProvider({ DB_SQLITE_PATH: " " }), /must not be empty/);
  assert.throws(() => createDatabaseProvider({ DB_SQLITE_PATH: ":memory:" }), /persisted/);
  assert.throws(
    () => createDatabaseProvider({ DB_SQLITE_PATH: "file:test?mode=memory" }),
    /persisted/,
  );
  const directory = await mkdtemp(join(tmpdir(), "qcafe-unmigrated-"));
  const provider = createDatabaseProvider({ DB_SQLITE_PATH: join(directory, "test.sqlite") });
  try {
    await assert.rejects(provider.seed(), /no such table/);
  } finally {
    await provider.close();
    await rm(directory, { recursive: true, force: true });
  }
});
