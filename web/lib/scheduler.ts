import { createHash } from "crypto";
import {
  Connection, Keypair, PublicKey, Transaction, TransactionInstruction,
} from "@solana/web3.js";
import bs58 from "bs58";
import pool from "./db";

const RPC        = process.env.RPC_URL         ?? "https://solana-rpc.publicnode.com";
const PROGRAM_ID = new PublicKey("LUMApBfHYJyS8cykrVKxCZgkTeHkS8t1TDiHwynT96C");

const adminKeypair = Keypair.fromSecretKey(bs58.decode(process.env.ADMIN_PRIVATE!));
const conn         = new Connection(RPC, "confirmed");

// Anchor discriminator helper
function disc(name: string): Buffer {
  return Buffer.from(createHash("sha256").update(name).digest()).slice(0, 8);
}

// Extract value from nested JSON by dot/bracket path
function getAtPath(data: unknown, path: string): unknown {
  const parts: (string | number)[] = [];
  const re = /([^.[[\]]+)|\[(\d+)\]/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(path)) !== null) parts.push(m[1] !== undefined ? m[1] : parseInt(m[2]));
  let cur: unknown = data;
  for (const p of parts) {
    if (cur == null || typeof cur !== "object") return undefined;
    cur = (cur as Record<string | number, unknown>)[p];
  }
  return cur;
}

// Track last execution time per request (for loop mode)
const lastRun    = new Map<string, number>();
// Feeds currently executing — prevents duplicate concurrent runs
const runningIds = new Set<string>();

// Send raw tx and poll signature status until confirmed or 60s timeout.
// We don't trust block-height expiry checks on load-balanced public RPCs
// (different backend nodes return wildly inconsistent block heights),
// so we just poll the signature directly.
async function sendAndConfirmRaw(conn: Connection, raw: Uint8Array, tag: string): Promise<string> {
  const sig = await conn.sendRawTransaction(raw, { skipPreflight: false, maxRetries: 5 });
  console.log(`${tag} broadcast — sig: ${sig}`);

  const startedAt = Date.now();
  while (Date.now() - startedAt < 60_000) {
    try {
      const st = await conn.getSignatureStatus(sig, { searchTransactionHistory: false });
      const cs = st?.value?.confirmationStatus;
      if (cs === "confirmed" || cs === "finalized") {
        if (st?.value?.err) throw new Error(`tx failed on-chain: ${JSON.stringify(st.value.err)}`);
        return sig;
      }
    } catch (e) {
      if (e instanceof Error && e.message.startsWith("tx failed on-chain")) throw e;
      // transient RPC errors — keep polling
    }
    await new Promise(r => setTimeout(r, 2000));
  }
  throw new Error(`confirm timeout 60s, sig: ${sig}`);
}

async function tick() {
  let rows: Record<string, unknown>[];
  try {
    ({ rows } = await pool.query(
      `SELECT id, url, method, headers, body, mode, time, format, wallet, pda, owner, name FROM requests WHERE active = true`
    ));
  } catch (err) {
    console.error("[Scheduler] DB query failed, skipping tick:", err);
    return;
  }

  if (rows.length === 0) return;

  const now      = Date.now();
  const utcHHMM  = new Date().toISOString().slice(11, 16);

  for (const row of rows) {
    const req = row as {
      id: string; url: string; method: string; headers: Record<string,string>; body: Record<string,unknown>;
      mode: string; time: string;
      format: string; wallet: string; pda: string | null; owner: string; name: string;
    };
    let shouldRun = false;

    if (req.mode === "loop") {
      const intervalMs = Number(req.time) * 1000;
      const last = lastRun.get(req.id) ?? 0;
      const sinceLastMs = now - last;
      if (sinceLastMs >= intervalMs) {
        shouldRun = true;
        console.log(`[Scheduler] [${req.id}] loop trigger — ${sinceLastMs}ms since last run (interval ${intervalMs}ms)`);
      }
    } else if (req.mode === "date") {
      const last = lastRun.get(req.id) ?? 0;
      if (req.time === utcHHMM && now - last >= 60_000) {
        shouldRun = true;
        console.log(`[Scheduler] [${req.id}] date trigger — matched ${utcHHMM} UTC`);
      }
    }

    if (shouldRun) {
      if (runningIds.has(req.id)) {
        console.warn(`[Scheduler] [${req.id}] already running, skipping tick`);
        continue;
      }
      lastRun.set(req.id, now);
      runningIds.add(req.id);
      executeRequest(req)
        .catch(async err => {
          console.error(`[Scheduler] [${req.id}] unhandled error:`, err);
          try {
            await pool.query(
              `INSERT INTO txs (id_req, url, ts, data, sig, fee, status) VALUES ($1, $2, NOW(), $3, NULL, 0, 'failed')`,
              [req.id, req.url, JSON.stringify({ error: String(err) })]
            );
          } catch { /* ignore save error */ }
        })
        .finally(() => {
          runningIds.delete(req.id);
        });
    }
  }
}

