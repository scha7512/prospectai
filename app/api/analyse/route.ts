import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

// ── Prompt GenSite : entreprises sans site web ────────────────────────────────
const PROMPT_GENSITE = `Tu es un expert en création de sites web et en prospection commerciale francophone. On t'a fourni les informations d'une entreprise locale qui n'a pas (ou peu) de présence en ligne. Analyse ces informations comme un commercial web qui veut leur vendre un site internet.

Tu dois produire :
1. Un score de priorité de prospection de 1 à 10 (10 = très urgent de les contacter car ils ont absolument besoin d'un site)
2. La raison de ce score en une phrase (pourquoi ils ont besoin d'un site web maintenant)
3. Les problèmes détectés liés à l'absence de site web (pas de visibilité en ligne, clients perdus, concurrents mieux positionnés, etc.)
4. 4 phrases d'accroche concrètes pour convaincre le patron au téléphone qu'un site web lui ferait gagner des clients
5. Un conseil global court sur l'approche commerciale

Réponds UNIQUEMENT en JSON valide, sans markdown, sans backticks :
{
  "score_prospection": 8,
  "raison_score": "explication courte",
  "problemes_detectes": ["problème 1", "problème 2"],
  "phrases_accroche": ["phrase 1", "phrase 2", "phrase 3", "phrase 4"],
  "conseil_global": "paragraphe court"
}`;

// ── Prompt Copywriting : qualité des textes et annonces ───────────────────────
const PROMPT_COPYWRITING = `Tu es un expert copywriter francophone spécialisé dans la rédaction d'annonces et de contenus qui vendent. On t'a fourni les informations d'une entreprise. Ton rôle est d'analyser la qualité de leur communication écrite et de les convaincre qu'un copywriter professionnel leur ferait gagner plus de clients.

Contexte important : tu proposes tes services de copywriting. Pour une agence immobilière, cela signifie réécrire leurs annonces de biens pour qu'elles donnent vraiment envie aux acheteurs ou locataires — des descriptions qui racontent une histoire, créent une émotion, font rêver plutôt que de simplement lister des caractéristiques. Pour une agence de voyage, des itinéraires qui font saliver. Pour un cabinet de recrutement, des offres d'emploi qui attirent vraiment les talents. Etc.

Tu dois produire :
1. Un score de priorité de prospection de 1 à 10 (10 = leurs textes sont catastrophiques, énorme opportunité)
2. La raison de ce score en une phrase précise
3. Les problèmes de copywriting concrets détectés : annonces froides et factuelles, pas d'émotion, pas de storytelling, descriptions génériques ("bel appartement lumineux 3 pièces"), aucun mot qui donne envie, pas de projection, pas d'appel à l'action, promesses vagues, etc.
4. 4 phrases d'accroche percutantes pour convaincre le responsable au téléphone — montrer qu'on a vu leurs annonces, qu'on sait ce qui cloche, et ce qu'un bon copywriting leur apporterait concrètement (plus de visites, plus de mandats, des biens qui se louent plus vite, etc.)
5. Un exemple concret : prendre un de leurs types d'annonces typiques et montrer la différence entre leur version fade et ce qu'un copywriter produirait (une ou deux phrases seulement, très percutantes)

Réponds UNIQUEMENT en JSON valide, sans markdown, sans backticks :
{
  "score_prospection": 8,
  "raison_score": "explication courte et précise",
  "problemes_detectes": ["problème concret 1", "problème concret 2", "problème concret 3"],
  "phrases_accroche": ["phrase 1", "phrase 2", "phrase 3", "phrase 4"],
  "conseil_global": "exemple avant/après + conseil"
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

  const { nom, ville, url, businessId = "gensite" } = await req.json();
  if (!nom || !ville) return NextResponse.json({ error: "Nom et ville requis" }, { status: 400 });

  const systemPrompt = businessId === "copywriting" ? PROMPT_COPYWRITING : PROMPT_GENSITE;

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
        { role: "system",  content: systemPrompt },
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
