import { NextRequest, NextResponse } from "next/server";
import { searchViaSerpAPI, searchViaApify, searchViaOSM, toBusiness } from "@/lib/scrapers";

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
  isOpen: boolean | null;
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

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const location   = searchParams.get("location") || "";
  const distance   = searchParams.get("distance") || "ville";
  const type       = searchParams.get("type") || "restaurant";
  const websiteFilter = searchParams.get("websiteFilter") || "no_website";
  const maxLeads   = Math.min(parseInt(searchParams.get("maxLeads") || "20"), 100);

  if (!location) return NextResponse.json({ error: "Location required" }, { status: 400 });

  const [lat, lng] = location.split(",").map(Number);
  const radius = RADIUS_MAP[distance] || 5000;
  const query = `${SECTOR_QUERIES[type] || type}`;
  const queryWithCity = query; // SerpAPI/Apify utilisent lat/lng directement

  let providerUsed = "osm";
  let rawResults = null;

  // ── 1. Essai SerpAPI ──────────────────────────────────────────────────────
  if (process.env.SERPAPI_KEY) {
    rawResults = await searchViaSerpAPI(queryWithCity, lat, lng, maxLeads * 3);
    if (rawResults) providerUsed = "serpapi";
  }

  // ── 2. Essai Apify ────────────────────────────────────────────────────────
  if (!rawResults && process.env.APIFY_TOKEN) {
    rawResults = await searchViaApify(queryWithCity, lat, lng, maxLeads * 2);
    if (rawResults) providerUsed = "apify";
  }

  // ── 3. Fallback OSM ───────────────────────────────────────────────────────
  if (!rawResults) {
    rawResults = await searchViaOSM(query, lat, lng, radius);
    providerUsed = "osm";
  }

  // ── Conversion + filtres ──────────────────────────────────────────────────
  const businesses: Business[] = (rawResults || [])
    .map((r) => toBusiness(r, type))
    .filter((b): b is Business => b !== null);

  // Dédupliquer par nom + adresse
  const seen = new Set<string>();
  const unique = businesses.filter((b) => {
    const key = `${b.name.toLowerCase()}-${b.address.slice(0, 20).toLowerCase()}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // Filtre site web
  const filtered = unique.filter((b) => {
    if (websiteFilter === "no_website")   return !b.hasWebsite;
    if (websiteFilter === "with_website") return b.hasWebsite;
    return true;
  });

  const results = filtered.slice(0, maxLeads);

  return NextResponse.json({
    results,
    provider: providerUsed,
    total_found: unique.length,
    no_website_count: unique.filter((b) => !b.hasWebsite).length,
    with_website_count: unique.filter((b) => b.hasWebsite).length,
  });
}
