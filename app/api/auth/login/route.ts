import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { signToken } from "@/lib/auth";
import sql from "@/lib/db";

export async function POST(req: NextRequest) {
  const { username, password } = await req.json();
  if (!username || !password)
    return NextResponse.json({ error: "Identifiant et mot de passe requis" }, { status: 400 });

  const rows = await sql`
    SELECT id, username, password_hash, role FROM users
    WHERE username = ${username.trim().toLowerCase()}
    LIMIT 1
  `;

  const user = rows[0];
  if (!user)
    return NextResponse.json({ error: "Identifiant ou mot de passe incorrect" }, { status: 401 });

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid)
    return NextResponse.json({ error: "Identifiant ou mot de passe incorrect" }, { status: 401 });

  const token = await signToken({ userId: user.id, username: user.username, role: user.role });
  const res = NextResponse.json({ ok: true, role: user.role, username: user.username });
  res.cookies.set("prospectai_token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  });
  return res;
}
