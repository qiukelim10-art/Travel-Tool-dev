"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useTripAccess } from "@/lib/access";
import { formatMoney, summarizeExpenseLedger } from "@/lib/budget";
import { activeTripCurrencies, fallbackCurrency } from "@/lib/currencyPreferences";
import { useLanguage } from "@/lib/i18n";
import { translateOption } from "@/lib/localize";
import {
  bookingCurrencies,
  expenseCategories,
  expenseSourceTypes,
  type ExpenseCategory,
  type ExpenseInput,
  type ExpenseSourceType,
  type SharedCurrency,
  type SharedExpense
} from "@/lib/sharedDataTypes";
import type { Traveler } from "@/data/tripData";

type ExpensesApiResponse = {
  expenses?: SharedExpense[];
  travelers?: Traveler[];
  error?: string;
};

type CurrencyFilter = "All" | SharedCurrency;
type CategoryFilter = "All" | ExpenseCategory;
type SourceFilter = "All" | ExpenseSourceType;
type StatusFilter = "All" | "Outstanding" | "Settled";
type TFunction = ReturnType<typeof useLanguage>["t"];

type BudgetClientProps = {
  defaultCurrencies: SharedCurrency[];
};

type ExpenseFormState = {
  title: string;
  amount: string;
  currency: SharedCurrency;
  category: ExpenseCategory;
  expenseDate: string;
  paidByTravelerId: string;
  splitTravelerIds: string[];
  settled: boolean;
  notes: string;
};

const requestTimeoutMs = 10000;

function todayLocalDate() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function emptyForm(travelers: Traveler[], currency: SharedCurrency = fallbackCurrency): ExpenseFormState {
  const orderedTravelers = orderTravelers(travelers);

  return {
    title: "",
    amount: "",
    currency,
    category: "Food",
    expenseDate: todayLocalDate(),
    paidByTravelerId: orderedTravelers[0]?.id ?? "person_a",
    splitTravelerIds: orderedTravelers.map((traveler) => traveler.id),
    settled: false,
    notes: ""
  };
}

