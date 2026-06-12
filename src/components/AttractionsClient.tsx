"use client";

import { useMemo, useState } from "react";
import type { Attraction } from "@/data/tripData";
import { StatusBadge } from "@/components/StatusBadge";
import { useLanguage } from "@/lib/i18n";
import { translateOption, translateText } from "@/lib/localize";

type AttractionsClientProps = {
  attractions: Attraction[];
};

export function AttractionsClient({ attractions }: AttractionsClientProps) {
  const { language, t } = useLanguage();
  const cities = useMemo(
    () => ["All", ...Array.from(new Set(attractions.map((attraction) => attraction.city)))],
    [attractions]
  );
  const priorities = useMemo(
    () => ["All", ...Array.from(new Set(attractions.map((attraction) => attraction.priority)))],
    [attractions]
  );
  const [city, setCity] = useState("All");
  const [priority, setPriority] = useState("All");

  const visibleAttractions = attractions.filter((attraction) => {
    const cityMatches = city === "All" || attraction.city === city;
    const priorityMatches = priority === "All" || attraction.priority === priority;
    return cityMatches && priorityMatches;
  });

  return (
    <div className="space-y-4">
      <div className="grid gap-3 rounded-lg border border-zinc-200 bg-white p-3 sm:grid-cols-2">
        <FilterSelect label={t("common.city")} value={city} options={cities} onChange={setCity} />
        <FilterSelect
          label={t("common.priority")}
          value={priority}
          options={priorities}
          onChange={setPriority}
        />
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {visibleAttractions.map((attraction) => (
          <article key={`${attraction.city}-${attraction.name}`} className="rounded-lg border border-zinc-200 bg-white p-4 shadow-soft">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-terracotta">
                  {translateText(language, attraction.city)} - {translateText(language, attraction.priority)}
                </p>
                <h2 className="mt-1 text-lg font-semibold text-ink">{translateText(language, attraction.name)}</h2>
              </div>
              <StatusBadge status={attraction.bookingStatus} />
            </div>
            <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <Field label={t("common.ticket")} value={attraction.ticketRequired ? t("common.required") : t("common.freeNotNeeded")} />
              <Field label={t("common.duration")} value={translateText(language, attraction.estimatedDuration) ?? attraction.estimatedDuration} />
              <Field label={t("common.booking")} value={translateText(language, attraction.bookingStatus) ?? attraction.bookingStatus} />
              <Field label={t("common.priority")} value={translateText(language, attraction.priority) ?? attraction.priority} />
            </dl>
            {attraction.notes ? (
              <p className="mt-3 text-sm leading-6 text-zinc-600">
                {translateText(language, attraction.notes)}
              </p>
            ) : null}
            <div className="mt-4 flex flex-wrap gap-2">
              {attraction.googleMapsLink ? (
                <a
                  href={attraction.googleMapsLink}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-md bg-moss px-3 py-2 text-sm font-semibold text-white"
                >
                  {t("common.openMap")}
                </a>
              ) : null}
              {attraction.officialWebsite ? (
                <a
                  href={attraction.officialWebsite}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold text-ink"
                >
                  {t("common.officialSite")}
                </a>
              ) : null}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

function FilterSelect({
  label,
  value,
  options,
  onChange
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  const { language } = useLanguage();

  return (
    <label className="text-sm font-semibold text-ink">
      {label}
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-700"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {translateOption(language, option)}
          </option>
        ))}
      </select>
    </label>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-[0.08em] text-zinc-500">{label}</dt>
      <dd className="mt-1 text-zinc-700">{value}</dd>
    </div>
  );
}
