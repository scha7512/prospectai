import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import sql from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non connecté" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const userId     = searchParams.get("userId") || session.userId;
  const businessId = searchParams.get("businessId") || "gensite";

  if (session.role !== "admin" && userId !== session.userId)
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

  const rows = await sql`
    SELECT * FROM crm_entries WHERE user_id = ${userId} AND business_id = ${businessId} ORDER BY added_at DESC
  `;
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non connecté" }, { status: 401 });

  const body       = await req.json();
  const userId     = body.userId || session.userId;
  const businessId = body.businessId || "gensite";

  if (session.role !== "admin" && userId !== session.userId)
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

  try {
    const rows = await sql`
      INSERT INTO crm_entries (user_id, place_id, business, status, note, rappel_at, rappel_direction, site_cree, business_id)
      VALUES (${userId}, ${body.business.place_id}, ${JSON.stringify(body.business)}, 'nouveau', '', NULL, NULL, false, ${businessId})
      ON CONFLICT (user_id, place_id) DO NOTHING
      RETURNING *
    `;
    return NextResponse.json(rows[0] || { duplicate: true });
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Erreur" }, { status: 500 });
  }
}
