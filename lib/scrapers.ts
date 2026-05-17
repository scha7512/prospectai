import { Business } from "@/app/api/search/route";

// ─── Liste noire des grandes enseignes ───────────────────────────────────────
// Chaînes qui ont forcément un site web — on les exclut toujours

const CHAIN_BLACKLIST = [
  // Restauration rapide
  "mcdonald","mcdo","kfc","burger king","quick","subway","five guys","papa john",
  "domino","pizza hut","little caesars","kebab king","bagelstein","big mamma",
  "leon","chipotle","taco bell","popeyes","nando","pret a manger",
  // Boulangeries / cafés chaînes
  "paul","brioche dorée","brioche doree","feuillette","marie blachère","marie blachere",
  "boulangerie louise","le fournil","ange boulangerie","au pain quotidien",
  "starbucks","columbus café","columbus cafe","costa coffee","tim hortons",
  "café de flore","les deux magots",
  // Bars / brasseries chaînes
  "flunch","courtepaille","hippopotamus","buffalo grill","bistro régent","bistro regent",
  "léon de bruxelles","leon de bruxelles","la boucherie","le boucher","waffle house",
  // Hotels chaînes
  "ibis","mercure","novotel","pullman","sofitel","mövenpick","movenpick",
  "holiday inn","hilton","marriott","hyatt","radisson","best western","b&b hotel",
  "campanile","kyriad","première classe","premiere classe","formule 1","f1 hotel",
  "all suites","appart hotel","citadines","adagio","suite novotel",
  // Pharmacies / santé chaînes
  "pharmacie lafayette","pharmacies lafayette","monoprix pharma","wellpharma",
  // Immobilier chaînes
  "century 21","orpi","laforêt","laforet","guy hoquet","stéphane plaza","stephane plaza",
  "nexity","foncia","citya","immo de france","l'adresse","square habitat",
  "era immobilier","coldwell banker","sotheby","barnes","engel volkers",
  // Coiffure chaînes
  "franck provost","jean louis david","dessange","camille albane","saint algue",
  "tchibò","toni&guy","toni and guy","great clips","supercuts",
  // Sport / fitness chaînes
  "basic fit","basic-fit","neoness","fitness park","keep cool","salle de sport orange",
  "orange bleue","l'orange bleue","moving","first class","gymnasium",
  // Vêtements
  "zara","h&m","uniqlo","primark","kiabi","gémo","gemo","camaieu","cache cache",
  "pimkie","jennyfer","morgan","promod","grain de malice","la halle",
  // Divers
  "monoprix","carrefour","leclerc","intermarché","intermarche","aldi","lidl",
  "action","gifi","noz","b&m","hema",
];

const MAX_REVIEWS = 400; // Au-dessus = probablement une grande enseigne

// ─── Types internes ───────────────────────────────────────────────────────────

interface RawBusiness {
  name: string;
  address: string;
  phone?: string;
  website?: string;
  lat: number;
  lng: number;
  types: string[];
  permanentlyClosed: boolean;
  reviewsCount?: number;
}

// Vérifie si le nom correspond à une grande enseigne
function isChain(name: string): boolean {
  const lower = name.toLowerCase().trim();
  return CHAIN_BLACKLIST.some((chain) => {
    // Correspondance exacte ou début du nom
    return lower === chain ||
      lower.startsWith(chain + " ") ||
      lower.startsWith(chain + "-") ||
      lower.includes(" " + chain + " ");
  });
}

// ─── Provider 1 : SerpAPI (rapide, 100/mois gratuit) ─────────────────────────

export async function searchViaSerpAPI(
  query: string,
  lat: number,
  lng: number,
  limit: number
): Promise<RawBusiness[] | null> {
  const key = process.env.SERPAPI_KEY;
  if (!key) return null;

  const ll = `@${lat},${lng},14z`;
  const url = `https://serpapi.com/search.json?engine=google_maps&q=${encodeURIComponent(query)}&ll=${ll}&type=search&hl=fr&api_key=${key}`;

  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
    if (!res.ok) return null;
    const data = await res.json();

    if (data.error) {
      console.log("SerpAPI error:", data.error);
      return null;
    }

    const results: RawBusiness[] = (data.local_results || [])
      .slice(0, limit)
      .map((r: Record<string, unknown>) => ({
        name: r.title as string,
        address: r.address as string || "",
        phone: r.phone as string | undefined,
        website: r.website as string | undefined,
        lat: (r.gps_coordinates as Record<string, number>)?.latitude || lat,
        lng: (r.gps_coordinates as Record<string, number>)?.longitude || lng,
        types: [r.type as string || ""],
        permanentlyClosed: !!(r.permanently_closed),
        reviewsCount: typeof r.reviews === "number" ? r.reviews : undefined,
      }));

    return results;
  } catch (e) {
    console.log("SerpAPI failed:", e);
    return null;
  }
}

