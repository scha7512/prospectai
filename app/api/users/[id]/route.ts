import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getSession } from "@/lib/auth";
import sql from "@/lib/db";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role !== "admin")
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

  const { id } = await params;
  const { username, password } = await req.json();

  if (username) {
    await sql`UPDATE users SET username = ${username.trim().toLowerCase()} WHERE id = ${id} AND role = 'telepro'`;
  }
  if (password) {
    const hash = await bcrypt.hash(password, 10);
    await sql`UPDATE users SET password_hash = ${hash}, plain_password = ${password} WHERE id = ${id} AND role = 'telepro'`;
  }

  const rows = await sql`SELECT id, username, role, plain_password, created_at FROM users WHERE id = ${id}`;
  return NextResponse.json(rows[0]);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role !== "admin")
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

  const { id } = await params;
  await sql`DELETE FROM users WHERE id = ${id} AND role = 'telepro'`;
  return NextResponse.json({ ok: true });
}
