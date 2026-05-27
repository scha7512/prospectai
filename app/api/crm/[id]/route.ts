import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import sql from "@/lib/db";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non connecté" }, { status: 401 });

  const { id } = await params;
  const patch = await req.json();

  const existing = await sql`SELECT user_id FROM crm_entries WHERE id = ${id}`;
  if (!existing[0]) return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  if (session.role !== "admin" && existing[0].user_id !== session.userId)
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

  const rows = await sql`
    UPDATE crm_entries SET
      status = COALESCE(${patch.status ?? null}, status),
      note = COALESCE(${patch.note ?? null}, note),
      rappel_at = ${patch.rappel_at !== undefined ? patch.rappel_at : sql`rappel_at`},
      rappel_direction = ${patch.rappel_direction !== undefined ? patch.rappel_direction : sql`rappel_direction`},
      site_cree = COALESCE(${patch.site_cree ?? null}, site_cree),
      analyse_score = COALESCE(${patch.analyse_score ?? null}, analyse_score),
      analyse_result = ${patch.analyse_result !== undefined ? JSON.stringify(patch.analyse_result) : sql`analyse_result`},
      updated_at = now()
    WHERE id = ${id}
    RETURNING *
  `;
  return NextResponse.json(rows[0]);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non connecté" }, { status: 401 });

  const { id } = await params;
  const existing = await sql`SELECT user_id FROM crm_entries WHERE id = ${id}`;
  if (!existing[0]) return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  if (session.role !== "admin" && existing[0].user_id !== session.userId)
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

  await sql`DELETE FROM crm_entries WHERE id = ${id}`;
  return NextResponse.json({ ok: true });
}
