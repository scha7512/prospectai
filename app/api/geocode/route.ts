import { NextRequest, NextResponse } from "next/server";

// Nominatim = OpenStreetMap geocoder, 100% gratuit, aucune clé requise
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const address = searchParams.get("address") || "";

  if (!address) return NextResponse.json({ error: "Address required" }, { status: 400 });

  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1&addressdetails=1`;
  const res = await fetch(url, {
    headers: { "User-Agent": "ProspectAI/1.0 (prospectai-app)" },
  });
  const data = await res.json();

  if (!data.length) {
    return NextResponse.json({ error: "Localisation introuvable" }, { status: 404 });
  }

  return NextResponse.json({
    lat: parseFloat(data[0].lat),
    lng: parseFloat(data[0].lon),
    formatted: data[0].display_name,
  });
}
