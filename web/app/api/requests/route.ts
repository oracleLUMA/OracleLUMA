import { NextResponse } from "next/server";
import { Keypair } from "@solana/web3.js";
import bs58 from "bs58";
import pool from "@/lib/db";
import { getSession } from "@/lib/auth";
import { registerPubkeys, getCachedBalance } from "@/lib/balance-cache";

export async function GET() {
  const owner = await getSession();
  if (!owner) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const result = await pool.query(
    `SELECT id, name, url, mode, time, format, active, pda, wallet, timestamp FROM requests WHERE owner = $1 ORDER BY timestamp DESC`,
    [owner]
  );

  const rows = result.rows as {
    id: string; name: string; url: string; mode: string; time: string;
    format: string; active: boolean; pda: string | null; wallet: string; timestamp: string;
  }[];

  const derived = rows.map(r => {
    const kp = Keypair.fromSecretKey(bs58.decode(r.wallet));
    return { id: r.id, pubkey: kp.publicKey.toBase58(), row: r };
  });

  // Register pubkeys for background polling
  registerPubkeys(derived.map(d => ({ id: d.id, pubkey: d.pubkey })));

  const requests = derived.map(({ id, pubkey, row }) => {
    const bal = getCachedBalance(pubkey);
    return {
      id,
      name: row.name,
      url: row.url,
      mode: row.mode,
      time: row.time,
      format: row.format,
      active: row.active,
      pda: row.pda,
      timestamp: row.timestamp,
      walletPubkey: pubkey,
      balance: bal ? { lamports: bal.lamports, sol: bal.sol } : null,
    };
  });

  return NextResponse.json({ requests });
}
