"use client";

import { BudgetSummary } from "@/components/BudgetSummary";
import { SectionHeader } from "@/components/SectionHeader";
import { expenses, tripInfo } from "@/data/tripData";
import { useLanguage } from "@/lib/i18n";

export default function BudgetPage() {
  const { t } = useLanguage();

  return (
    <div>
      <SectionHeader
        eyebrow={t("page.budget.eyebrow")}
        title={t("page.budget.title")}
        description={t("page.budget.description")}
      />
      <BudgetSummary expenses={expenses} participants={tripInfo.participants} />
    </div>
  );
}