export function BudgetClient({ defaultCurrencies }: BudgetClientProps) {
  const { language, t } = useLanguage();
  const { mode } = useTripAccess();
  const canEdit = mode === "editor";
  const currencyOptions = useMemo(() => activeTripCurrencies(defaultCurrencies), [defaultCurrencies]);
  const allowedCurrencySet = useMemo(() => new Set(currencyOptions), [currencyOptions]);
  const primaryCurrency = currencyOptions[0];
  const [expenses, setExpenses] = useState<SharedExpense[]>([]);
  const [travelers, setTravelers] = useState<Traveler[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ExpenseFormState>(() => emptyForm([], primaryCurrency));
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [currencyFilter, setCurrencyFilter] = useState<CurrencyFilter>("All");
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("All");
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>("All");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("All");

  const orderedTravelers = useMemo(() => orderTravelers(travelers), [travelers]);
  const activeTravelers = useMemo(
    () => orderedTravelers.filter((traveler) => traveler.isActive !== false),
    [orderedTravelers]
  );
  const formTravelers = useMemo(
    () => mergeFormTravelers(activeTravelers, orderedTravelers, form),
    [activeTravelers, form, orderedTravelers]
  );
  const travelerIds = useMemo(() => orderedTravelers.map((traveler) => traveler.id), [orderedTravelers]);
  const travelerNameById = useMemo(
    () => new Map(orderedTravelers.map((traveler) => [traveler.id, traveler.name])),
    [orderedTravelers]
  );
  const displayExpenses = useMemo(
    () => expenses.filter((expense) => allowedCurrencySet.has(expense.currency)),
    [allowedCurrencySet, expenses]
  );
  const summaries = useMemo(
    () => summarizeExpenseLedger(displayExpenses, travelerIds),
    [displayExpenses, travelerIds]
  );
  const visibleCurrencies = useMemo(
    () => Array.from(new Set(displayExpenses.map((expense) => expense.currency))).sort(),
    [displayExpenses]
  );
  const visibleCategories = useMemo(
    () => Array.from(new Set(displayExpenses.map((expense) => expense.category))).sort(),
    [displayExpenses]
  );
  const filteredExpenses = useMemo(
    () =>
      displayExpenses.filter((expense) => {
        const currencyMatches = currencyFilter === "All" || expense.currency === currencyFilter;
        const categoryMatches = categoryFilter === "All" || expense.category === categoryFilter;
        const sourceMatches = sourceFilter === "All" || expense.sourceType === sourceFilter;
        const statusMatches =
          statusFilter === "All" ||
          (statusFilter === "Settled" && expense.settled) ||
          (statusFilter === "Outstanding" && !expense.settled);
        return currencyMatches && categoryMatches && sourceMatches && statusMatches;
      }),
    [categoryFilter, currencyFilter, displayExpenses, sourceFilter, statusFilter]
  );

  async function loadExpenses() {
    setLoading(true);
    setError(null);
    setNotice(null);

    try {
      const data = await fetchExpensesJson("/api/expenses", undefined, t("budget.errorLoad"), t("budget.errorTimeout"));
      setExpenses(data.expenses);
      setTravelers(data.travelers);
      setForm((current) => ensureFormTravelers(withAllowedCurrency(current, currencyOptions), data.travelers));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : t("budget.errorLoad"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadExpenses();
  }, []);

  useEffect(() => {
    setForm((current) => withAllowedCurrency(current, currencyOptions));
    if (currencyFilter !== "All" && !allowedCurrencySet.has(currencyFilter)) {
      setCurrencyFilter("All");
    }
  }, [allowedCurrencySet, currencyFilter, currencyOptions]);

  function resetForm(nextTravelers = travelers) {
    setEditingId(null);
    setForm(emptyForm(nextTravelers, primaryCurrency));
    setFormOpen(false);
  }

  function openAddForm() {
    if (!canEdit) {
      setError("Editor mode is required to add expenses.");
      return;
    }

    setEditingId(null);
    setForm(emptyForm(travelers, primaryCurrency));
    setFormOpen(true);
    setNotice(null);
    setError(null);
  }

  function startEditing(expense: SharedExpense) {
    if (!canEdit) {
      setError("Editor mode is required to edit expenses.");
      return;
    }

    if (expense.sourceType !== "misc") {
      setNotice(t("budget.noticeLinkedEdit"));
      return;
    }

    setEditingId(expense.id);
    setForm({
      title: expense.title,
      amount: String(expense.amount),
      currency: allowedCurrencySet.has(expense.currency) ? expense.currency : primaryCurrency,
      category: expense.category,
      expenseDate: expense.expenseDate,
      paidByTravelerId: expense.paidByTravelerId,
      splitTravelerIds: expense.splitTravelerIds,
      settled: expense.settled,
      notes: expense.notes ?? ""
    });
    setFormOpen(true);
    setNotice(null);
    setError(null);
  }

  async function submitExpense(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!canEdit) {
      setError("Editor mode is required to save expenses.");
      return;
    }

    const input = buildExpenseInput(form);
    if (!input.title) {
      setError(t("budget.validationTitleRequired"));
      return;
    }

    if (!Number.isFinite(input.amount) || input.amount <= 0) {
      setError(t("budget.validationAmountPositive"));
      return;
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(input.expenseDate)) {
      setError(t("budget.validationDateRequired"));
      return;
    }

    if (!input.paidByTravelerId) {
      setError(t("budget.validationPaidByRequired"));
      return;
    }

    if (input.splitTravelerIds.length === 0) {
      setError(t("budget.validationSplitRequired"));
      return;
    }

    setSubmitting(true);
    setError(null);
    setNotice(null);

    try {
      const data = await fetchExpensesJson(
        editingId ? `/api/expenses/${editingId}` : "/api/expenses",
        {
          method: editingId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(input)
        },
        editingId ? t("budget.errorUpdate") : t("budget.errorCreate"),
        t("budget.errorTimeout")
      );
      setExpenses(data.expenses);
      setTravelers(data.travelers);
      setNotice(editingId ? t("budget.noticeUpdated") : t("budget.noticeAdded"));
      resetForm(data.travelers);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : t("budget.errorSave"));
    } finally {
      setSubmitting(false);
    }
  }

  async function removeExpense(expense: SharedExpense) {
    if (!canEdit) {
      setError("Editor mode is required to delete expenses.");
      return;
    }

    if (expense.sourceType !== "misc") {
      setNotice(t("budget.noticeLinkedDelete"));
      return;
    }

    if (!window.confirm(t("budget.confirmDeleteMisc"))) {
      return;
    }

    setDeletingId(expense.id);
    setError(null);
    setNotice(null);

    try {
      const data = await fetchExpensesJson(
        `/api/expenses/${expense.id}`,
        { method: "DELETE" },
        t("budget.errorDelete"),
        t("budget.errorTimeout")
      );
      setExpenses(data.expenses);
      setTravelers(data.travelers);
      setNotice(t("budget.noticeDeleted"));
      if (editingId === expense.id) {
        resetForm(data.travelers);
      }
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : t("budget.errorDelete"));
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="w-full max-w-full min-w-0 overflow-x-hidden space-y-5">
      <div className="travel-panel flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-stamp">{t("budget.eyebrow")}</p>
          <p className="mt-1 text-sm text-zinc-600">
            {t("budget.description")}
          </p>
        </div>
        <button
          type="button"
          onClick={formOpen ? () => resetForm() : openAddForm}
          className="w-full max-w-full rounded-md bg-moss px-3 py-2 text-sm font-semibold text-white disabled:opacity-60 sm:w-auto"
          disabled={loading || !canEdit}
        >
          {formOpen ? t("budget.closeForm") : t("budget.addMiscExpense")}
        </button>
      </div>

      {error ? (
        <div
          role="alert"
          className="flex flex-col gap-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 sm:flex-row sm:items-center sm:justify-between"
        >
          <p>{error}</p>
          <button
            type="button"
            onClick={() => void loadExpenses()}
            disabled={loading}
            className="rounded-md border border-red-200 bg-white px-3 py-2 text-sm font-semibold text-red-700 disabled:opacity-60"
          >
            {loading ? t("budget.retrying") : t("common.retry")}
          </button>
        </div>
      ) : null}

      {notice ? (
        <p
          role="status"
          aria-live="polite"
          className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800"
        >
          {notice}
        </p>
      ) : null}

      {loading ? (
        <p role="status" aria-live="polite" className="text-sm text-zinc-600">
          {t("budget.loadingLedger")}
        </p>
      ) : null}

      {formOpen ? (
        <ExpenseForm
          form={form}
          travelers={formTravelers}
          editingId={editingId}
          submitting={submitting}
          currencies={currencyOptions}
          onSubmit={submitExpense}
          onCancel={() => resetForm()}
          onChange={setForm}
          language={language}
          t={t}
        />
      ) : null}

      {!loading && displayExpenses.length === 0 ? (
        <p className="rounded-lg border border-zinc-200 bg-white px-4 py-8 text-sm text-zinc-600 shadow-soft">
          {t("budget.emptyLedger")}
        </p>
      ) : null}

      {!loading && displayExpenses.length > 0 ? (
        <>
          <SummarySection summaries={summaries} travelers={orderedTravelers} t={t} />
          <SettlementSection summaries={summaries} travelerNameById={travelerNameById} t={t} />
        </>
      ) : null}

      <FilterSection
        filtersOpen={filtersOpen}
        currencyFilter={currencyFilter}
        categoryFilter={categoryFilter}
        sourceFilter={sourceFilter}
        statusFilter={statusFilter}
        currencies={visibleCurrencies}
        categories={visibleCategories}
        language={language}
        t={t}
        onToggleFilters={() => setFiltersOpen((current) => !current)}
        onCurrencyChange={setCurrencyFilter}
        onCategoryChange={setCategoryFilter}
        onSourceChange={setSourceFilter}
        onStatusChange={setStatusFilter}
      />

      <ExpenseList
        expenses={filteredExpenses}
        travelerNameById={travelerNameById}
        deletingId={deletingId}
        canEdit={canEdit}
        language={language}
        t={t}
        onEdit={startEditing}
        onDelete={removeExpense}
      />
    </div>
  );
}

