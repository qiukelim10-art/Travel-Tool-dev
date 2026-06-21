"use client";

import { BudgetClient } from "@/components/BudgetClient";
import { SectionHeader } from "@/components/SectionHeader";
import { useLanguage } from "@/lib/i18n";
import { useTripSettingsView } from "@/lib/useTripSettings";

export default function BudgetPage() {
  const { t } = useLanguage();
  const { trip } = useTripSettingsView();

  return (
    <div>
      <SectionHeader
        eyebrow={t("page.budget.eyebrow")}
        title={t("page.budget.title")}
        description={t("page.budget.description")}
      />
      <BudgetClient defaultCurrencies={trip.defaultCurrencies} />
    </div>
  );
}
