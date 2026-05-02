import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET() {
  const owner = await getSession();
  if (!owner) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  // Overall totals
  const totals = await pool.query<{
    total_txs: string; success_txs: string; total_fee_lamports: string;
  }>(`
    SELECT
      COUNT(t.id)::text                                              AS total_txs,
      SUM(CASE WHEN t.status = 'success' THEN 1 ELSE 0 END)::text  AS success_txs,
      COALESCE(SUM(t.fee), 0)::text                                 AS total_fee_lamports
    FROM txs t
    JOIN requests r ON r.id = t.id_req
    WHERE r.owner = $1
  `, [owner]);

  // By day — last 14 days
  const byDay = await pool.query<{
    date: string; txs: string; success_txs: string; fee_lamports: string;
  }>(`
    SELECT
      DATE_TRUNC('day', t.ts AT TIME ZONE 'UTC')::date::text        AS date,
      COUNT(t.id)::text                                              AS txs,
      SUM(CASE WHEN t.status = 'success' THEN 1 ELSE 0 END)::text  AS success_txs,
      COALESCE(SUM(t.fee), 0)::text                                 AS fee_lamports
    FROM txs t
    JOIN requests r ON r.id = t.id_req
    WHERE r.owner = $1 AND t.ts >= NOW() - INTERVAL '14 days'
    GROUP BY date
    ORDER BY date ASC
  `, [owner]);

  // By oracle
  const byOracle = await pool.query<{
    id: string; name: string; txs: string; success_txs: string; fee_lamports: string;
  }>(`
    SELECT
      r.id,
      r.name,
      COUNT(t.id)::text                                              AS txs,
      SUM(CASE WHEN t.status = 'success' THEN 1 ELSE 0 END)::text  AS success_txs,
      COALESCE(SUM(t.fee), 0)::text                                 AS fee_lamports
    FROM requests r
    LEFT JOIN txs t ON t.id_req = r.id
    WHERE r.owner = $1
    GROUP BY r.id, r.name
    ORDER BY COUNT(t.id) DESC
  `, [owner]);

  const s = totals.rows[0];
  const totalTxs    = parseInt(s.total_txs    ?? "0");
  const successTxs  = parseInt(s.success_txs  ?? "0");
  const totalFee    = parseInt(s.total_fee_lamports ?? "0");

  return NextResponse.json({
    total_txs:      totalTxs,
    success_txs:    successTxs,
    failed_txs:     totalTxs - successTxs,
    total_fee_sol:  totalFee / 1e9,
    by_day: byDay.rows.map(r => ({
      date:        r.date,
      txs:         parseInt(r.txs),
      success_txs: parseInt(r.success_txs),
      fee_sol:     parseInt(r.fee_lamports) / 1e9,
    })),
    by_oracle: byOracle.rows.map(r => ({
      id:          r.id,
      name:        r.name,
      txs:         parseInt(r.txs),
      success_txs: parseInt(r.success_txs),
      fee_sol:     parseInt(r.fee_lamports) / 1e9,
    })),
  });
}
