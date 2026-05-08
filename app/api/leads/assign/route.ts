import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import sql from "@/lib/db";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "admin")
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

  const { userIds, businesses } = await req.json();
  if (!userIds?.length || !businesses?.length)
    return NextResponse.json({ error: "Paramètres manquants" }, { status: 400 });

  let inserted = 0;
  for (const userId of userIds) {
    for (const business of businesses) {
      const rows = await sql`
        INSERT INTO crm_entries (user_id, place_id, business, status, note, rappel_at, rappel_direction, site_cree)
        VALUES (${userId}, ${business.place_id}, ${JSON.stringify(business)}, 'nouveau', '', NULL, NULL, false)
        ON CONFLICT (user_id, place_id) DO NOTHING
        RETURNING id
      `;
      if (rows.length) inserted++;
    }
  }

  return NextResponse.json({ ok: true, inserted });
}
