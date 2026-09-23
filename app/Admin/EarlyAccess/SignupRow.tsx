"use client";

import SourceIcon, { sourceLabel } from "../../components/SourceIcon/SourceIcon";

export interface Signup {
  id: string;
  email: string;
  phone: string;
  source: string;
  sources: string[];
  createdAt: string | null;
}

/** First touch first, then any other channel the person came back through. */
export function channelsOf(signup: Signup): string[] {
  const all = Array.from(new Set([signup.source, ...signup.sources].filter(Boolean)));
  return all.length ? all : [""];
}

export function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("he-IL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** One signup. Stacks on a phone so a long address has the full width, and
 *  wraps rather than truncating — the address is the point of the row. */
export default function SignupRow({ signup }: { signup: Signup }) {
  const channels = channelsOf(signup);

  return (
    <div className="bg-white border border-secondary rounded-xl shadow-sm px-4 py-3.5 sm:px-5 sm:py-4 flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
      <div className="min-w-0">
        {signup.email && (
          <div dir="ltr" className="font-semibold text-strongText text-sm leading-snug break-all text-right">
            {signup.email}
          </div>
        )}
        {signup.phone && (
          <div
            dir="ltr"
            className={`text-mutedText text-xs text-right ${signup.email ? "mt-0.5" : ""}`}
          >
            {signup.phone}
          </div>
        )}
        {!signup.email && !signup.phone && <div className="text-mutedText text-sm">—</div>}
      </div>

      <div className="flex items-center justify-between gap-3 sm:justify-end flex-shrink-0">
        <div className="flex items-center gap-1.5" title={channels.map(sourceLabel).join(" · ")}>
          {channels.map((channel) => (
            <SourceIcon key={channel || "direct"} source={channel} size={24} />
          ))}
        </div>
        <div className="text-mutedText text-xs whitespace-nowrap">
          {formatDate(signup.createdAt)}
        </div>
      </div>
    </div>
  );
}
