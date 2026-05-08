import { NextRequest, NextResponse } from "next/server";
import { isOpenNow } from "@/lib/openingHours";

export interface Business {
  place_id: string;
  name: string;
  address: string;
  phone?: string;
  types: string[];
  lat: number;
  lng: number;
  opening_hours_raw?: string;
  email?: string;
  hasWebsite: boolean;
  website?: string;
  isOpen: boolean | null; // null = horaires inconnus
}

const SECTOR_QUERIES: Record<string, string> = {
  restaurant:         "restaurant",
  cafe:               "café",
  bar:                "bar",
  bakery:             "boulangerie",
  beauty_salon:       "salon de beauté",
  hair_care:          "coiffeur",
  gym:                "salle de sport",
  laundry:            "laverie",
  clothing_store:     "magasin vêtements",
  pharmacy:           "pharmacie",
  doctor:             "médecin",
  dentist:            "dentiste",
  car_repair:         "garage automobile",
  plumber:            "plombier",
  electrician:        "électricien",
  locksmith:          "serrurier",
  florist:            "fleuriste",
  lodging:            "hôtel",
  real_estate_agency: "agence immobilière",
  accounting:         "comptable",
};

const RADIUS_MAP: Record<string, number> = {
  proche: 2000,
  ville: 5000,
  region: 15000,
};

async function fetchNominatim(query: string, lat: number, lng: number, radius: number): Promise<NominatimResult[]> {
  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("q", query);
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("limit", "50");
  url.searchParams.set("viewbox", buildViewbox(lat, lng, radius));
  url.searchParams.set("bounded", "1");
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("extratags", "1");
  url.searchParams.set("accept-language", "fr");

  const res = await fetch(url.toString(), {
    headers: { "User-Agent": "ProspectAI/1.0 contact@prospectai.app", "Accept": "application/json" },
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) throw new Error("Nominatim error");
  return res.json();
}

function parseResult(item: NominatimResult, type: string): Business | null {
  if (!item.display_name || !item.lat || !item.lon) return null;
  const extra = item.extratags || {};
  const website = extra.website || extra["contact:website"];
  const phone = extra.phone || extra["contact:phone"] || extra["contact:mobile"];
  if (!phone) return null; // exclure sans téléphone

  const addr = item.address || {};
  const addressParts = [
    addr.house_number, addr.road, addr.postcode,
    addr.city || addr.town || addr.village,
  ].filter(Boolean);

  return {
    place_id: `nom-${item.place_id}`,
    name: item.name || item.display_name.split(",")[0],
    address: addressParts.join(" ") || item.display_name.split(",").slice(0, 3).join(", "),
    phone,
    email: extra.email || extra["contact:email"],
    types: [type],
    lat: parseFloat(item.lat),
    lng: parseFloat(item.lon),
    opening_hours_raw: extra.opening_hours,
    hasWebsite: !!website,
    website,
    isOpen: isOpenNow(extra.opening_hours),
  };
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const location = searchParams.get("location") || "";
  const distance = searchParams.get("distance") || "ville";
  const type = searchParams.get("type") || "restaurant";
  const websiteFilter = searchParams.get("websiteFilter") || "no_website";
  const maxLeads = Math.min(parseInt(searchParams.get("maxLeads") || "20"), 100);

  if (!location) return NextResponse.json({ error: "Location required" }, { status: 400 });

  const [lat, lng] = location.split(",").map(Number);
  const baseRadius = RADIUS_MAP[distance] || 5000;
  const query = SECTOR_QUERIES[type] || type;

  // Tente avec rayon de base, puis double si pas assez de résultats
  let allRaw: NominatimResult[] = [];
  try {
    allRaw = await fetchNominatim(query, lat, lng, baseRadius);
    if (allRaw.length < maxLeads * 2) {
      const wider = await fetchNominatim(query, lat, lng, baseRadius * 3);
      const existingIds = new Set(allRaw.map((r) => r.place_id));
      allRaw.push(...wider.filter((r) => !existingIds.has(r.place_id)));
    }
  } catch {
    return NextResponse.json({ error: "Erreur de recherche. Réessayez." }, { status: 502 });
  }

  const businesses: Business[] = allRaw
    .map((item) => parseResult(item, type))
    .filter((b): b is Business => b !== null);

  const websiteFiltered = businesses.filter((b) => {
    if (websiteFilter === "no_website") return !b.hasWebsite;
    if (websiteFilter === "with_website") return b.hasWebsite;
    return true;
  });

  // Trier : ouverts en premier, puis horaires inconnus, puis fermés
  const open = websiteFiltered.filter((b) => b.isOpen === true);
  const unknown = websiteFiltered.filter((b) => b.isOpen === null);
  const closed = websiteFiltered.filter((b) => b.isOpen === false);
  const sorted = [...open, ...unknown, ...closed];

  const results = sorted.slice(0, maxLeads);

  return NextResponse.json({
    results,
    total_found: businesses.length,
    no_website_count: businesses.filter((b) => !b.hasWebsite).length,
    with_website_count: businesses.filter((b) => b.hasWebsite).length,
    open_count: open.length,
    closed_count: closed.length,
  });
}

function buildViewbox(lat: number, lng: number, radiusMeters: number): string {
  const deg = radiusMeters / 111000;
  return `${lng - deg},${lat + deg},${lng + deg},${lat - deg}`;
}

interface NominatimResult {
  place_id: number;
  lat: string;
  lon: string;
  display_name: string;
  name?: string;
  address?: Record<string, string>;
  extratags?: Record<string, string>;
}
