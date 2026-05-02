import { NextResponse } from "next/server";
import { deleteSession } from "@/lib/auth";

// POST /api/auth/logout
export async function POST() {
  await deleteSession();
  return NextResponse.json({ ok: true });
}
