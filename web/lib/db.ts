import { Pool } from "pg";

const pool = new Pool({
  user: process.env.POSTGRE_USER,
  password: process.env.POSTGRE_PASS,
  host: process.env.POSTGRE_IP,
  port: Number(process.env.POSTGRE_PORT) || 5432,
  database: process.env.POSTGRE_BD,
  max: 10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
});

// Prevent "Connection terminated unexpectedly" from becoming unhandledRejection.
// pg emits 'error' on the pool when an idle client dies — without a handler
// Node.js treats it as an uncaught error and crashes.
pool.on("error", (err) => {
  console.error("[DB Pool] idle client error:", err.message);
});

export default pool;
