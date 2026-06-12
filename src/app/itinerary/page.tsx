"use client";

import { ItineraryClient } from "@/components/ItineraryClient";
import { SectionHeader } from "@/components/SectionHeader";
import { itinerary } from "@/data/tripData";
import { useLanguage } from "@/lib/i18n";

export default function ItineraryPage() {
  const { t } = useLanguage();

  return (
    <div>
      <SectionHeader
        eyebrow={t("page.itinerary.eyebrow")}
        title={t("page.itinerary.title")}
        description={t("page.itinerary.description")}
      />
      <ItineraryClient days={itinerary} />
    </div>
  );
}
