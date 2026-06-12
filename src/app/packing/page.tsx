"use client";

import { PackingClient } from "@/components/PackingClient";
import { SectionHeader } from "@/components/SectionHeader";
import { travelers } from "@/data/tripData";
import { useLanguage } from "@/lib/i18n";

export default function PackingPage() {
  const { t } = useLanguage();

  return (
    <div>
      <SectionHeader
        eyebrow={t("page.packing.eyebrow")}
        title={t("page.packing.title")}
        description={t("page.packing.description")}
      />
      <PackingClient travelers={travelers} />
    </div>
  );
}
