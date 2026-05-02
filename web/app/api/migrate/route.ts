import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET() {
  // requests columns
  await pool.query(`ALTER TABLE requests ADD COLUMN IF NOT EXISTS pda TEXT`);
  await pool.query(`ALTER TABLE requests ADD COLUMN IF NOT EXISTS method TEXT NOT NULL DEFAULT 'GET'`);
  await pool.query(`ALTER TABLE requests ADD COLUMN IF NOT EXISTS headers JSONB NOT NULL DEFAULT '{}'`);
  await pool.query(`ALTER TABLE requests ADD COLUMN IF NOT EXISTS body JSONB NOT NULL DEFAULT '{}'`);

  // txs — analytics columns
  await pool.query(`ALTER TABLE txs ADD COLUMN IF NOT EXISTS sig TEXT`);
  await pool.query(`ALTER TABLE txs ADD COLUMN IF NOT EXISTS fee BIGINT NOT NULL DEFAULT 0`);
  await pool.query(`ALTER TABLE txs ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'success'`);

  return NextResponse.json({ ok: true });
}