async function executeRequest(req: {
  id: string; url: string; method: string; headers: Record<string,string>; body: Record<string,unknown>;
  format: string; wallet: string; pda: string | null; owner: string; name: string;
}) {
  const tag = `[Scheduler] [${req.id}]`;
  console.log(`${tag} ▶ starting — ${req.method} ${req.url}`);

  // 1. Fetch URL — AbortController actually closes the socket on timeout
  console.log(`${tag} fetching ${req.url} ...`);
  const abort = new AbortController();
  const abortTimer = setTimeout(() => abort.abort(), 15_000);
  const fetchOpts: RequestInit = {
    method: req.method ?? "GET",
    headers: req.headers ?? {},
    signal: abort.signal,
  };
  if (req.method === "POST" && req.body && Object.keys(req.body).length > 0) {
    fetchOpts.body = JSON.stringify(req.body);
    (fetchOpts.headers as Record<string,string>)["Content-Type"] = "application/json";
  }
  const text = await (async () => {
    try {
      const r = await fetch(req.url, fetchOpts);
      if (!r.ok) throw new Error(`HTTP ${r.status} from ${req.url}`);
      return await r.text();
    } finally {
      clearTimeout(abortTimer);
    }
  })();
  let json: unknown;
  try { json = JSON.parse(text); } catch { json = text; }
  console.log(`${tag} fetch OK — ${text.length} bytes`);

  // 2. Extract selected paths -> { path: value }
  const paths = req.format.split(",").map(s => s.trim()).filter(Boolean);
  const extracted: Record<string, unknown> = {};
  paths.forEach(p => { extracted[p] = getAtPath(json, p); });
  const dataBytes = Buffer.from(JSON.stringify(extracted));
  console.log(`${tag} extracted: ${JSON.stringify(extracted)} (${dataBytes.length} bytes)`);

  // 3. Resolve feed PDA
  let feedPda: PublicKey;
  if (req.pda) {
    feedPda = new PublicKey(req.pda);
  } else {
    [feedPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("feed"), new PublicKey(req.owner).toBuffer(), Buffer.from(req.name)],
      PROGRAM_ID
    );
  }
  console.log(`${tag} feed PDA: ${feedPda.toBase58()}`);

  // 4. Build write_data instruction
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32LE(dataBytes.length, 0);
  const ixData = Buffer.concat([disc("global:write_data"), lenBuf, dataBytes]);

  const payerKp = Keypair.fromSecretKey(bs58.decode(req.wallet));
  console.log(`${tag} payer: ${payerKp.publicKey.toBase58()} | admin: ${adminKeypair.publicKey.toBase58()}`);

  const ix = new TransactionInstruction({
    programId: PROGRAM_ID,
    keys: [
      { pubkey: feedPda,                isSigner: false, isWritable: true  },
      { pubkey: adminKeypair.publicKey, isSigner: true,  isWritable: false },
      { pubkey: payerKp.publicKey,      isSigner: true,  isWritable: true  },
    ],
    data: ixData,
  });

  // 5. Build, sign, send. Use "confirmed" blockhash (newer than default "finalized").
  const { blockhash } = await conn.getLatestBlockhash("confirmed");
  const tx = new Transaction();
  tx.recentBlockhash = blockhash;
  tx.feePayer = payerKp.publicKey;
  tx.add(ix);
  tx.sign(adminKeypair, payerKp);
  const raw = tx.serialize();

  console.log(`${tag} sending transaction...`);
  const sig = await sendAndConfirmRaw(conn, raw, tag);
  console.log(`${tag} ✅ confirmed — sig: ${sig}`);
  console.log(`${tag} https://explorer.solana.com/tx/${sig}`);

  // 6. Fetch fee from tx meta
  let fee = 0;
  try {
    const txInfo = await conn.getTransaction(sig, { commitment: "confirmed", maxSupportedTransactionVersion: 0 });
    fee = txInfo?.meta?.fee ?? 0;
    console.log(`${tag} fee: ${fee} lamports (${(fee / 1e9).toFixed(9)} SOL)`);
  } catch (e) {
    console.warn(`${tag} could not fetch tx fee:`, e);
  }

  // 7. Save to txs
  await pool.query(
    `INSERT INTO txs (id_req, url, ts, data, sig, fee, status) VALUES ($1, $2, NOW(), $3, $4, $5, 'success')`,
    [req.id, req.url, JSON.stringify(extracted), sig, fee]
  );
  console.log(`${tag} saved to txs`);
}

// ── Singleton (survives HMR) ─────────────────────────────────────────────────
const g = globalThis as typeof globalThis & { __lumaSchedulerInterval?: ReturnType<typeof setInterval> };

export function startScheduler() {
  if (g.__lumaSchedulerInterval) return;
  g.__lumaSchedulerInterval = setInterval(tick, 1000);
  console.log("[Scheduler] Started");
}

export function stopScheduler() {
  if (g.__lumaSchedulerInterval) {
    clearInterval(g.__lumaSchedulerInterval);
    g.__lumaSchedulerInterval = undefined;
    console.log("[Scheduler] Stopped");
  }
}
