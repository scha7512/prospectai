import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

export interface EmailResult {
  subject: string;
  body: string;
}

// Vocabulaire par secteur
const SECTOR_VOCAB: Record<string, { textes: string; benefice: string; cible: string }> = {
  real_estate_agency:  { textes: "annonces immobilières", benefice: "des biens qui partent plus vite",           cible: "agences" },
  recruitment_agency:  { textes: "fiches de poste",       benefice: "attirer plus de candidats qualifiés",       cible: "cabinets" },
  travel_agency:       { textes: "descriptions de séjours", benefice: "donner envie de réserver",               cible: "agences" },
  concierge:           { textes: "descriptions de services", benefice: "inspirer confiance dès le premier regard", cible: "services de conciergerie" },
  event_agency:        { textes: "présentations d'événements", benefice: "remplir vos événements plus facilement", cible: "agences événementielles" },
  property_developer:  { textes: "descriptions de programmes", benefice: "générer plus de demandes de visite",   cible: "promoteurs" },
  seasonal_rental:     { textes: "annonces de location",    benefice: "augmenter le taux de réservation",        cible: "propriétaires" },
};

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non connecté" }, { status: 401 });

  const groqKey = process.env.GROQ_API_KEY;
  if (!groqKey) return NextResponse.json({ error: "Clé GROQ manquante" }, { status: 500 });

  const { businessName, sector, analyse_result } = await req.json();
  if (!businessName) return NextResponse.json({ error: "businessName requis" }, { status: 400 });

  const vocab = SECTOR_VOCAB[sector] || {
    textes: "textes de vente",
    benefice: "attirer plus de clients",
    cible: "entreprises",
  };

  // Contexte additionnel si on a un résultat d'analyse
  let analyseContext = "";
  if (analyse_result) {
    const problemes = analyse_result.problemes_detectes?.slice(0, 2).join(" ; ") || "";
    const phrase = analyse_result.phrases_accroche?.[0] || "";
    if (problemes) analyseContext += `\nProblèmes détectés sur leurs textes : ${problemes}`;
    if (phrase)    analyseContext += `\nUne phrase d'accroche déjà identifiée : "${phrase}"`;
  }

  const prompt = `Tu es Sacha Tanton, copywriter freelance francophone. Tu dois écrire un email de prospection court et percutant pour ${businessName}, une entreprise du secteur : ${vocab.cible}.

Contexte : tu proposes tes services de copywriting pour améliorer leurs ${vocab.textes}, avec comme bénéfice principal : ${vocab.benefice}.${analyseContext}

L'email doit :
- Avoir un objet accrocheur et personnalisé (mentionner l'entreprise ou une observation concrète)
- Commencer par "Bonjour," (pas de prénom)
- Se présenter rapidement : "Je m'appelle Sacha, je réécris des ${vocab.textes} pour les ${vocab.cible}."
- Inclure une phrase courte sur le bénéfice concret (${vocab.benefice})
- Mentionner qu'un texte a été réécrit gratuitement et joint au mail
- Finir par une question simple pour obtenir 5 minutes d'échange
- Signature : Sacha Tanton / tantonsacha@gmail.com
- Ton : professionnel mais humain, direct, sans fioritures. Pas de "j'espère que vous allez bien".
- Longueur : maximum 8 lignes de corps

Réponds UNIQUEMENT en JSON valide, sans markdown, sans backticks :
{
  "subject": "Objet de l'email",
  "body": "Corps complet de l'email avec sauts de ligne représentés par \\n"
}`;

  const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${groqKey}` },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.8,
      max_tokens: 600,
    }),
  });

  if (!groqRes.ok) return NextResponse.json({ error: "Erreur Groq" }, { status: 502 });

  const groqData = await groqRes.json();
  const raw: string = groqData.choices?.[0]?.message?.content ?? "";

  const start = raw.indexOf("{");
  const end   = raw.lastIndexOf("}");
  if (start === -1 || end === -1) return NextResponse.json({ error: "Réponse IA invalide" }, { status: 502 });

  const result: EmailResult = JSON.parse(raw.slice(start, end + 1));
  return NextResponse.json(result);
}
