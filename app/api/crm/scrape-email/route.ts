import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

const EMAIL_REGEX = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g;

const IGNORED_PATTERNS = [
  "sentry", "wix", "wordpress", "example", "test",
  "noreply", "no-reply", "privacy", "legal",
];

function extractEmails(html: string): string[] {
  const matches = html.match(EMAIL_REGEX) || [];
  return matches.filter((email) =>
    !IGNORED_PATTERNS.some((p) => email.toLowerCase().includes(p))
  );
}

async function fetchPage(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(5000),
      headers: { "User-Agent": "Mozilla/5.0 (compatible; ProspectBot/1.0)" },
    });
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}

function normalizeBase(website: string): string {
  try {
    const url = new URL(website.startsWith("http") ? website : `https://${website}`);
    return url.origin;
  } catch {
    return website.startsWith("http") ? website : `https://${website}`;
  }
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non connecté" }, { status: 401 });

  const { website } = await req.json();
  if (!website) return NextResponse.json({ email: null });

  const base = normalizeBase(website);

  const pathsToTry = [
    website,
    `${base}/contact`,
    `${base}/contact-us`,
    `${base}/nous-contacter`,
    `${base}/contactez-nous`,
    `${base}/a-propos`,
    `${base}/about`,
  ];

  for (const url of pathsToTry) {
    const html = await fetchPage(url);
    if (!html) continue;
    const emails = extractEmails(html);
    if (emails.length > 0) return NextResponse.json({ email: emails[0] });
  }

  return NextResponse.json({ email: null });
}
