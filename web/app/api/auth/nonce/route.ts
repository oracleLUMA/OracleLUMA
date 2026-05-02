import { NextRequest, NextResponse } from "next/server";
import { createNonce } from "@/lib/nonce-store";

// GET /api/auth/nonce?wallet=<pubkey>
export async function GET(req: NextRequest) {
  const wallet = req.nextUrl.searchParams.get("wallet");
  if (!wallet) {
    return NextResponse.json({ error: "wallet required" }, { status: 400 });
  }

  const nonce = createNonce(wallet);

  return NextResponse.json({
    nonce,
    message: `Sign this message to authenticate with LUMA:\n${nonce}`,
  });
}
