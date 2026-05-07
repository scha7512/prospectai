"use client";

import { Business } from "@/app/api/search/route";
import { MapPin, Phone, Clock, Tag, Mail, ExternalLink } from "lucide-react";

const TYPE_LABELS: Record<string, string> = {
  restaurant: "Restaurant",
  cafe: "Café",
  bar: "Bar",
  bakery: "Boulangerie",
  beauty_salon: "Salon de beauté",
  hair_care: "Coiffeur",
  gym: "Salle de sport",
  laundry: "Pressing/Laverie",
  clothing_store: "Vêtements",
  pharmacy: "Pharmacie",
  doctor: "Médecin",
  dentist: "Dentiste",
  car_repair: "Garage",
  plumber: "Plombier",
  electrician: "Électricien",
  locksmith: "Serrurier",
  florist: "Fleuriste",
  lodging: "Hôtel",
  real_estate_agency: "Agence immo",
  accounting: "Comptable",
};

function getMainType(types: string[]): string {
  for (const t of types) {
    if (TYPE_LABELS[t]) return TYPE_LABELS[t];
  }
  return types[0]?.replace(/_/g, " ") || "Entreprise";
}


interface Props {
  business: Business;
  index: number;
}

export default function BusinessCard({ business, index }: Props) {
  const handleCopyPhone = () => {
    if (business.phone) navigator.clipboard.writeText(business.phone);
  };

  const handleMaps = () => {
    window.open(
      `https://www.openstreetmap.org/?mlat=${business.lat}&mlon=${business.lng}&zoom=17`,
      "_blank"
    );
  };

  return (
    <div
      className="glass glass-hover rounded-2xl p-5 flex flex-col gap-3 transition-all duration-200 slide-up cursor-default"
      style={{ animationDelay: `${index * 40}ms` }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="font-semibold text-white text-base leading-tight">{business.name}</h3>
          <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-md bg-indigo-500/15 text-indigo-300 text-xs">
            <Tag size={10} />
            {getMainType(business.types)}
          </span>
        </div>
        <span className="shrink-0 px-2 py-0.5 rounded-lg bg-red-500/15 text-red-400 text-xs font-medium border border-red-500/20">
          Sans site web
        </span>
      </div>

      {/* Info rows */}
      <div className="flex flex-col gap-1.5 text-sm text-white/50">
        {business.address && (
          <div className="flex items-start gap-2">
            <MapPin size={13} className="mt-0.5 shrink-0 text-white/30" />
            <span className="leading-snug">{business.address}</span>
          </div>
        )}
        {business.phone && (
          <div className="flex items-center gap-2">
            <Phone size={13} className="shrink-0 text-white/30" />
            <span className="font-medium text-white/70">{business.phone}</span>
          </div>
        )}
        {business.email && (
          <div className="flex items-center gap-2">
            <Mail size={13} className="shrink-0 text-white/30" />
            <span className="font-medium text-white/70 truncate">{business.email}</span>
          </div>
        )}
        {business.opening_hours_raw && (
          <div className="flex items-start gap-2">
            <Clock size={13} className="mt-0.5 shrink-0 text-white/30" />
            <span className="text-white/40 text-xs leading-snug">{business.opening_hours_raw}</span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-1">
        <button
          onClick={handleMaps}
          className="flex-1 py-2 rounded-xl bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-300 text-xs font-medium transition-colors border border-indigo-500/20 flex items-center justify-center gap-1"
        >
          <ExternalLink size={12} /> Voir sur Maps
        </button>
        {business.phone && (
          <button
            onClick={handleCopyPhone}
            className="flex-1 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white/80 text-xs font-medium transition-colors border border-white/10"
          >
            Copier le tél.
          </button>
        )}
      </div>
    </div>
  );
}
