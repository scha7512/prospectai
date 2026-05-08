import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const address = searchParams.get("address") || "";

  if (!address) return NextResponse.json({ error: "Address required" }, { status: 400 });

  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1&countrycodes=fr,be,ch,lu&accept-language=fr`;

  const res = await fetch(url, {
    headers: {
      "User-Agent": "ProspectAI/1.0 contact@prospectai.app",
      "Accept": "application/json",
      "Accept-Language": "fr",
    },
    next: { revalidate: 0 },
  });

  if (!res.ok) {
    return NextResponse.json({ error: "Erreur géocodage" }, { status: 502 });
  }

  const data = await res.json();

  if (!Array.isArray(data) || data.length === 0) {
    return NextResponse.json({ error: "Ville introuvable. Essayez avec le nom complet (ex: Lyon, France)" }, { status: 404 });
  }

  const result = data[0];
  return NextResponse.json({
    lat: parseFloat(result.lat),
    lng: parseFloat(result.lon),
    formatted: result.display_name.split(",").slice(0, 3).join(", "),
  });
}
