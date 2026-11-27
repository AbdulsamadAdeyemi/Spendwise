import dotenv from "dotenv";
import { getPool } from "./database.js";
import { SCHEMA_SQL } from "./schema.js";

dotenv.config();

export async function runMigrations(customPool = null) {
  const pool = customPool || getPool();
  console.log("[Migration] Running PostgreSQL schema migrations...");

  const client = await pool.connect();
  try {
    await client.query("BEGIN;");
    await client.query(SCHEMA_SQL);
    await client.query("COMMIT;");
    console.log("[Migration] PostgreSQL schema migrations completed successfully.");
    return { success: true };
  } catch (error) {
    await client.query("ROLLBACK;");
    console.error("[Migration] Schema migration failed:", error);
    throw error;
  } finally {
    client.release();
  }
}

// If executed directly from CLI
if (process.argv[1] && process.argv[1].endsWith("migrate.js")) {
  runMigrations()
    .then(() => {
      console.log("[Migration] Process finished.");
      process.exit(0);
    })
    .catch((err) => {
      console.error("[Migration] Failed:", err.message);
      process.exit(1);
    });
}
