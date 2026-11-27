import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pg;

// Type parser: parse BIGINT as integers and NUMERIC as float numbers
pg.types.setTypeParser(20, (val) => (val === null ? null : parseInt(val, 10)));
pg.types.setTypeParser(1700, (val) => (val === null ? null : parseFloat(val)));

let poolInstance = null;

export function getPool() {
  if (!poolInstance) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error(
        "DATABASE_URL environment variable is missing. Please configure your Neon PostgreSQL connection string."
      );
    }

    const isNeon = connectionString.includes("neon.tech") || connectionString.includes("sslmode=");
    const ssl =
      isNeon || process.env.NODE_ENV === "production"
        ? { rejectUnauthorized: false }
        : false;

    poolInstance = new Pool({
      connectionString,
      ssl,
      max: process.env.NODE_ENV === "production" ? 10 : 5,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });

    poolInstance.on("error", (err) => {
      console.error("[PostgreSQL Pool Error]", err);
    });
  }

  return poolInstance;
}

export function setTestPool(customPool) {
  poolInstance = customPool;
}

export async function query(text, params) {
  const pool = getPool();
  return pool.query(text, params);
}
