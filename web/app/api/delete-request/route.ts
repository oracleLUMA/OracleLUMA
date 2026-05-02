import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { getSession } from "@/lib/auth";

// DELETE /api/delete-request
// Body: { id }
export async function DELETE(req: NextRequest) {
  const owner = await getSession();
  if (!owner) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { id } = await req.json();

  if (!id) {
    return NextResponse.json({ error: "id required" }, { status: 400 });
  }

  const existing = await pool.query("SELECT owner FROM requests WHERE id = $1", [id]);
  if (existing.rows.length === 0) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  if (existing.rows[0].owner !== owner) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  // CASCADE удалит связанные txs
  await pool.query("DELETE FROM requests WHERE id = $1", [id]);

  return NextResponse.json({ success: true, id });
}
