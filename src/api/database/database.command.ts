import { createDatabaseProvider } from "./database.provider.js";
import { createDatabaseBackup, verifyDatabaseBackup } from "./database.backup.js";

const command = process.argv[2];
if (!["migrate", "seed", "check", "backup", "verify-backup"].includes(command)) {
  throw new Error("Use database.command.ts migrate, seed, check, backup, or verify-backup.");
}
if (command === "backup" || command === "verify-backup") {
  const destination = process.argv[3];
  if (!destination) throw new Error("Supply a backup file path.");
  if (command === "backup") {
    await createDatabaseBackup(process.env.DB_SQLITE_PATH ?? "storage/qcafe.sqlite", destination);
    console.info("SQLite backup completed and integrity checks passed.");
  } else {
    verifyDatabaseBackup(destination);
    console.info("SQLite backup integrity checks passed.");
  }
} else {
  const provider = createDatabaseProvider();
  try {
    if (command === "migrate") {
      const results = await provider.migrate();
      for (const result of results) console.info(`${result.migrationName}: ${result.status}`);
      if (!results.length) console.info("Database migrations are current.");
    } else if (command === "seed") {
      await provider.seed();
      console.info("Database seed completed.");
    } else {
      await provider.verify();
      console.info("SQLite connection passed.");
    }
  } finally {
    await provider.close();
  }
}
