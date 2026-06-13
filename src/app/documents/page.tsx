"use client";

import { DocumentsClient } from "@/components/DocumentsClient";
import { SectionHeader } from "@/components/SectionHeader";
import { useLanguage } from "@/lib/i18n";
import { useTripSettingsView } from "@/lib/useTripSettings";

export default function DocumentsPage() {
  const { t } = useLanguage();
  const { trip } = useTripSettingsView();

  return (
    <div>
      <SectionHeader
        eyebrow={t("page.documents.eyebrow")}
        title={t("page.documents.title")}
        description={t("page.documents.description")}
      />
      <DocumentsClient travelers={trip.travelers} />
    </div>
  );
}
