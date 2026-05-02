import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { getSession } from "@/lib/auth";

// PATCH /api/edit-request
// Editable: url, format, mode, time, active
// Immutable: name (part of PDA seed)
export async function PATCH(req: NextRequest) {
  const owner = await getSession();
  if (!owner) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id, url, method, headers, body, format, mode, time, active } = await req.json();

  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  if (mode && mode !== "loop" && mode !== "date")
    return NextResponse.json({ error: "mode must be 'loop' or 'date'" }, { status: 400 });

  const existing = await pool.query("SELECT owner FROM requests WHERE id = $1", [id]);
  if (existing.rows.length === 0) return NextResponse.json({ error: "not found" }, { status: 404 });
  if (existing.rows[0].owner !== owner) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const fields: string[] = [];
  const values: unknown[] = [];
  let i = 1;

  if (url     !== undefined && url     !== null) { fields.push(`url = $${i++}`);     values.push(url); }
  if (method  !== undefined && method  !== null) { fields.push(`method = $${i++}`);  values.push(method); }
  if (headers !== undefined && headers !== null) { fields.push(`headers = $${i++}`); values.push(JSON.stringify(headers)); }
  if (body    !== undefined && body    !== null) { fields.push(`body = $${i++}`);    values.push(JSON.stringify(body)); }
  if (format  !== undefined && format  !== null) { fields.push(`format = $${i++}`);  values.push(format); }
  if (mode    !== undefined && mode    !== null) { fields.push(`mode = $${i++}`);    values.push(mode); }
  if (time    !== undefined && time    !== null) { fields.push(`time = $${i++}`);    values.push(time); }
  if (typeof active === "boolean")               { fields.push(`active = $${i++}`);  values.push(active); }

  if (fields.length === 0) return NextResponse.json({ error: "nothing to update" }, { status: 400 });

  values.push(id);
  await pool.query(`UPDATE requests SET ${fields.join(", ")} WHERE id = $${i}`, values);

  return NextResponse.json({ success: true, id });
}
