"use client";

import { ItineraryClient } from "@/components/ItineraryClient";
import { SectionHeader } from "@/components/SectionHeader";
import { useLanguage } from "@/lib/i18n";

export default function ItineraryPage() {
  const { t } = useLanguage();

  return (
    <div className="w-full max-w-full overflow-x-hidden">
      <SectionHeader
        eyebrow={t("page.itinerary.eyebrow")}
        title={t("page.itinerary.title")}
        description={t("page.itinerary.description")}
      />
      <ItineraryClient />
    </div>
  );
}
