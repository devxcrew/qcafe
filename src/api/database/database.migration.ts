import type { Kysely } from "kysely";
import { type Migration, Migrator } from "kysely/migration";
import {
  identityMigration,
  identityAdministrationMigration,
  identityRolesMigration,
  identityPermissionDeclarationsMigration,
  identityPermissionLabelsMigration,
} from "@devxcrew/platform";

const foundation: Migration = {
  async up(database) {
    await database.schema
      .createTable("application_metadata")
      .addColumn("key", "text", (column) => column.primaryKey())
      .addColumn("value", "text", (column) => column.notNull())
      .execute();
  },
  async down(database) {
    await database.schema.dropTable("application_metadata").execute();
  },
};

export function createDatabaseMigrator<Schema>(database: Kysely<Schema>) {
  return new Migrator({
    db: database,
    provider: {
      async getMigrations() {
        return {
          "001_application_metadata": foundation,
          "002_platform_identity": identityMigration,
          "003_platform_identity_administration": identityAdministrationMigration,
          "004_platform_identity_roles": identityRolesMigration,
          "005_platform_identity_permission_declarations": identityPermissionDeclarationsMigration,
          "006_platform_identity_permission_labels": identityPermissionLabelsMigration,
        };
      },
    },
  });
}
