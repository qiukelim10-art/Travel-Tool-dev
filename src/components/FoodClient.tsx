"use client";

import { useMemo, useState } from "react";
import type { Restaurant } from "@/data/tripData";
import { StatusBadge } from "@/components/StatusBadge";
import { useLanguage } from "@/lib/i18n";
import { translateOption, translateText } from "@/lib/localize";

type FoodClientProps = {
  restaurants: Restaurant[];
};

export function FoodClient({ restaurants }: FoodClientProps) {
  const { language, t } = useLanguage();
  const cities = useMemo(
    () => ["All", ...Array.from(new Set(restaurants.map((restaurant) => restaurant.city)))],
    [restaurants]
  );
  const priorities = useMemo(
    () => ["All", ...Array.from(new Set(restaurants.map((restaurant) => restaurant.priority)))],
    [restaurants]
  );
  const [city, setCity] = useState("All");
  const [priority, setPriority] = useState("All");

  const visibleRestaurants = restaurants.filter((restaurant) => {
    const cityMatches = city === "All" || restaurant.city === city;
    const priorityMatches = priority === "All" || restaurant.priority === priority;
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
        {visibleRestaurants.map((restaurant) => (
          <article key={`${restaurant.city}-${restaurant.name}`} className="rounded-lg border border-zinc-200 bg-white p-4 shadow-soft">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-terracotta">
                  {translateText(language, restaurant.city)} - {translateText(language, restaurant.cuisine)}
                </p>
                <h2 className="mt-1 text-lg font-semibold text-ink">{translateText(language, restaurant.name)}</h2>
              </div>
              <StatusBadge status={restaurant.reservationStatus} />
            </div>
            <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <Field label={t("common.priority")} value={translateText(language, restaurant.priority) ?? restaurant.priority} />
              <Field label={t("common.price")} value={translateText(language, restaurant.priceRange) ?? restaurant.priceRange} />
              <Field label={t("common.reservation")} value={translateText(language, restaurant.reservationStatus) ?? restaurant.reservationStatus} />
              <Field label={t("common.city")} value={translateText(language, restaurant.city) ?? restaurant.city} />
            </dl>
            {restaurant.notes ? (
              <p className="mt-3 text-sm leading-6 text-zinc-600">
                {translateText(language, restaurant.notes)}
              </p>
            ) : null}
            {restaurant.googleMapsLink ? (
              <a
                href={restaurant.googleMapsLink}
                target="_blank"
                rel="noreferrer"
                className="mt-4 inline-flex rounded-md bg-moss px-3 py-2 text-sm font-semibold text-white"
              >
                {t("common.openMap")}
              </a>
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

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-[0.08em] text-zinc-500">{label}</dt>
      <dd className="mt-1 text-zinc-700">{value}</dd>
    </div>
  );
}