// ─── Provider 2 : Apify Google Maps Scraper ───────────────────────────────────

export async function searchViaApify(
  query: string,
  lat: number,
  lng: number,
  limit: number
): Promise<RawBusiness[] | null> {
  const token = process.env.APIFY_TOKEN;
  if (!token) return null;

  const body = {
    searchStrings: [query],
    lat,
    lng,
    zoom: 14,
    maxCrawledPlacesPerSearch: Math.min(limit * 2, 40),
    language: "fr",
    maxImages: 0,
    includeHistogram: false,
    includeOpeningHours: false,
    includePeopleAlsoSearch: false,
    scrapeContacts: false,
  };

  try {
    const url = `https://api.apify.com/v2/acts/compass~crawler-google-places/run-sync-get-dataset-items?token=${token}&timeout=60&memory=512`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(65000),
    });

    if (!res.ok) {
      console.log("Apify HTTP error:", res.status);
      return null;
    }

    const data = await res.json();
    if (!Array.isArray(data)) return null;

    const results: RawBusiness[] = data
      .slice(0, limit)
      .map((r: Record<string, unknown>) => {
        const loc = r.location as Record<string, number> | undefined;
        return {
          name: r.title as string,
          address: r.address as string || "",
          phone: r.phone as string | undefined,
          website: r.website as string | undefined,
          lat: loc?.lat || lat,
          lng: loc?.lng || lng,
          types: [r.categoryName as string || ""],
          permanentlyClosed: !!(r.permanentlyClosed),
          reviewsCount: typeof r.reviewsCount === "number" ? r.reviewsCount : undefined,
        };
      });

    return results;
  } catch (e) {
    console.log("Apify failed:", e);
    return null;
  }
}

// ─── Provider 3 : OSM Nominatim (fallback, toujours gratuit) ─────────────────

export async function searchViaOSM(
  query: string,
  lat: number,
  lng: number,
  radius: number
): Promise<RawBusiness[]> {
  const deg = radius / 111000;
  const viewbox = `${lng - deg},${lat + deg},${lng + deg},${lat - deg}`;
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=jsonv2&limit=50&viewbox=${viewbox}&bounded=1&addressdetails=1&extratags=1&accept-language=fr`;

  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "ProspectAI/1.0 contact@prospectai.app" },
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) return [];
    const data = await res.json();

    return (data as Record<string, unknown>[]).map((r) => {
      const extra = (r.extratags as Record<string, string>) || {};
      const addr = (r.address as Record<string, string>) || {};
      const parts = [addr.house_number, addr.road, addr.postcode, addr.city || addr.town || addr.village].filter(Boolean);
      return {
        name: (r.name as string) || (r.display_name as string).split(",")[0],
        address: parts.join(" ") || (r.display_name as string).split(",").slice(0, 3).join(", "),
        phone: extra.phone || extra["contact:phone"],
        website: extra.website || extra["contact:website"],
        lat: parseFloat(r.lat as string),
        lng: parseFloat(r.lon as string),
        types: [""],
        permanentlyClosed: false,
      };
    });
  } catch {
    return [];
  }
}

// ─── Convertir en Business ────────────────────────────────────────────────────

export function toBusiness(r: RawBusiness, type: string): Business | null {
  if (!r.name) return null;
  if (!r.phone) return null;
  if (r.permanentlyClosed) return null;

  // Exclure les grandes enseignes connues
  if (isChain(r.name)) return null;

  // Exclure si trop d'avis (= grande enseigne ou franchise)
  if (r.reviewsCount !== undefined && r.reviewsCount > MAX_REVIEWS) return null;

  return {
    place_id: `scrape-${r.lat}-${r.lng}-${r.name.replace(/\s/g, "")}`.slice(0, 80),
    name: r.name,
    address: r.address,
    phone: r.phone,
    types: r.types[0] ? r.types : [type],
    lat: r.lat,
    lng: r.lng,
    hasWebsite: !!(r.website),
    website: r.website,
    isOpen: null,
    email: undefined,
    opening_hours_raw: undefined,
  };
}
