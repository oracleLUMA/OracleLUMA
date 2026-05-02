import { NextRequest, NextResponse } from "next/server";
import nacl from "tweetnacl";
import bs58 from "bs58";
import { verifyNonce } from "@/lib/nonce-store";
import { createSession } from "@/lib/auth";

// POST /api/auth/verify
// Body: { wallet, nonce, signature }
export async function POST(req: NextRequest) {
  const { wallet, nonce, signature } = await req.json();

  if (!wallet || !nonce || !signature) {
    return NextResponse.json({ error: "wallet, nonce, signature required" }, { status: 400 });
  }

  // Check nonce is valid and not expired
  if (!verifyNonce(wallet, nonce)) {
    return NextResponse.json({ error: "invalid or expired nonce" }, { status: 401 });
  }

  // Verify signature
  const message = new TextEncoder().encode(
    `Sign this message to authenticate with LUMA:\n${nonce}`
  );
  const sig = typeof signature === "string" ? bs58.decode(signature) : new Uint8Array(signature);
  const pubkey = bs58.decode(wallet);

  const valid = nacl.sign.detached.verify(message, sig, pubkey);
  if (!valid) {
    return NextResponse.json({ error: "invalid signature" }, { status: 401 });
  }

  // Create session cookie
  await createSession(wallet);

  return NextResponse.json({ ok: true, wallet });
}
