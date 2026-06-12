"use client";

import { EmergencyCard } from "@/components/EmergencyCard";
import { SectionHeader } from "@/components/SectionHeader";
import { emergencyInfo } from "@/data/tripData";
import { useLanguage } from "@/lib/i18n";

export default function EmergencyPage() {
  const { t } = useLanguage();
  const urgent = emergencyInfo.filter((item) => item.urgent);
  const rest = emergencyInfo.filter((item) => !item.urgent);

  return (
    <div>
      <SectionHeader
        eyebrow={t("page.emergency.eyebrow")}
        title={t("page.emergency.title")}
        description={t("page.emergency.description")}
      />
      <div className="grid gap-4">
        {urgent.map((item) => (
          <EmergencyCard key={item.title} item={item} />
        ))}
      </div>
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        {rest.map((item) => (
          <EmergencyCard key={item.title} item={item} />
        ))}
      </div>
    </div>
  );
}
