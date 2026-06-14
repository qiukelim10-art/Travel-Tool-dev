"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { formatMoney, summarizeExpenseLedger } from "@/lib/budget";
import { useLanguage } from "@/lib/i18n";
import type { SharedExpense } from "@/lib/sharedDataTypes";
import type { Traveler } from "@/data/tripData";

type ExpensesApiResponse = {
  expenses?: SharedExpense[];
  travelers?: Traveler[];
  error?: string;
};

const requestTimeoutMs = 10000;

export function DashboardBudgetWidget() {
  const { t } = useLanguage();
  const [expenses, setExpenses] = useState<SharedExpense[]>([]);
  const [travelers, setTravelers] = useState<Traveler[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const orderedTravelers = useMemo(() => orderTravelers(travelers), [travelers]);
  const travelerIds = useMemo(() => orderedTravelers.map((traveler) => traveler.id), [orderedTravelers]);
  const travelerNameById = useMemo(
    () => new Map(orderedTravelers.map((traveler) => [traveler.id, traveler.name])),
    [orderedTravelers]
  );
  const summaries = useMemo(() => summarizeExpenseLedger(expenses, travelerIds), [expenses, travelerIds]);
  const settlementSuggestions = useMemo(
    () =>
      summaries
        .flatMap((summary) => summary.settlements)
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 2),
    [summaries]
  );
  const recentExpenses = useMemo(
    () =>
      expenses
        .slice()
        .sort((a, b) => {
          const dateCompare = b.expenseDate.localeCompare(a.expenseDate);
          if (dateCompare !== 0) {
            return dateCompare;
          }

          return b.createdAt.localeCompare(a.createdAt);
        })
        .slice(0, 2),
    [expenses]
  );

  async function loadExpenses() {
    setLoading(true);
    setError(null);

    try {
      const data = await fetchExpensesJson("/api/expenses", t("budgetWidget.errorLoad"), t("budgetWidget.errorTimeout"));
      setExpenses(data.expenses);
      setTravelers(data.travelers);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : t("budgetWidget.errorLoad"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadExpenses();
  }, []);

  return (
    <section className="travel-panel p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-stamp">
            {t("budgetWidget.eyebrow")}
          </p>
          <h2 className="mt-1 text-lg font-semibold text-ink">{t("budgetWidget.title")}</h2>
          <p className="mt-1 text-sm leading-6 text-zinc-600">
            {t("budgetWidget.description")}
          </p>
        </div>
        <Link
          href="/budget"
          className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-center text-sm font-semibold text-ink sm:w-auto"
        >
          {t("budgetWidget.openBudget")}
        </Link>
      </div>

      {loading ? <p className="mt-4 text-sm text-zinc-600">{t("budgetWidget.loading")}</p> : null}

      {error ? (
        <div className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          <p>{error}</p>
          <button
            type="button"
            onClick={() => void loadExpenses()}
            disabled={loading}
            className="mt-3 rounded-md border border-red-200 bg-white px-3 py-2 text-sm font-semibold text-red-700 disabled:opacity-60"
          >
            {loading ? t("budgetWidget.retrying") : t("common.retry")}
          </button>
        </div>
      ) : null}

      {!loading && !error && expenses.length === 0 ? (
        <div className="mt-4 rounded-lg bg-zinc-50 p-4">
          <p className="text-sm font-semibold text-ink">{t("budgetWidget.emptyTitle")}</p>
          <p className="mt-1 text-sm leading-6 text-zinc-600">
            {t("budgetWidget.emptyDescription")}
          </p>
        </div>
      ) : null}

      {!loading && !error && expenses.length > 0 ? (
        <div className="mt-4 space-y-4">
          <div className="grid gap-2 sm:grid-cols-2">
            {summaries.map((summary) => (
              <article key={summary.currency} className="ledger-row p-3">
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-zinc-500">
                  {summary.currency}
                </p>
                <p className="mt-1 text-xl font-semibold text-ink">
                  {formatMoney(summary.outstandingTotal, summary.currency)}
                </p>
                <p className="mt-1 text-xs text-zinc-500">
                  {t("budgetWidget.totalSpent")} {formatMoney(summary.totalSpent, summary.currency)}
                </p>
              </article>
            ))}
          </div>

          <section className="status-strip p-3">
            <h3 className="text-sm font-semibold text-ink">{t("budgetWidget.topSettlements")}</h3>
            {settlementSuggestions.length > 0 ? (
              <ul className="mt-2 space-y-1.5">
                {settlementSuggestions.map((settlement) => (
                  <li
                    key={`${settlement.currency}-${settlement.fromTravelerId}-${settlement.toTravelerId}-${settlement.amount}`}
                    className="break-words text-sm leading-6 text-zinc-700"
                  >
                    <span className="font-semibold text-ink">
                      {travelerNameById.get(settlement.fromTravelerId) ?? settlement.fromTravelerId}
                    </span>{" "}
                    {t("budgetWidget.pays")}{" "}
                    <span className="font-semibold text-ink">
                      {travelerNameById.get(settlement.toTravelerId) ?? settlement.toTravelerId}
                    </span>{" "}
                    {formatMoney(settlement.amount, settlement.currency)}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm leading-6 text-zinc-600">
                {t("budgetWidget.allBalanced")}
              </p>
            )}
          </section>

          {recentExpenses.length > 0 ? (
            <section className="rounded-lg bg-sandlight p-3">
              <h3 className="text-sm font-semibold text-ink">{t("budgetWidget.recentExpenses")}</h3>
              <ul className="mt-2 space-y-1.5">
                {recentExpenses.map((expense) => (
                  <li key={expense.id} className="min-w-0 text-sm leading-6 text-zinc-700">
                    <div className="flex min-w-0 items-start justify-between gap-3">
                      <span className="min-w-0 break-words font-medium text-ink">{expense.title}</span>
                      <span className="shrink-0 font-semibold text-ink">
                        {formatMoney(expense.amount, expense.currency)}
                      </span>
                    </div>
                    <p className="text-xs uppercase tracking-[0.08em] text-zinc-500">
                      {sourceTypeLabel(expense.sourceType, t)} - {expense.expenseDate}
                    </p>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}

async function fetchExpensesJson(
  url: string,
  fallbackMessage: string,
  timeoutMessage: string
): Promise<{ expenses: SharedExpense[]; travelers: Traveler[] }> {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), requestTimeoutMs);

  try {
    const response = await fetch(url, { signal: controller.signal });
    const data = (await response.json()) as ExpensesApiResponse;

    if (!response.ok) {
      throw new Error(data.error ?? fallbackMessage);
    }

    if (!Array.isArray(data.expenses) || !Array.isArray(data.travelers)) {
      throw new Error(fallbackMessage);
    }

    return {
      expenses: data.expenses.filter(isSharedExpense),
      travelers: data.travelers.filter(isTraveler)
    };
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error(`${fallbackMessage} ${timeoutMessage}`);
    }

    throw error;
  } finally {
    window.clearTimeout(timeoutId);
  }
}

function isSharedExpense(value: unknown): value is SharedExpense {
  if (!value || typeof value !== "object") {
    return false;
  }

  const expense = value as Partial<SharedExpense>;
  return (
    typeof expense.id === "string" &&
    typeof expense.sourceType === "string" &&
    typeof expense.title === "string" &&
    typeof expense.category === "string" &&
    typeof expense.amount === "number" &&
    typeof expense.currency === "string" &&
    typeof expense.paidByTravelerId === "string" &&
    Array.isArray(expense.splitTravelerIds) &&
    typeof expense.settled === "boolean" &&
    typeof expense.expenseDate === "string" &&
    typeof expense.createdAt === "string"
  );
}

function isTraveler(value: unknown): value is Traveler {
  if (!value || typeof value !== "object") {
    return false;
  }

  const traveler = value as Partial<Traveler>;
  return (
    typeof traveler.id === "string" &&
    typeof traveler.name === "string" &&
    typeof traveler.displayOrder === "number"
  );
}

function sourceTypeLabel(sourceType: SharedExpense["sourceType"], t: ReturnType<typeof useLanguage>["t"]) {
  if (sourceType === "misc") {
    return t("budgetWidget.source.misc");
  }

  if (sourceType === "itinerary") {
    return t("budgetWidget.source.itinerary");
  }

  return t("budgetWidget.source.booking");
}

function orderTravelers(travelers: Traveler[]) {
  return travelers.slice().sort((a, b) => a.displayOrder - b.displayOrder);
}
