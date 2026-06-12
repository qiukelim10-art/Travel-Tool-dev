"use client";

import { useMemo, useState } from "react";
import type { ItineraryDay } from "@/data/tripData";
import { useLanguage } from "@/lib/i18n";
import { formatMoney } from "@/lib/budget";
import { localizeList, translateOption } from "@/lib/localize";

type ItineraryClientProps = {
  days: ItineraryDay[];
};

export function ItineraryClient({ days }: ItineraryClientProps) {
  const { language, t } = useLanguage();
  const cities = useMemo(() => ["All", ...Array.from(new Set(days.map((day) => day.city)))], [days]);
  const [selectedCity, setSelectedCity] = useState("All");
  const [openDay, setOpenDay] = useState(days[0]?.day ?? 1);

  const visibleDays = selectedCity === "All" ? days : days.filter((day) => day.city === selectedCity);
  const localizedDays = localizeList(language, visibleDays);

  return (
    <div className="space-y-5">
      <div className="flex gap-2 overflow-x-auto pb-1">
        {cities.map((city) => (
          <button
            key={city}
            type="button"
            onClick={() => setSelectedCity(city)}
            className={`shrink-0 rounded-md border px-3 py-2 text-sm font-semibold ${
              selectedCity === city
                ? "border-moss bg-moss text-white"
                : "border-zinc-200 bg-white text-zinc-700"
            }`}
          >
            {translateOption(language, city)}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {localizedDays.map((day) => {
          const expanded = openDay === day.day;

          return (
            <article key={day.day} className="rounded-lg border border-zinc-200 bg-white p-4 shadow-soft">
              <button
                type="button"
                onClick={() => setOpenDay(expanded ? 0 : day.day)}
                className="flex w-full items-start justify-between gap-4 text-left"
              >
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.08em] text-terracotta">
                    {language === "zh" ? `第 ${day.day} 天` : `Day ${day.day}`} - {day.date}
                  </p>
                  <h2 className="mt-1 text-xl font-semibold text-ink">{day.title}</h2>
                  <p className="mt-1 text-sm text-zinc-600">{day.city}</p>
                </div>
                <span className="rounded-md bg-zinc-100 px-2 py-1 text-xs font-semibold text-zinc-700">
                  {expanded ? t("common.close") : t("common.open")}
                </span>
              </button>

              <p className="mt-4 rounded-md bg-[#f8f3e6] px-3 py-2 text-sm font-medium text-ink">
                {day.highlight}
              </p>

              {expanded ? (
                <div className="mt-4 grid gap-4 lg:grid-cols-[1.4fr_1fr]">
                  <div className="space-y-3">
                    <TimelineBlock title={t("page.itinerary.morning")} items={day.morning} />
                    <TimelineBlock title={t("page.itinerary.afternoon")} items={day.afternoon} />
                    <TimelineBlock title={t("page.itinerary.evening")} items={day.evening} />
                  </div>
                  <aside className="space-y-3 rounded-lg border border-zinc-200 bg-zinc-50 p-3">
                    <InfoBlock title={t("page.itinerary.base")} items={[day.hotel ?? t("page.itinerary.noHotel")]} />
                    <InfoBlock title={t("page.itinerary.transport")} items={day.transport} />
                    <InfoBlock title={t("page.itinerary.meals")} items={day.meals} />
                    <InfoBlock title={t("page.itinerary.tickets")} items={day.tickets} />
                    <p className="text-sm text-zinc-700">
                      {t("page.itinerary.estimatedCost")}{" "}
                      <span className="font-semibold text-ink">
                        {formatMoney(day.estimatedCost, day.currency)}
                      </span>
                    </p>
                    <p className="text-sm leading-6 text-zinc-600">{day.notes}</p>
                    <div className="flex flex-wrap gap-2">
                      {day.mapLinks.map((link) => (
                        <a
                          key={link.label}
                          href={link.url}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded-md bg-moss px-3 py-2 text-sm font-semibold text-white"
                        >
                          {t("common.open")} {link.label}
                        </a>
                      ))}
                    </div>
                  </aside>
                </div>
              ) : null}
            </article>
          );
        })}
      </div>
    </div>
  );
}

function TimelineBlock({ title, items }: { title: string; items: string[] }) {
  return (
    <section className="rounded-lg border border-zinc-200 p-3">
      <h3 className="text-sm font-semibold text-ink">{title}</h3>
      <ul className="mt-2 space-y-2">
        {items.map((item) => (
          <li key={item} className="text-sm leading-6 text-zinc-600">
            {item}
          </li>
        ))}
      </ul>
    </section>
  );
}

function InfoBlock({ title, items }: { title: string; items: string[] }) {
  return (
    <section>
      <h3 className="text-xs font-semibold uppercase tracking-[0.08em] text-zinc-500">
        {title}
      </h3>
      <ul className="mt-1 space-y-1">
        {items.map((item) => (
          <li key={item} className="text-sm leading-6 text-zinc-700">
            {item}
          </li>
        ))}
      </ul>
    </section>
  );
}
