"use client";

import { GoogleMapsSearchPanel } from "@/components/GoogleMapsSearchPanel";
import { MapDirectory } from "@/components/MapDirectory";
import { SectionHeader } from "@/components/SectionHeader";
import { mapLocations, tripMaps } from "@/data/tripData";
import { useLanguage } from "@/lib/i18n";
import { localizeList } from "@/lib/localize";

export default function MapPage() {
  const { language, t } = useLanguage();
  const localizedMaps = localizeList(language, tripMaps);

  return (
    <div>
      <SectionHeader
        eyebrow={t("page.map.eyebrow")}
        title={t("page.map.title")}
        description={t("page.map.description")}
      />

      <div className="mb-6">
        <GoogleMapsSearchPanel
          title="Useful places nearby"
          description="Search practical places around your current location, then use Google Maps for ratings, opening hours, directions, and live details."
          defaultQuery="pharmacy"
          quickSearches={[
            "pharmacy",
            "supermarket",
            "train station",
            "ATM",
            "hospital",
            "taxi stand"
          ]}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {localizedMaps.map((map) => (
          <section key={map.title} className="overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-soft">
            <div className="p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-terracotta">
                {map.city}
              </p>
              <h2 className="mt-1 text-lg font-semibold text-ink">{map.title}</h2>
              <p className="mt-2 text-sm leading-6 text-zinc-600">{map.notes}</p>
            </div>
            <iframe
              src={map.embedUrl}
              title={map.title}
              className="h-72 w-full border-0"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </section>
        ))}
      </div>

      <section className="mt-6">
        <SectionHeader
          eyebrow={t("page.map.directoryEyebrow")}
          title={t("page.map.directoryTitle")}
          description={t("page.map.directoryDescription")}
        />
        <MapDirectory locations={mapLocations} />
      </section>
    </div>
  );
}
