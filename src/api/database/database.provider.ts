import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { Kysely, SqliteDialect, sql } from "kysely";
import { seedIdentity } from "@devxcrew/platform";
import { NodeSqliteDatabase } from "./database.sqlite.js";
import { createDatabaseMigrator } from "./database.migration.js";
import { seedDatabase } from "./database.seed.js";
import type { DatabaseSchema } from "./database.types.js";

export function createDatabaseProvider(environment: NodeJS.ProcessEnv = process.env) {
  const configuredPath = environment.DB_SQLITE_PATH ?? "storage/qcafe.sqlite";
  if (!configuredPath.trim()) throw new Error("DB_SQLITE_PATH must not be empty.");
  if (configuredPath === ":memory:" || configuredPath.startsWith("file:")) {
    throw new Error("DB_SQLITE_PATH must identify a persisted SQLite file.");
  }
  const path = resolve(configuredPath);
  mkdirSync(dirname(path), { recursive: true });
  const database = new Kysely<DatabaseSchema>({
    dialect: new SqliteDialect({ database: new NodeSqliteDatabase(path) }),
  });
  const migrator = createDatabaseMigrator(database);
  return {
    database,
    async verify() {
      await sql`select 1`.execute(database);
    },
    async migrate() {
      const result = await migrator.migrateToLatest();
      if (result.error) throw result.error;
      return result.results ?? [];
    },
    async seed() {
      await seedDatabase(database, environment.APP_NAME ?? "QCafe");
      await seedIdentity(database, environment);
    },
    close: () => database.destroy(),
  };
}
