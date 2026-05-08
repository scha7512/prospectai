import { Business } from "@/app/api/search/route";

export interface CRMEntry {
  status: "nouveau" | "contacte" | "interesse" | "signe" | "pas_interesse";
  note: string;
  updatedAt: string;
}

export interface SavedSearch {
  id: string;
  label: string;
  city: string;
  sectors: string[];
  date: string;
  results: Business[];
}

// ── CRM ──────────────────────────────────────────────────────────────────────

export function getCRM(): Record<string, CRMEntry> {
  if (typeof window === "undefined") return {};
  try { return JSON.parse(localStorage.getItem("prospectai_crm") || "{}"); }
  catch { return {}; }
}

export function setCRMEntry(placeId: string, entry: CRMEntry) {
  const crm = getCRM();
  crm[placeId] = entry;
  localStorage.setItem("prospectai_crm", JSON.stringify(crm));
}

export function deleteCRMEntry(placeId: string) {
  const crm = getCRM();
  delete crm[placeId];
  localStorage.setItem("prospectai_crm", JSON.stringify(crm));
}

// ── Saved searches ────────────────────────────────────────────────────────────

export function getSavedSearches(): SavedSearch[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem("prospectai_searches") || "[]"); }
  catch { return []; }
}

export function saveSearch(search: Omit<SavedSearch, "id">): SavedSearch {
  const searches = getSavedSearches();
  const entry: SavedSearch = { ...search, id: Date.now().toString() };
  searches.unshift(entry);
  // Garder les 20 dernières
  localStorage.setItem("prospectai_searches", JSON.stringify(searches.slice(0, 20)));
  return entry;
}

export function deleteSearch(id: string) {
  const searches = getSavedSearches().filter((s) => s.id !== id);
  localStorage.setItem("prospectai_searches", JSON.stringify(searches));
}
