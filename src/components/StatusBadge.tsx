"use client";

import type { BookingStatus } from "@/data/tripData";
import { useLanguage } from "@/lib/i18n";
import { translateText } from "@/lib/localize";

type StatusBadgeProps = {
  status: BookingStatus | "Check Before Departure" | "Confirmed" | "Urgent" | "Not Needed";
};

const statusClass: Record<string, string> = {
  Booked: "bg-emerald-100 text-emerald-800 ring-emerald-200",
  Paid: "bg-emerald-100 text-emerald-800 ring-emerald-200",
  Confirmed: "bg-emerald-100 text-emerald-800 ring-emerald-200",
  Pending: "bg-amber-100 text-amber-800 ring-amber-200",
  "Need Confirmation": "bg-amber-100 text-amber-800 ring-amber-200",
  "Check Before Departure": "bg-amber-100 text-amber-800 ring-amber-200",
  Cancelled: "bg-red-100 text-red-800 ring-red-200",
  Urgent: "bg-red-100 text-red-800 ring-red-200",
  "Not Needed": "bg-zinc-100 text-zinc-700 ring-zinc-200",
  "Not Booked": "bg-zinc-100 text-zinc-700 ring-zinc-200"
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const { language } = useLanguage();

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${
        statusClass[status] ?? "bg-zinc-100 text-zinc-700 ring-zinc-200"
      }`}
    >
      {translateText(language, status)}
    </span>
  );
}
