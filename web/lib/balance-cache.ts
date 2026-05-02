import { Connection, PublicKey } from "@solana/web3.js";

const RPC = process.env.RPC_URL ?? "https://solana-rpc.publicnode.com";

type BalanceEntry = { lamports: number; sol: number; updatedAt: number };

// Persist across Next.js HMR module re-initializations
const g = globalThis as typeof globalThis & {
  __lumaBalanceCache?: Map<string, BalanceEntry>;
  __lumaWatchList?: Map<string, string>;
  __lumaPollerStarted?: boolean;
};

const cache: Map<string, BalanceEntry> = g.__lumaBalanceCache ?? (g.__lumaBalanceCache = new Map());
const watchList: Map<string, string>   = g.__lumaWatchList   ?? (g.__lumaWatchList   = new Map());

export function registerPubkeys(entries: { id: string; pubkey: string }[]) {
  for (const e of entries) {
    if (!watchList.has(e.pubkey)) watchList.set(e.pubkey, e.id);
  }
  if (!g.__lumaPollerStarted) startPoller();
}

export function getCachedBalance(pubkey: string): BalanceEntry | null {
  return cache.get(pubkey) ?? null;
}

function startPoller() {
  g.__lumaPollerStarted = true;
  const conn = new Connection(RPC, "confirmed");

  async function poll() {
    const pubkeyStrs = Array.from(watchList.keys());
    if (pubkeyStrs.length > 0) {
      try {
        const now = Date.now();
        // getMultipleAccountsInfo limit = 100 per call
        for (let i = 0; i < pubkeyStrs.length; i += 100) {
          const chunk = pubkeyStrs.slice(i, i + 100);
          const accounts = await conn.getMultipleAccountsInfo(chunk.map(p => new PublicKey(p)));
          chunk.forEach((p, j) => {
            const lamports = accounts[j]?.lamports ?? 0;
            cache.set(p, { lamports, sol: lamports / 1e9, updatedAt: now });
          });
        }
      } catch { /* silent — keep stale cache */ }
    }
    setTimeout(poll, 2000);
  }

  poll();
}