function SummarySection({
  summaries,
  travelers,
  t
}: {
  summaries: ReturnType<typeof summarizeExpenseLedger>;
  travelers: Traveler[];
  t: TFunction;
}) {
  if (summaries.length === 0) {
    return null;
  }

  return (
    <section className="grid gap-3 lg:grid-cols-2">
      {summaries.map((summary) => (
        <article key={summary.currency} className="ledger-row p-3">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-stamp">
              {t("budget.summary.currencySummary", { currency: summary.currency })}
            </p>
            <span className="rounded-full bg-moss/10 px-2.5 py-1 text-xs font-semibold text-moss">
              {summary.currency}
            </span>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <Metric label={t("budget.summary.totalSpent")} value={formatMoney(summary.totalSpent, summary.currency)} />
            <Metric label={t("budget.summary.outstanding")} value={formatMoney(summary.outstandingTotal, summary.currency)} />
            <Metric label={t("budget.summary.settled")} value={formatMoney(summary.settledTotal, summary.currency)} />
            <Metric
              label={t("budget.summary.averageOutstanding")}
              value={formatMoney(summary.outstandingTotal / Math.max(travelers.length, 1), summary.currency)}
            />
          </div>
          <div className="mt-3 rounded-lg bg-sandlight p-3">
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-zinc-500">
              {t("budget.summary.outstandingByTraveler")}
            </p>
            <dl className="mt-2 grid gap-2 text-sm text-zinc-700 sm:grid-cols-2">
              {travelers.map((traveler) => (
                <div key={traveler.id} className="flex min-w-0 justify-between gap-3">
                  <dt className="min-w-0 truncate">{traveler.name}</dt>
                  <dd className="shrink-0 font-medium text-ink">
                    {formatMoney(summary.outstandingShareByTraveler[traveler.id] ?? 0, summary.currency)}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </article>
      ))}
    </section>
  );
}

function SettlementSection({
  summaries,
  travelerNameById,
  t
}: {
  summaries: ReturnType<typeof summarizeExpenseLedger>;
  travelerNameById: Map<string, string>;
  t: TFunction;
}) {
  return (
    <section className="status-strip p-4 shadow-soft">
      <h2 className="text-lg font-semibold text-ink">{t("budget.settlements.title")}</h2>
      <div className="mt-3 grid gap-3 lg:grid-cols-2">
        {summaries.map((summary) => (
          <article key={summary.currency} className="rounded-lg bg-white/75 p-3">
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-zinc-500">
              {summary.currency}
            </p>
            {summary.settlements.length > 0 ? (
              <ul className="mt-2 space-y-2">
                {summary.settlements.map((settlement) => (
                  <li
                    key={`${summary.currency}-${settlement.fromTravelerId}-${settlement.toTravelerId}-${settlement.amount}`}
                    className="text-sm leading-6 text-zinc-700"
                  >
                    <span className="font-semibold text-ink">
                      {travelerNameById.get(settlement.fromTravelerId) ?? settlement.fromTravelerId}
                    </span>{" "}
                    {t("budget.settlements.pays")}{" "}
                    <span className="font-semibold text-ink">
                      {travelerNameById.get(settlement.toTravelerId) ?? settlement.toTravelerId}
                    </span>{" "}
                    {formatMoney(settlement.amount, settlement.currency)}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-zinc-600">{t("budget.settlements.allSettled")}</p>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}

function ExpenseForm({
  form,
  travelers,
  editingId,
  submitting,
  currencies,
  onSubmit,
  onCancel,
  onChange,
  language,
  t
}: {
  form: ExpenseFormState;
  travelers: Traveler[];
  editingId: string | null;
  submitting: boolean;
  currencies: readonly SharedCurrency[];
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onCancel: () => void;
  onChange: (updater: (current: ExpenseFormState) => ExpenseFormState) => void;
  language: ReturnType<typeof useLanguage>["language"];
  t: TFunction;
}) {
  return (
    <form
      onSubmit={onSubmit}
      className="mobile-safe-form box-border w-full max-w-full min-w-0 overflow-hidden rounded-lg border border-zinc-200 bg-white p-4 shadow-soft"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-terracotta">
            {editingId ? t("budget.form.editEyebrow") : t("budget.form.addEyebrow")}
          </p>
          <h2 className="mt-1 text-xl font-semibold text-ink">
            {editingId ? t("budget.form.editTitle") : t("budget.form.addTitle")}
          </h2>
        </div>
        {editingId ? (
          <button
            type="button"
            onClick={onCancel}
            className="max-w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold text-ink"
          >
            {t("budget.form.cancelEdit")}
          </button>
        ) : null}
      </div>

      <div className="mt-4 grid min-w-0 grid-cols-1 gap-3 md:grid-cols-2">
        <TextField
          name="expense-title"
          label={t("budget.form.title")}
          value={form.title}
          onChange={(value) => onChange((current) => ({ ...current, title: value }))}
          placeholder={t("budget.form.titlePlaceholder")}
        />
        <TextField
          name="expense-amount"
          label={t("budget.form.amount")}
          type="number"
          value={form.amount}
          onChange={(value) => onChange((current) => ({ ...current, amount: value }))}
          placeholder="0"
        />
        <SelectField
          name="expense-currency"
          label={t("budget.form.currency")}
          value={form.currency}
          options={currencies}
          onChange={(value) => onChange((current) => ({ ...current, currency: value as SharedCurrency }))}
        />
        <SelectField
          name="expense-category"
          label={t("budget.form.category")}
          value={form.category}
          options={expenseCategories}
          formatOption={(option) => translateOption(language, option)}
          onChange={(value) => onChange((current) => ({ ...current, category: value as ExpenseCategory }))}
        />
        <TextField
          name="expense-date"
          label={t("budget.form.date")}
          type="date"
          value={form.expenseDate}
          onChange={(value) => onChange((current) => ({ ...current, expenseDate: value }))}
        />
        <SelectField
          name="expense-paid-by"
          label={t("budget.form.paidBy")}
          value={form.paidByTravelerId}
          options={travelers.map((traveler) => traveler.id)}
          optionLabels={new Map(travelers.map((traveler) => [traveler.id, traveler.name]))}
          onChange={(value) => onChange((current) => ({ ...current, paidByTravelerId: value }))}
        />
      </div>

      <fieldset className="mt-3 min-w-0 rounded-lg border border-zinc-200 p-3">
        <legend className="px-1 text-sm font-semibold text-ink">{t("budget.form.splitAmong")}</legend>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          {travelers.map((traveler) => (
            <label key={traveler.id} className="flex min-w-0 items-center gap-2 text-sm text-zinc-700">
              <input
                type="checkbox"
                name="expense-split-traveler"
                checked={form.splitTravelerIds.includes(traveler.id)}
                onChange={(event) =>
                  onChange((current) => ({
                    ...current,
                    splitTravelerIds: event.target.checked
                      ? [...current.splitTravelerIds, traveler.id]
                      : current.splitTravelerIds.filter((travelerId) => travelerId !== traveler.id)
                  }))
                }
                className="h-4 w-4 shrink-0 rounded border-zinc-300"
              />
              <span className="min-w-0 truncate">{traveler.name}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <label className="mt-3 flex min-w-0 items-center gap-2 text-sm font-semibold text-ink">
        <input
          type="checkbox"
          name="expense-settled"
          checked={form.settled}
          onChange={(event) => onChange((current) => ({ ...current, settled: event.target.checked }))}
          className="h-4 w-4 shrink-0 rounded border-zinc-300"
        />
        <span>{t("budget.form.settled")}</span>
      </label>

      <label className="mt-3 block w-full max-w-full min-w-0 text-sm font-semibold text-ink">
        {t("budget.form.notes")}
        <textarea
          name="expense-notes"
          autoComplete="off"
          value={form.notes}
          onChange={(event) => onChange((current) => ({ ...current, notes: event.target.value }))}
          className="mt-2 block box-border min-h-24 w-full max-w-full min-w-0 resize-y rounded-md border border-zinc-200 bg-white px-3 py-2 text-base text-zinc-700 sm:text-sm"
          placeholder={t("budget.form.notesPlaceholder")}
        />
      </label>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <button
          type="submit"
          disabled={submitting}
          className="w-full max-w-full rounded-md bg-moss px-3 py-2 text-base font-semibold text-white disabled:opacity-60 sm:w-auto sm:text-sm"
        >
          {submitting ? t("budget.form.saving") : editingId ? t("budget.form.saveChanges") : t("budget.form.addExpense")}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={submitting}
          className="w-full max-w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-base font-semibold text-ink disabled:opacity-60 sm:w-auto sm:text-sm"
        >
          {t("common.cancel")}
        </button>
      </div>
    </form>
  );
}

function FilterSection({
  filtersOpen,
  currencyFilter,
  categoryFilter,
  sourceFilter,
  statusFilter,
  currencies,
  categories,
  language,
  t,
  onToggleFilters,
  onCurrencyChange,
  onCategoryChange,
  onSourceChange,
  onStatusChange
}: {
  filtersOpen: boolean;
  currencyFilter: CurrencyFilter;
  categoryFilter: CategoryFilter;
  sourceFilter: SourceFilter;
  statusFilter: StatusFilter;
  currencies: SharedCurrency[];
  categories: ExpenseCategory[];
  language: ReturnType<typeof useLanguage>["language"];
  t: TFunction;
  onToggleFilters: () => void;
  onCurrencyChange: (value: CurrencyFilter) => void;
  onCategoryChange: (value: CategoryFilter) => void;
  onSourceChange: (value: SourceFilter) => void;
  onStatusChange: (value: StatusFilter) => void;
}) {
  const filterSummary = [currencyFilter, categoryFilter, sourceFilter, statusFilter]
    .map((value) => formatFilterValue(language, value))
    .join(" / ");

  return (
    <section className="travel-panel p-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-stamp">{t("budget.filters.title")}</p>
          <p className="mt-1 text-sm text-zinc-600">{filterSummary}</p>
        </div>
        <button
          type="button"
          onClick={onToggleFilters}
          className="w-full max-w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold text-ink sm:w-auto"
        >
          {filtersOpen ? t("budget.filters.hide") : t("budget.filters.title")}
        </button>
      </div>

      {filtersOpen ? (
        <>
          <p className="mt-3 text-sm text-zinc-600">
            {t("budget.filters.note")}
          </p>
          <div className="mt-3 grid min-w-0 grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
            <CompactSelect
              name="budget-filter-currency"
              label={t("budget.filters.currency")}
              value={currencyFilter}
              options={["All", ...currencies]}
              formatOption={(option) => formatFilterValue(language, option)}
              onChange={(value) => onCurrencyChange(value as CurrencyFilter)}
            />
            <CompactSelect
              name="budget-filter-category"
              label={t("budget.filters.category")}
              value={categoryFilter}
              options={["All", ...categories]}
              formatOption={(option) => formatFilterValue(language, option)}
              onChange={(value) => onCategoryChange(value as CategoryFilter)}
            />
            <CompactSelect
              name="budget-filter-source"
              label={t("budget.filters.source")}
              value={sourceFilter}
              options={["All", ...expenseSourceTypes]}
              formatOption={(option) => formatFilterValue(language, option)}
              onChange={(value) => onSourceChange(value as SourceFilter)}
            />
            <CompactSelect
              name="budget-filter-status"
              label={t("budget.filters.status")}
              value={statusFilter}
              options={["All", "Outstanding", "Settled"]}
              formatOption={(option) => formatFilterValue(language, option)}
              onChange={(value) => onStatusChange(value as StatusFilter)}
            />
          </div>
        </>
      ) : null}
    </section>
  );
}

function ExpenseList({
  expenses,
  travelerNameById,
  deletingId,
  canEdit,
  language,
  t,
  onEdit,
  onDelete
}: {
  expenses: SharedExpense[];
  travelerNameById: Map<string, string>;
  deletingId: string | null;
  canEdit: boolean;
  language: ReturnType<typeof useLanguage>["language"];
  t: TFunction;
  onEdit: (expense: SharedExpense) => void;
  onDelete: (expense: SharedExpense) => Promise<void>;
}) {
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-ink">{t("budget.expenses.title")}</h2>
        <p className="text-sm text-zinc-500">{t("budget.expenses.visible", { count: expenses.length })}</p>
      </div>
      {expenses.length === 0 ? (
        <p className="rounded-lg border border-zinc-200 bg-white px-4 py-8 text-sm text-zinc-600 shadow-soft">
          {t("budget.expenses.emptyFiltered")}
        </p>
      ) : null}
      <div className="grid gap-3">
        {expenses.map((expense) => (
          <ExpenseCard
            key={expense.id}
            expense={expense}
            travelerNameById={travelerNameById}
            deletingId={deletingId}
            canEdit={canEdit}
            language={language}
            t={t}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
      </div>
    </section>
  );
}

function ExpenseCard({
  expense,
  travelerNameById,
  deletingId,
  canEdit,
  language,
  t,
  onEdit,
  onDelete
}: {
  expense: SharedExpense;
  travelerNameById: Map<string, string>;
  deletingId: string | null;
  canEdit: boolean;
  language: ReturnType<typeof useLanguage>["language"];
  t: TFunction;
  onEdit: (expense: SharedExpense) => void;
  onDelete: (expense: SharedExpense) => Promise<void>;
}) {
  const [detailsOpen, setDetailsOpen] = useState(false);
  const isMisc = expense.sourceType === "misc";
  const splitAmong = expense.splitTravelerIds
    .map((travelerId) => travelerNameById.get(travelerId) ?? travelerId)
    .join(", ");

  return (
    <article className="ledger-row p-3 sm:p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-stamp">
              {sourceTypeLabel(t, expense.sourceType)}
            </p>
            <StatusPill settled={expense.settled} t={t} />
          </div>
          <h3 className="mt-1 break-words text-lg font-semibold text-ink">{expense.title}</h3>
          <p className="mt-1 text-sm text-zinc-600">
            {translateOption(language, expense.category)} - {expense.expenseDate}
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2">
          <p className="text-base font-semibold text-ink">
            {formatMoney(expense.amount, expense.currency)}
          </p>
          <div className="flex flex-wrap justify-end gap-1.5">
            <button
              type="button"
              onClick={() => setDetailsOpen((current) => !current)}
              className="rounded-md border border-zinc-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-ink sm:px-3 sm:py-2 sm:text-sm"
            >
              {detailsOpen ? t("budget.expenses.hideDetails") : t("budget.expenses.details")}
            </button>
            {isMisc && canEdit ? (
              <>
                <button
                  type="button"
                  onClick={() => onEdit(expense)}
                  className="rounded-md border border-zinc-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-ink sm:px-3 sm:py-2 sm:text-sm"
                >
                  {t("common.edit")}
                </button>
                <button
                  type="button"
                  onClick={() => void onDelete(expense)}
                  disabled={deletingId === expense.id}
                  className="rounded-md border border-red-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-red-700 disabled:opacity-60 sm:px-3 sm:py-2 sm:text-sm"
                >
                  {deletingId === expense.id ? t("budget.expenses.deleting") : t("common.delete")}
                </button>
              </>
            ) : null}
          </div>
        </div>
      </div>

      {detailsOpen ? (
        <>
          <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
            <Field
              label={t("budget.form.paidBy")}
              value={travelerNameById.get(expense.paidByTravelerId) ?? expense.paidByTravelerId}
            />
            <Field label={t("budget.form.splitAmong")} value={splitAmong} />
          </dl>
          {expense.notes ? (
            <p className="mt-3 break-words text-sm leading-6 text-zinc-600">{expense.notes}</p>
          ) : null}
        </>
      ) : null}

      {!isMisc ? (
        <p className="mt-3 inline-flex rounded-md bg-zinc-100 px-3 py-2 text-sm font-medium text-zinc-600">
          {t("budget.expenses.editFrom", { source: sourceEditPageLabel(t, expense.sourceType) })}
        </p>
      ) : null}
    </article>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="compact-stat">
      <p className="text-xs font-semibold uppercase tracking-[0.08em] text-zinc-500">{label}</p>
      <p className="mt-1 break-words text-lg font-semibold text-ink sm:text-xl">{value}</p>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs font-semibold uppercase tracking-[0.08em] text-zinc-500">{label}</dt>
      <dd className="mt-1 break-words text-zinc-700">{value}</dd>
    </div>
  );
}

function StatusPill({ settled, t }: { settled: boolean; t: TFunction }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${
        settled
          ? "bg-emerald-100 text-emerald-800 ring-emerald-200"
          : "bg-amber-100 text-amber-800 ring-amber-200"
      }`}
    >
      {settled ? t("budget.summary.settled") : t("budget.summary.outstanding")}
    </span>
  );
}

function sourceTypeLabel(t: TFunction, sourceType: ExpenseSourceType) {
  if (sourceType === "misc") {
    return t("budget.source.misc");
  }

  if (sourceType === "itinerary") {
    return t("budget.source.itinerary");
  }

  return t("budget.source.booking");
}

function sourceEditPageLabel(t: TFunction, sourceType: ExpenseSourceType) {
  return sourceType === "itinerary" ? t("nav.itinerary") : t("nav.bookings");
}

function formatFilterValue(language: ReturnType<typeof useLanguage>["language"], value: string) {
  if (bookingCurrencies.includes(value as SharedCurrency)) {
    return value;
  }

  return translateOption(language, value);
}

function TextField({
  name,
  label,
  value,
  onChange,
  placeholder,
  type = "text"
}: {
  name: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: "date" | "number" | "text";
}) {
  return (
    <label className="block w-full max-w-full min-w-0 text-sm font-semibold text-ink">
      {label}
      <input
        name={name}
        type={type}
        autoComplete="off"
        inputMode={type === "number" ? "decimal" : undefined}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        min={type === "number" ? "0.01" : undefined}
        step={type === "number" ? "0.01" : undefined}
        className="mt-2 block box-border w-full max-w-full min-w-0 rounded-md border border-zinc-200 bg-white px-3 py-2 text-base text-zinc-700 sm:text-sm"
      />
    </label>
  );
}

function SelectField({
  name,
  label,
  value,
  options,
  optionLabels,
  formatOption,
  onChange
}: {
  name: string;
  label: string;
  value: string;
  options: readonly string[];
  optionLabels?: Map<string, string>;
  formatOption?: (option: string) => string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block w-full max-w-full min-w-0 text-sm font-semibold text-ink">
      {label}
      <select
        name={name}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 block box-border w-full max-w-full min-w-0 rounded-md border border-zinc-200 bg-white px-3 py-2 text-base text-zinc-700 sm:text-sm"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {optionLabels?.get(option) ?? formatOption?.(option) ?? option}
          </option>
        ))}
      </select>
    </label>
  );
}

function CompactSelect({
  name,
  label,
  value,
  options,
  formatOption,
  onChange
}: {
  name: string;
  label: string;
  value: string;
  options: readonly string[];
  formatOption?: (option: string) => string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block w-full max-w-full min-w-0 text-sm font-semibold text-ink">
      {label}
      <select
        name={name}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 block box-border w-full max-w-full min-w-0 rounded-md border border-zinc-200 bg-white px-3 py-2 text-base text-zinc-700 sm:text-sm"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {formatOption?.(option) ?? option}
          </option>
        ))}
      </select>
    </label>
  );
}

async function fetchExpensesJson(
  url: string,
  options: RequestInit | undefined,
  fallbackMessage: string,
  timeoutMessage: string
): Promise<{ expenses: SharedExpense[]; travelers: Traveler[] }> {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), requestTimeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    const data = (await response.json()) as ExpensesApiResponse;

    if (!response.ok) {
      throw new Error(data.error ?? fallbackMessage);
    }

    return validateExpensesResponse(data, fallbackMessage);
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error(`${fallbackMessage} ${timeoutMessage}`);
    }

    throw error;
  } finally {
    window.clearTimeout(timeoutId);
  }
}

function validateExpensesResponse(data: ExpensesApiResponse, fallbackMessage: string) {
  if (!Array.isArray(data.expenses) || !Array.isArray(data.travelers)) {
    throw new Error(fallbackMessage);
  }

  return {
    expenses: data.expenses.filter(isSharedExpense),
    travelers: data.travelers.filter(isTraveler)
  };
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
    typeof expense.expenseDate === "string"
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

function buildExpenseInput(form: ExpenseFormState): ExpenseInput {
  return {
    sourceType: "misc",
    sourceId: null,
    title: form.title.trim(),
    category: form.category,
    amount: Number(form.amount),
    currency: form.currency,
    paidByTravelerId: form.paidByTravelerId,
    splitTravelerIds: Array.from(new Set(form.splitTravelerIds)),
    settled: form.settled,
    expenseDate: form.expenseDate,
    notes: form.notes.trim() || null
  };
}

function withAllowedCurrency(form: ExpenseFormState, currencies: readonly SharedCurrency[]) {
  if (currencies.includes(form.currency)) {
    return form;
  }

  return { ...form, currency: currencies[0] };
}

function ensureFormTravelers(form: ExpenseFormState, travelers: Traveler[]) {
  const activeTravelers = travelers.filter((traveler) => traveler.isActive !== false);
  const activeTravelerIds = new Set(activeTravelers.map((traveler) => traveler.id));
  const travelerIds = new Set(travelers.map((traveler) => traveler.id));
  const validSplitTravelerIds = form.splitTravelerIds.filter((travelerId) => travelerIds.has(travelerId));

  if (activeTravelerIds.has(form.paidByTravelerId) && validSplitTravelerIds.length > 0) {
    return {
      ...form,
      splitTravelerIds: validSplitTravelerIds.filter((travelerId) => travelerIds.has(travelerId))
    };
  }

  return emptyForm(activeTravelers, form.currency);
}

function orderTravelers(travelers: Traveler[]) {
  return travelers.slice().sort((a, b) => a.displayOrder - b.displayOrder);
}

function mergeFormTravelers(activeTravelers: Traveler[], allTravelers: Traveler[], form: ExpenseFormState) {
  const included = new Set(activeTravelers.map((traveler) => traveler.id));
  const selectedIds = new Set([form.paidByTravelerId, ...form.splitTravelerIds]);
  const extraTravelers = allTravelers.filter(
    (traveler) => selectedIds.has(traveler.id) && !included.has(traveler.id)
  );

  return orderTravelers([...activeTravelers, ...extraTravelers]);
}
