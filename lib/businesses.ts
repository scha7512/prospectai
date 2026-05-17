export interface BusinessConfig {
  id: string;
  name: string;
  emoji: string;
  description: string;
  accentColor: string;
  accentLight: string;
  accentBg: string;
  accentBorder: string;
  sectors: { type: string; label: string; icon: string }[];
}

export const BUSINESSES: BusinessConfig[] = [
  {
    id: "gensite",
    name: "GenSite",
    emoji: "🌐",
    description: "Création de sites web pour entreprises locales",
    accentColor: "#6366f1",
    accentLight: "#818cf8",
    accentBg: "rgba(99,102,241,0.1)",
    accentBorder: "rgba(99,102,241,0.25)",
    sectors: [
      { type: "restaurant",         label: "Restaurant",        icon: "🍽️" },
      { type: "cafe",               label: "Café",              icon: "☕" },
      { type: "bar",                label: "Bar / Pub",         icon: "🍺" },
      { type: "bakery",             label: "Boulangerie",       icon: "🥐" },
      { type: "beauty_salon",       label: "Salon de beauté",   icon: "💅" },
      { type: "hair_care",          label: "Coiffeur",          icon: "✂️" },
      { type: "gym",                label: "Salle de sport",    icon: "🏋️" },
      { type: "laundry",            label: "Laverie",           icon: "👕" },
      { type: "clothing_store",     label: "Vêtements",         icon: "🛍️" },
      { type: "pharmacy",           label: "Pharmacie",         icon: "💊" },
      { type: "doctor",             label: "Médecin",           icon: "🩺" },
      { type: "dentist",            label: "Dentiste",          icon: "🦷" },
      { type: "car_repair",         label: "Garage auto",       icon: "🔧" },
      { type: "plumber",            label: "Plombier",          icon: "🪠" },
      { type: "electrician",        label: "Électricien",       icon: "⚡" },
      { type: "locksmith",          label: "Serrurier",         icon: "🔐" },
      { type: "florist",            label: "Fleuriste",         icon: "🌸" },
      { type: "lodging",            label: "Hôtel / B&B",       icon: "🏨" },
      { type: "real_estate_agency", label: "Agence immo",       icon: "🏠" },
      { type: "accounting",         label: "Comptable",         icon: "📊" },
    ],
  },
  {
    id: "copywriting",
    name: "Copywriting",
    emoji: "✍️",
    description: "Copywriting & contenu pour professionnels",
    accentColor: "#f59e0b",
    accentLight: "#fbbf24",
    accentBg: "rgba(245,158,11,0.1)",
    accentBorder: "rgba(245,158,11,0.25)",
    sectors: [
      { type: "real_estate_agency",  label: "Agence immobilière",       icon: "🏠" },
      { type: "recruitment_agency",  label: "Cabinet de recrutement",   icon: "🧑‍💼" },
      { type: "travel_agency",       label: "Agence de voyage",         icon: "✈️" },
      { type: "concierge",           label: "Conciergerie",             icon: "🛎️" },
      { type: "event_agency",        label: "Agence événementielle",    icon: "🎉" },
      { type: "property_developer",  label: "Promoteur immobilier",     icon: "🏗️" },
      { type: "seasonal_rental",     label: "Location saisonnière",     icon: "🏖️" },
    ],
  },
];

export const SECTOR_QUERIES_COPYWRITING: Record<string, string> = {
  real_estate_agency: "agence immobilière",
  recruitment_agency: "cabinet recrutement",
  travel_agency:      "agence de voyage",
  concierge:          "conciergerie",
  event_agency:       "agence événementielle",
  property_developer: "promoteur immobilier",
  seasonal_rental:    "location saisonnière",
};

export function getBusinessConfig(id: string): BusinessConfig {
  return BUSINESSES.find((b) => b.id === id) || BUSINESSES[0];
}
