import pool from "./db";

export async function initDB() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS requests (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      owner TEXT NOT NULL,
      url TEXT NOT NULL,
      method TEXT NOT NULL DEFAULT 'GET',
      headers JSONB NOT NULL DEFAULT '{}',
      body JSONB NOT NULL DEFAULT '{}',
      wallet TEXT NOT NULL,
      mode TEXT NOT NULL CHECK (mode IN ('loop', 'date')),
      time TEXT NOT NULL,
      format TEXT NOT NULL,
      active BOOLEAN NOT NULL DEFAULT true,
      pda TEXT,
      timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS txs (
      id SERIAL PRIMARY KEY,
      id_req TEXT NOT NULL REFERENCES requests(id) ON DELETE CASCADE,
      url TEXT NOT NULL,
      ts TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      data JSONB NOT NULL
    );
  `);

  // requests — add missing columns
  await pool.query(`ALTER TABLE requests ADD COLUMN IF NOT EXISTS pda TEXT`);
  await pool.query(`ALTER TABLE requests ADD COLUMN IF NOT EXISTS method TEXT NOT NULL DEFAULT 'GET'`);
  await pool.query(`ALTER TABLE requests ADD COLUMN IF NOT EXISTS headers JSONB NOT NULL DEFAULT '{}'`);
  await pool.query(`ALTER TABLE requests ADD COLUMN IF NOT EXISTS body JSONB NOT NULL DEFAULT '{}'`);

  // txs — analytics columns
  await pool.query(`ALTER TABLE txs ADD COLUMN IF NOT EXISTS sig TEXT`);
  await pool.query(`ALTER TABLE txs ADD COLUMN IF NOT EXISTS fee BIGINT NOT NULL DEFAULT 0`);
  await pool.query(`ALTER TABLE txs ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'success'`);

  console.log("[DB] Tables ready");
}
