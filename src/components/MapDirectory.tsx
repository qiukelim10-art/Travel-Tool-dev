"use client";

import { useMemo, useState } from "react";
import type { MapLocation } from "@/data/tripData";
import { useLanguage } from "@/lib/i18n";
import { translateOption, translateText } from "@/lib/localize";

type MapDirectoryProps = {
  locations: MapLocation[];
};

export function MapDirectory({ locations }: MapDirectoryProps) {
  const { language, t } = useLanguage();
  const cities = useMemo(
    () => ["All", ...Array.from(new Set(locations.map((location) => location.city)))],
    [locations]
  );
  const categories = useMemo(
    () => ["All", ...Array.from(new Set(locations.map((location) => location.category)))],
    [locations]
  );
  const [city, setCity] = useState("All");
  const [category, setCategory] = useState("All");

  const visibleLocations = locations.filter((location) => {
    const cityMatches = city === "All" || location.city === city;
    const categoryMatches = category === "All" || location.category === category;
    return cityMatches && categoryMatches;
  });

  return (
    <div className="space-y-4">
      <div className="grid gap-3 rounded-lg border border-zinc-200 bg-white p-3 sm:grid-cols-2">
        <FilterSelect label={t("common.city")} value={city} options={cities} onChange={setCity} />
        <FilterSelect
          label={t("common.category")}
          value={category}
          options={categories}
          onChange={setCategory}
        />
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {visibleLocations.map((location) => (
          <article key={`${location.city}-${location.name}`} className="rounded-lg border border-zinc-200 bg-white p-4 shadow-soft">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-zinc-500">
                  {translateText(language, location.city)} - {translateText(language, location.category)}
                </p>
                <h2 className="mt-1 text-lg font-semibold text-ink">{translateText(language, location.name)}</h2>
              </div>
              <a
                href={location.googleMapsLink}
                target="_blank"
                rel="noreferrer"
                className="rounded-md bg-moss px-3 py-2 text-sm font-semibold text-white"
              >
                {t("common.openMap")}
              </a>
            </div>
            <p className="mt-3 text-sm leading-6 text-zinc-600">
              {translateText(language, location.address)}
            </p>
            {location.notes ? (
              <p className="mt-2 text-sm leading-6 text-zinc-600">
                {translateText(language, location.notes)}
              </p>
            ) : null}
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
