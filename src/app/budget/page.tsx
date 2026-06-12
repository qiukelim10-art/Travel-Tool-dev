"use client";

import { BudgetClient } from "@/components/BudgetClient";
import { SectionHeader } from "@/components/SectionHeader";
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
      <BudgetClient />
    </div>
  );
}
