"use client";

import type { Expense } from "@/data/tripData";
import { formatMoney, summarizeBudget } from "@/lib/budget";
import { useLanguage } from "@/lib/i18n";
import { translateText } from "@/lib/localize";

type BudgetSummaryProps = {
  expenses: Expense[];
  participants: string[];
};

export function BudgetSummary({ expenses, participants }: BudgetSummaryProps) {
  const { language, t } = useLanguage();
  const summaries = summarizeBudget(expenses, participants);
  const unsettled = expenses.filter((expense) => !expense.settled);

  return (
    <div className="space-y-5">
      <div className="grid gap-4 lg:grid-cols-2">
        {summaries.map((summary) => (
          <section key={summary.currency} className="rounded-lg border border-zinc-200 bg-white p-4 shadow-soft">
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-terracotta">
              {summary.currency} {t("page.budget.summary")}
            </p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <Metric label={t("page.budget.totalTripCost")} value={formatMoney(summary.total, summary.currency)} />
              <Metric
                label={t("page.budget.costPerPerson")}
                value={formatMoney(summary.costPerPerson, summary.currency)}
              />
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <PersonList title={t("page.budget.paidByEachPerson")} values={summary.paidByPerson} currency={summary.currency} />
              <PersonList title={t("page.budget.owedByEachPerson")} values={summary.owedByPerson} currency={summary.currency} />
            </div>

            <div className="mt-5 rounded-lg bg-zinc-50 p-3">
              <h3 className="text-sm font-semibold text-ink">{t("page.budget.settlementSummary")}</h3>
              {summary.settlements.length > 0 ? (
                <ul className="mt-2 space-y-2">
                  {summary.settlements.map((settlement) => (
                    <li key={`${settlement.from}-${settlement.to}-${settlement.amount}`} className="text-sm text-zinc-700">
                      <span className="font-semibold text-ink">{translateText(language, settlement.from)}</span>{" "}
                      {t("page.budget.pays")}{" "}
                      <span className="font-semibold text-ink">{translateText(language, settlement.to)}</span>{" "}
                      {formatMoney(settlement.amount, settlement.currency)}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-sm text-zinc-600">{t("page.budget.noSettlement")}</p>
              )}
            </div>
          </section>
        ))}
      </div>

      <section className="rounded-lg border border-zinc-200 bg-white p-4 shadow-soft">
        <h2 className="text-lg font-semibold text-ink">{t("page.budget.unsettledExpenses")}</h2>
        <div className="mt-3 grid gap-3">
          {unsettled.map((expense) => (
            <article key={expense.id} className="rounded-lg border border-zinc-200 p-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-ink">{translateText(language, expense.item)}</p>
                  <p className="mt-1 text-xs uppercase tracking-[0.08em] text-zinc-500">
                    {translateText(language, expense.category)} - {expense.date}
                  </p>
                </div>
                <p className="text-sm font-semibold text-ink">
                  {formatMoney(expense.amount, expense.currency)}
                </p>
              </div>
              <p className="mt-2 text-sm text-zinc-600">
                {t("page.budget.paidBy")} {translateText(language, expense.paidBy)}.{" "}
                {t("page.budget.splitAmong")}{" "}
                {expense.splitAmong.map((person) => translateText(language, person)).join(", ")}.
              </p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-zinc-50 p-3">
      <p className="text-xs font-semibold uppercase tracking-[0.08em] text-zinc-500">{label}</p>
      <p className="mt-1 text-xl font-semibold text-ink">{value}</p>
    </div>
  );
}

function PersonList({
  title,
  values,
  currency
}: {
  title: string;
  values: Record<string, number>;
  currency: "EUR" | "SGD";
}) {
  const { language } = useLanguage();

  return (
    <div>
      <h3 className="text-sm font-semibold text-ink">{title}</h3>
      <ul className="mt-2 space-y-2">
        {Object.entries(values).map(([person, amount]) => (
          <li key={person} className="flex justify-between gap-3 text-sm text-zinc-700">
            <span>{translateText(language, person)}</span>
            <span className="font-medium text-ink">{formatMoney(amount, currency)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
