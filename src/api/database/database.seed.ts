import type { Kysely } from "kysely";
import type { DatabaseSchema } from "./database.types.js";

export async function seedDatabase(database: Kysely<DatabaseSchema>, applicationName: string) {
  await database
    .insertInto("application_metadata")
    .values({ key: "application_name", value: applicationName })
    .onConflict((conflict) => conflict.column("key").doNothing())
    .execute();
}
