"use client";

import { SectionHeader } from "@/components/SectionHeader";
import { packingItems } from "@/data/tripData";
import { useLanguage } from "@/lib/i18n";
import { localizeList } from "@/lib/localize";

export default function PackingPage() {
  const { language, t } = useLanguage();
  const localizedItems = localizeList(language, packingItems);
  const categories = Array.from(new Set(localizedItems.map((item) => item.category)));
  const requiredCount = packingItems.filter((item) => item.required).length;
  const checkedCount = packingItems.filter((item) => item.checked).length;

  return (
    <div>
      <SectionHeader
        eyebrow={t("page.packing.eyebrow")}
        title={t("page.packing.title")}
        description={t("page.packing.description")}
      />

      <div className="mb-5 grid gap-3 sm:grid-cols-3">
        <SummaryCard label={t("page.packing.totalItems")} value={String(packingItems.length)} />
        <SummaryCard label={t("common.required")} value={String(requiredCount)} />
        <SummaryCard label={t("page.packing.checked")} value={String(checkedCount)} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {categories.map((category) => (
          <section key={category} className="rounded-lg border border-zinc-200 bg-white p-4 shadow-soft">
            <h2 className="text-lg font-semibold text-ink">{category}</h2>
            <div className="mt-3 space-y-3">
              {localizedItems
                .filter((item) => item.category === category)
                .map((item) => (
                  <article key={`${item.category}-${item.item}`} className="flex gap-3 rounded-lg bg-zinc-50 p-3">
                    <span
                      className={`mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded border ${
                        item.checked
                          ? "border-moss bg-moss text-white"
                          : "border-zinc-300 bg-white text-transparent"
                      }`}
                      aria-hidden="true"
                    >
                      x
                    </span>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold text-ink">{item.item}</h3>
                        {item.required ? (
                          <span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-800">
                            {t("common.required")}
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-1 text-sm text-zinc-600">
                        {t("common.owner")}: {item.owner}
                      </p>
                    </div>
                  </article>
                ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <section className="rounded-lg border border-zinc-200 bg-white p-4 shadow-soft">
      <p className="text-xs font-semibold uppercase tracking-[0.08em] text-zinc-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-ink">{value}</p>
    </section>
  );
}
