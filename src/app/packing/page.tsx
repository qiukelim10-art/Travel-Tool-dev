"use client";

import { PackingClient } from "@/components/PackingClient";
import { SectionHeader } from "@/components/SectionHeader";
import { useLanguage } from "@/lib/i18n";
import { useTripSettingsView } from "@/lib/useTripSettings";

export default function PackingPage() {
  const { t } = useLanguage();
  const { trip } = useTripSettingsView();

  return (
    <div>
      <SectionHeader
        eyebrow={t("page.packing.eyebrow")}
        title={t("page.packing.title")}
        description={t("page.packing.description")}
      />
      <PackingClient travelers={trip.travelers} />
    </div>
  );
}
