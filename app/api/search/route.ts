import { NextRequest, NextResponse } from "next/server";

// Overpass API (OpenStreetMap) — 100% gratuit, aucune clé
const OVERPASS_URL = "https://overpass-api.de/api/interpreter";

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
}

// Mapping des types secteur vers les tags OSM
const OSM_TAGS: Record<string, string[]> = {
  restaurant:        ['amenity=restaurant'],
  cafe:              ['amenity=cafe'],
  bar:               ['amenity=bar', 'amenity=pub'],
  bakery:            ['shop=bakery'],
  beauty_salon:      ['shop=beauty'],
  hair_care:         ['shop=hairdresser'],
  gym:               ['leisure=fitness_centre', 'leisure=sports_centre'],
  laundry:           ['shop=laundry', 'shop=dry_cleaning'],
  clothing_store:    ['shop=clothes'],
  pharmacy:          ['amenity=pharmacy'],
  doctor:            ['amenity=doctors'],
  dentist:           ['amenity=dentist'],
  car_repair:        ['shop=car_repair'],
  plumber:           ['craft=plumber'],
  electrician:       ['craft=electrician'],
  locksmith:         ['craft=locksmith'],
  florist:           ['shop=florist'],
  lodging:           ['tourism=hotel', 'tourism=guest_house', 'tourism=bed_and_breakfast'],
  real_estate_agency:['office=estate_agent'],
  accounting:        ['office=accountant'],
};

function buildOverpassQuery(lat: number, lng: number, radius: number, osmTags: string[]): string {
  const tagFilters = osmTags.map((tag) => {
    const [key, value] = tag.split("=");
    return `
      node["${key}"="${value}"](around:${radius},${lat},${lng});
      way["${key}"="${value}"](around:${radius},${lat},${lng});
    `;
  }).join("");

  return `
    [out:json][timeout:25];
    (
      ${tagFilters}
    );
    out center tags;
  `;
}

function formatAddress(tags: Record<string, string>): string {
  const parts = [
    tags["addr:housenumber"],
    tags["addr:street"],
    tags["addr:postcode"],
    tags["addr:city"],
  ].filter(Boolean);
  return parts.join(" ") || tags["addr:full"] || "";
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const location = searchParams.get("location") || "";
  const radius = searchParams.get("radius") || "5000";
  const type = searchParams.get("type") || "restaurant";

  if (!location) {
    return NextResponse.json({ error: "Location required" }, { status: 400 });
  }

  const [lat, lng] = location.split(",").map(Number);
  const osmTags = OSM_TAGS[type] || [`amenity=${type}`];

  const query = buildOverpassQuery(lat, lng, parseInt(radius), osmTags);

  const res = await fetch(OVERPASS_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `data=${encodeURIComponent(query)}`,
  });

  if (!res.ok) {
    return NextResponse.json({ error: "Overpass API error" }, { status: 502 });
  }

  const data = await res.json();
  const elements: Record<string, unknown>[] = data.elements || [];

  // Garder seulement ceux SANS website dans les tags OSM
  const noWebsite: Business[] = elements
    .filter((el) => {
      const tags = (el.tags as Record<string, string>) || {};
      return !tags.website && !tags["contact:website"] && tags.name;
    })
    .map((el) => {
      const tags = (el.tags as Record<string, string>) || {};
      const center = (el.center as { lat: number; lon: number }) || el;
      return {
        place_id: `osm-${el.type}-${el.id}`,
        name: tags.name,
        address: formatAddress(tags),
        phone: tags.phone || tags["contact:phone"],
        email: tags.email || tags["contact:email"],
        types: [type],
        lat: (center as { lat: number }).lat as number,
        lng: (center as { lon: number }).lon as number,
        opening_hours_raw: tags.opening_hours,
      };
    });

  return NextResponse.json({
    results: noWebsite,
    next_page_token: null,
    total_found: elements.length,
    no_website_count: noWebsite.length,
  });
}
