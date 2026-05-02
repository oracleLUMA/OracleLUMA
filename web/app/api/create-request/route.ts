import { NextRequest, NextResponse } from "next/server";
import { Keypair } from "@solana/web3.js";
import bs58 from "bs58";
import pool from "@/lib/db";
import { getSession } from "@/lib/auth";

function generateId(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const block = () =>
    Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  return `${block()}-${block()}-${block()}`;
}

// POST /api/create-request
// Body: { name, url, format, mode, time }
export async function POST(req: NextRequest) {
  const owner = await getSession();
  if (!owner) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { name, url, method, headers, body, format, mode, time, pda } = await req.json();

  if (!name || !url || !format || !mode || !time) {
    return NextResponse.json({ error: "name, url, format, mode, time required" }, { status: 400 });
  }

  if (mode !== "loop" && mode !== "date") {
    return NextResponse.json({ error: "mode must be 'loop' or 'date'" }, { status: 400 });
  }

  // Generate new Solana keypair
  const keypair = Keypair.generate();
  const publicKey = keypair.publicKey.toBase58();
  const secretKey = bs58.encode(keypair.secretKey);

  const id = generateId();

  // wallet stores the secret key (used by backend to sign txs)
  await pool.query(
    `INSERT INTO requests (id, name, owner, url, method, headers, body, wallet, mode, time, format, pda)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
    [id, name, owner, url, method ?? "GET", JSON.stringify(headers ?? {}), JSON.stringify(body ?? {}), secretKey, mode, time, format, pda ?? null]
  );

  return NextResponse.json({
    success: true,
    id,
    name,
    wallet: publicKey,
    pda: pda ?? null,
  });
}
