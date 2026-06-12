"use client";

import type { EmergencyInfo } from "@/data/tripData";
import { useLanguage } from "@/lib/i18n";
import { translateText } from "@/lib/localize";

type EmergencyCardProps = {
  item: EmergencyInfo;
};

export function EmergencyCard({ item }: EmergencyCardProps) {
  const { language, t } = useLanguage();

  return (
    <article
      className={`rounded-lg border p-4 shadow-soft ${
        item.urgent ? "border-red-300 bg-red-50" : "border-zinc-200 bg-white"
      }`}
    >
      <p className="text-xs font-semibold uppercase tracking-[0.08em] text-zinc-500">
        {translateText(language, item.type)}
      </p>
      <h2 className={`mt-1 font-semibold ${item.urgent ? "text-4xl text-red-700" : "text-xl text-ink"}`}>
        {item.value}
      </h2>
      <p className="mt-1 text-base font-semibold text-ink">{translateText(language, item.title)}</p>
      {item.notes ? (
        <p className="mt-2 text-sm leading-6 text-zinc-600">{translateText(language, item.notes)}</p>
      ) : null}
      <div className="mt-4 flex flex-wrap gap-2">
        {item.phone ? (
          <a
            href={`tel:${item.phone}`}
            className="rounded-md bg-moss px-3 py-2 text-sm font-semibold text-white"
          >
            {t("common.call")}
          </a>
        ) : null}
        {item.mapLink ? (
          <a
            href={item.mapLink}
            target="_blank"
            rel="noreferrer"
            className="rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold text-ink"
          >
            {t("common.map")}
          </a>
        ) : null}
      </div>
    </article>
  );
}
