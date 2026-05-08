import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getSession } from "@/lib/auth";
import sql from "@/lib/db";

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "admin")
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

  const rows = await sql`
    SELECT id, username, role, created_at FROM users
    WHERE role = 'telepro' ORDER BY created_at DESC
  `;
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "admin")
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

  const { username, password } = await req.json();
  if (!username || !password)
    return NextResponse.json({ error: "Champs manquants" }, { status: 400 });

  const hash = await bcrypt.hash(password, 10);

  try {
    const rows = await sql`
      INSERT INTO users (username, password_hash, role)
      VALUES (${username.trim().toLowerCase()}, ${hash}, 'telepro')
      RETURNING id, username, role, created_at
    `;
    return NextResponse.json(rows[0]);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "";
    if (msg.includes("unique") || msg.includes("duplicate"))
      return NextResponse.json({ error: "Identifiant déjà utilisé" }, { status: 409 });
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
