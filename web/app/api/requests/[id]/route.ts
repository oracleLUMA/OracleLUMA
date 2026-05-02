import { NextRequest, NextResponse } from "next/server";
import { Keypair } from "@solana/web3.js";
import bs58 from "bs58";
import pool from "@/lib/db";
import { getSession } from "@/lib/auth";
import { registerPubkeys, getCachedBalance } from "@/lib/balance-cache";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const owner = await getSession();
  if (!owner) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id } = await params;
  const result = await pool.query(
    `SELECT id, name, url, method, headers, body, mode, time, format, active, pda, wallet, timestamp FROM requests WHERE id = $1 AND owner = $2`,
    [id, owner]
  );

  if (result.rows.length === 0) return NextResponse.json({ error: "not found" }, { status: 404 });

  const row = result.rows[0];
  const kp = Keypair.fromSecretKey(bs58.decode(row.wallet));
  const walletPubkey = kp.publicKey.toBase58();

  // Register for background polling
  registerPubkeys([{ id, pubkey: walletPubkey }]);
  const bal = getCachedBalance(walletPubkey);

  const txs = await pool.query(
    `SELECT id, ts, data, sig, fee, status FROM txs WHERE id_req = $1 ORDER BY ts DESC LIMIT 20`,
    [id]
  );

  const stats = await pool.query<{ total_txs: string; success_txs: string; total_fee_lamports: string }>(
    `SELECT COUNT(id)::text AS total_txs,
            SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END)::text AS success_txs,
            COALESCE(SUM(fee), 0)::text AS total_fee_lamports
     FROM txs WHERE id_req = $1`,
    [id]
  );
  const st = stats.rows[0];

  return NextResponse.json({
    oracle: {
      id: row.id,
      name: row.name,
      url: row.url,
      method: row.method ?? "GET",
      headers: row.headers ?? {},
      body: row.body ?? {},
      mode: row.mode,
      time: row.time,
      format: row.format,
      active: row.active,
      pda: row.pda,
      walletPubkey,
      balance: bal ? { lamports: bal.lamports, sol: bal.sol } : null,
      timestamp: row.timestamp,
    },
    txs: txs.rows,
    stats: {
      total_txs:     parseInt(st.total_txs ?? "0"),
      success_txs:   parseInt(st.success_txs ?? "0"),
      total_fee_sol: parseInt(st.total_fee_lamports ?? "0") / 1e9,
    },
  });
}
