"use client";

import { DocumentsClient } from "@/components/DocumentsClient";
import { SectionHeader } from "@/components/SectionHeader";
import { travelers } from "@/data/tripData";
import { useLanguage } from "@/lib/i18n";

export default function DocumentsPage() {
  const { t } = useLanguage();

  return (
    <div>
      <SectionHeader
        eyebrow={t("page.documents.eyebrow")}
        title={t("page.documents.title")}
        description={t("page.documents.description")}
      />
      <DocumentsClient travelers={travelers} />
    </div>
  );
}
