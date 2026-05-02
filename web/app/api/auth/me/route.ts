import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

// GET /api/auth/me
export async function GET() {
  const wallet = await getSession();

  if (!wallet) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  return NextResponse.json({ authenticated: true, wallet });
}
