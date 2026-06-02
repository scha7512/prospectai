import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

export interface EmailResult {
  subject: string;
  body: string;
}

// Vocabulaire par secteur — seuls textes et cible sont utilisés pour le template fixe
const SECTOR_VOCAB: Record<string, { textes: string; cible: string }> = {
  real_estate_agency:  { textes: "annonces immobilières",      cible: "agences immobilières"       },
  recruitment_agency:  { textes: "fiches de poste",            cible: "cabinets de recrutement"    },
  travel_agency:       { textes: "descriptions de séjours",    cible: "agences de voyage"          },
  concierge:           { textes: "descriptions de services",   cible: "services de conciergerie"   },
  event_agency:        { textes: "présentations d'événements", cible: "agences événementielles"    },
  property_developer:  { textes: "descriptions de programmes", cible: "promoteurs immobiliers"     },
  seasonal_rental:     { textes: "annonces de location",       cible: "propriétaires en location saisonnière" },
};

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non connecté" }, { status: 401 });

  const groqKey = process.env.GROQ_API_KEY;
  if (!groqKey) return NextResponse.json({ error: "Clé GROQ manquante" }, { status: 500 });

  const { businessName, sector, analyse_result } = await req.json();
  if (!businessName) return NextResponse.json({ error: "businessName requis" }, { status: 400 });

  const vocab = SECTOR_VOCAB[sector] || {
    textes: "annonces",
    cible: "entreprises",
  };

  // Objet fixe pour tous les secteurs
  const subject = "J'ai réécrit une de vos annonces — jetez un œil";

  // Groq génère UNIQUEMENT la phrase du bénéfice concret
  const prompt = `Tu es Sacha Tanton, copywriter freelance. Génère UNE SEULE phrase courte (max 20 mots) qui explique le bénéfice concret d'avoir des ${vocab.textes} bien rédigés pour des ${vocab.cible}. La phrase doit être directe, percutante, sans majuscule en début inutile. Exemple : "Une annonce bien rédigée, c'est plus de clics, plus d'appels entrants, et des biens qui partent plus vite."

Réponds UNIQUEMENT en JSON valide, sans markdown, sans backticks :
{"benefice": "ta phrase ici"}`;

  const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${groqKey}` },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 100,
    }),
  });

  if (!groqRes.ok) return NextResponse.json({ error: "Erreur Groq" }, { status: 502 });

  const groqData = await groqRes.json();
  const raw: string = groqData.choices?.[0]?.message?.content ?? "";

  const start = raw.indexOf("{");
  const end   = raw.lastIndexOf("}");
  if (start === -1 || end === -1) return NextResponse.json({ error: "Réponse IA invalide" }, { status: 502 });

  const parsed = JSON.parse(raw.slice(start, end + 1));
  const benefice: string = parsed.benefice ?? `Des ${vocab.textes} bien rédigés, ça fait la différence.`;

  // Template fixe — seul le bénéfice est généré par Groq
  const body = [
    "Bonjour,",
    "",
    `Je m'appelle Sacha, je réécris des ${vocab.textes} pour les ${vocab.cible}.`,
    "",
    benefice,
    "",
    "Si ça vous intéresse, vous pouvez prendre rendez-vous directement sur mon Calendly pour qu'on en parle 5 minutes ensemble :",
    "👉 https://calendly.com/tantonsacha/30min",
    "",
    "Sacha Tanton",
    "tantonsacha@gmail.com",
  ].join("\n");

  const result: EmailResult = { subject, body };
  return NextResponse.json(result);
}
