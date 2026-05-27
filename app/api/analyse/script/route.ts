import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

export interface ScriptResult {
  intro: string;
  arguments: string[];
  objections: { obj: string; rep: string }[];
  conclusion: string;
}

const SECTOR_NAMES: Record<string, string> = {
  real_estate: "agence immobilière",
  recruitment: "cabinet de recrutement",
  travel:      "agence de voyage",
  concierge:   "service de conciergerie",
  events:      "agence événementielle",
  developer:   "promoteur immobilier",
  seasonal:    "location saisonnière",
};

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non connecté" }, { status: 401 });

  const { sector, context } = await req.json();

  const sectorName = SECTOR_NAMES[sector] || sector;
  const contextBlock = context?.trim()
    ? `\n\nInformations supplémentaires sur le prospect :\n${context.trim()}`
    : "";

  const prompt = `Tu es un expert en prospection commerciale pour un copywriter freelance francophone. Tu dois générer un script d'appel téléphonique court et efficace pour prospecter une ${sectorName}.${contextBlock}

Objectif : convaincre le décideur de faire appel à un copywriter professionnel pour améliorer ses textes de vente (annonces, fiches produits, descriptions, emails, etc.).

Le script doit être naturel, conversationnel, et persuasif. Adapte le vocabulaire et les arguments au secteur.

Réponds UNIQUEMENT en JSON valide, sans markdown, sans backticks :
{
  "intro": "phrase d'introduction au téléphone (accroche + présentation rapide)",
  "arguments": ["argument 1", "argument 2", "argument 3"],
  "objections": [
    {"obj": "objection courante 1", "rep": "réponse courte et convaincante"},
    {"obj": "objection courante 2", "rep": "réponse courte et convaincante"},
    {"obj": "objection courante 3", "rep": "réponse courte et convaincante"}
  ],
  "conclusion": "phrase de clôture pour proposer un rendez-vous ou un devis"
}`;

  const groqKey = process.env.GROQ_API_KEY;
  if (!groqKey) return NextResponse.json({ error: "Clé GROQ manquante" }, { status: 500 });

  const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${groqKey}` },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 1000,
    }),
  });
  if (!groqRes.ok) return NextResponse.json({ error: "Erreur Groq" }, { status: 500 });
  const groqData = await groqRes.json();
  const raw: string = groqData.choices?.[0]?.message?.content ?? "";
  const start = raw.indexOf("{");
  const end   = raw.lastIndexOf("}");
  if (start === -1 || end === -1) return NextResponse.json({ error: "Réponse IA invalide" }, { status: 500 });

  const result: ScriptResult = JSON.parse(raw.slice(start, end + 1));
  return NextResponse.json(result);
}
