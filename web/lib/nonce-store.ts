// In-memory nonce store with TTL (5 min)
// For production with multiple instances, move to Redis or DB

const store = new Map<string, { nonce: string; expires: number }>();

const TTL = 5 * 60 * 1000; // 5 minutes

export function createNonce(wallet: string): string {
  const nonce = crypto.randomUUID();
  store.set(wallet, { nonce, expires: Date.now() + TTL });
  return nonce;
}

export function verifyNonce(wallet: string, nonce: string): boolean {
  const entry = store.get(wallet);
  if (!entry) return false;
  if (Date.now() > entry.expires) {
    store.delete(wallet);
    return false;
  }
  if (entry.nonce !== nonce) return false;
  store.delete(wallet); // one-time use
  return true;
}
