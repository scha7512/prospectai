import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

const SYSTEM_PROMPT = `Tu es un expert copywriter professionnel francophone. On t'a fourni les informations d'une entreprise locale. Analyse ces informations comme un vrai copywriter pro qui veut aider cette entreprise à avoir plus de clients.

Tu dois produire :
1. Un score de priorité de prospection de 1 à 10 (10 = très urgent de les contacter)
2. La raison de ce score en une phrase
3. Les problèmes de copywriting détectés (textes génériques, pas d'émotion, pas d'appel à l'action, promesses floues, etc.)
4. 4 phrases d'accroche concrètes que le copywriter dira au téléphone pour faire ouvrir les yeux au prospect
5. Un conseil global court

Réponds UNIQUEMENT en JSON valide, sans markdown, sans backticks :
{
  "score_prospection": 8,
  "raison_score": "explication courte",
  "problemes_detectes": ["problème 1", "problème 2"],
  "phrases_accroche": ["phrase 1", "phrase 2", "phrase 3", "phrase 4"],
  "conseil_global": "paragraphe court"
}`;

interface PlacesResult {
  name: string;
  formatted_address: string;
  rating?: number;
  user_ratings_total?: number;
  website?: string;
  types?: string[];
  business_status?: string;
}

async function fetchPlacesInfo(name: string, city: string): Promise<PlacesResult | null> {
  const key = process.env.GOOGLE_PLACES_API_KEY;
  if (!key) return null;

  const query = `${name} ${city}`;

  // Nouvelle Places API (v1)
  const searchRes = await fetch("https://places.googleapis.com/v1/places:searchText", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": key,
      "X-Goog-FieldMask": "places.displayName,places.formattedAddress,places.rating,places.userRatingCount,places.websiteUri,places.types,places.businessStatus",
    },
    body: JSON.stringify({ textQuery: query, languageCode: "fr" }),
    signal: AbortSignal.timeout(8000),
  });

  if (!searchRes.ok) return null;
  const data = await searchRes.json();
  const place = data.places?.[0];
  if (!place) return null;

  return {
    name: place.displayName?.text || name,
    formatted_address: place.formattedAddress || city,
    rating: place.rating,
    user_ratings_total: place.userRatingCount,
    website: place.websiteUri,
    types: place.types,
    business_status: place.businessStatus,
  };
}

export interface AnalyseResult {
  score_prospection: number;
  raison_score: string;
  problemes_detectes: string[];
  phrases_accroche: string[];
  conseil_global: string;
  // Infos entreprise
  entreprise_nom: string;
  entreprise_adresse: string;
  entreprise_ville: string;
  a_site_web: boolean;
  site_web_url?: string;
  note_google?: number;
  nb_avis?: number;
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non connecté" }, { status: 401 });

  const groqKey = process.env.GROQ_API_KEY;
  if (!groqKey) return NextResponse.json({ error: "Clé GROQ manquante dans .env" }, { status: 500 });

  const { nom, ville, url } = await req.json();
  if (!nom || !ville) return NextResponse.json({ error: "Nom et ville requis" }, { status: 400 });

  // ── 1. Infos Google Places ──────────────────────────────────────────────────
  let placesInfo: PlacesResult | null = null;
  try {
    placesInfo = await fetchPlacesInfo(nom, ville);
  } catch {
    // Continue sans Places
  }

  const hasWebsite = !!(placesInfo?.website || url);
  const siteUrl = url || placesInfo?.website;

  // ── 2. Contexte pour l'IA ───────────────────────────────────────────────────
  const contextLines: string[] = [
    `Entreprise : ${nom}`,
    `Ville : ${ville}`,
    `Site web : ${hasWebsite ? (siteUrl || "Oui (URL non précisée)") : "Aucun site web détecté"}`,
  ];

  if (placesInfo) {
    if (placesInfo.formatted_address) contextLines.push(`Adresse : ${placesInfo.formatted_address}`);
    if (placesInfo.rating)            contextLines.push(`Note Google : ${placesInfo.rating}/5`);
    if (placesInfo.user_ratings_total) contextLines.push(`Nombre d'avis : ${placesInfo.user_ratings_total}`);
    if (placesInfo.types?.length)     contextLines.push(`Catégorie : ${placesInfo.types.slice(0,3).join(", ")}`);
  }

  if (!hasWebsite) {
    contextLines.push("IMPORTANT : Cette entreprise n'a PAS de site web. Le score de prospection doit être élevé.");
  }

  const userMessage = contextLines.join("\n");

  // ── 3. Appel Groq ───────────────────────────────────────────────────────────
  const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${groqKey}`,
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system",  content: SYSTEM_PROMPT },
        { role: "user",    content: userMessage },
      ],
      temperature: 0.7,
      max_tokens: 1024,
    }),
    signal: AbortSignal.timeout(30000),
  });

  if (!groqRes.ok) {
    const err = await groqRes.text();
    return NextResponse.json({ error: `Erreur Groq : ${err.slice(0, 200)}` }, { status: 502 });
  }

  const groqData = await groqRes.json();
  const raw = groqData.choices?.[0]?.message?.content || "";

  // Parser le JSON retourné par Groq
  let parsed: Partial<AnalyseResult>;
  try {
    // Nettoyer les éventuels backticks
    const cleaned = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    parsed = JSON.parse(cleaned);
  } catch {
    return NextResponse.json({ error: "L'IA n'a pas retourné un JSON valide. Réessayez.", raw }, { status: 502 });
  }

  const result: AnalyseResult = {
    score_prospection: parsed.score_prospection ?? 5,
    raison_score:      parsed.raison_score      ?? "",
    problemes_detectes: parsed.problemes_detectes ?? [],
    phrases_accroche:  parsed.phrases_accroche  ?? [],
    conseil_global:    parsed.conseil_global    ?? "",
    entreprise_nom:    placesInfo?.name || nom,
    entreprise_adresse: placesInfo?.formatted_address || `${ville}`,
    entreprise_ville:  ville,
    a_site_web:        hasWebsite,
    site_web_url:      siteUrl,
    note_google:       placesInfo?.rating,
    nb_avis:           placesInfo?.user_ratings_total,
  };

  return NextResponse.json(result);
}
