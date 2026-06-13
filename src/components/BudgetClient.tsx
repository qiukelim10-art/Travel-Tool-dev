"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { formatMoney, summarizeExpenseLedger } from "@/lib/budget";
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

function emptyForm(travelers: Traveler[]): ExpenseFormState {
  const orderedTravelers = orderTravelers(travelers);

  return {
    title: "",
    amount: "",
    currency: "EUR",
    category: "Food",
    expenseDate: todayLocalDate(),
    paidByTravelerId: orderedTravelers[0]?.id ?? "person_a",
    splitTravelerIds: orderedTravelers.map((traveler) => traveler.id),
    settled: false,
    notes: ""
  };
}

export function BudgetClient() {
  const [expenses, setExpenses] = useState<SharedExpense[]>([]);
  const [travelers, setTravelers] = useState<Traveler[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ExpenseFormState>(() => emptyForm([]));
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [currencyFilter, setCurrencyFilter] = useState<CurrencyFilter>("All");
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("All");
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>("All");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("All");

  const orderedTravelers = useMemo(() => orderTravelers(travelers), [travelers]);
  const travelerIds = useMemo(() => orderedTravelers.map((traveler) => traveler.id), [orderedTravelers]);
  const travelerNameById = useMemo(
    () => new Map(orderedTravelers.map((traveler) => [traveler.id, traveler.name])),
    [orderedTravelers]
  );
  const summaries = useMemo(
    () => summarizeExpenseLedger(expenses, travelerIds),
    [expenses, travelerIds]
  );
  const visibleCurrencies = useMemo(
    () => Array.from(new Set(expenses.map((expense) => expense.currency))).sort(),
    [expenses]
  );
  const visibleCategories = useMemo(
    () => Array.from(new Set(expenses.map((expense) => expense.category))).sort(),
    [expenses]
  );
  const filteredExpenses = useMemo(
    () =>
      expenses.filter((expense) => {
        const currencyMatches = currencyFilter === "All" || expense.currency === currencyFilter;
        const categoryMatches = categoryFilter === "All" || expense.category === categoryFilter;
        const sourceMatches = sourceFilter === "All" || expense.sourceType === sourceFilter;
        const statusMatches =
          statusFilter === "All" ||
          (statusFilter === "Settled" && expense.settled) ||
          (statusFilter === "Outstanding" && !expense.settled);
        return currencyMatches && categoryMatches && sourceMatches && statusMatches;
      }),
    [categoryFilter, currencyFilter, expenses, sourceFilter, statusFilter]
  );

  async function loadExpenses() {
    setLoading(true);
    setError(null);
    setNotice(null);

    try {
      const data = await fetchExpensesJson("/api/expenses", undefined, "Unable to load expenses.");
      setExpenses(data.expenses);
      setTravelers(data.travelers);
      setForm((current) => ensureFormTravelers(current, data.travelers));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load expenses.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadExpenses();
  }, []);

  function resetForm(nextTravelers = travelers) {
    setEditingId(null);
    setForm(emptyForm(nextTravelers));
    setFormOpen(false);
  }

  function openAddForm() {
    setEditingId(null);
    setForm(emptyForm(travelers));
    setFormOpen(true);
    setNotice(null);
    setError(null);
  }

  function startEditing(expense: SharedExpense) {
    if (expense.sourceType !== "misc") {
      setNotice("Linked expenses are edited from the Itinerary or Bookings page.");
      return;
    }

    setEditingId(expense.id);
    setForm({
      title: expense.title,
      amount: String(expense.amount),
      currency: expense.currency,
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

    const input = buildExpenseInput(form);
    if (!input.title) {
      setError("Title is required.");
      return;
    }

    if (!Number.isFinite(input.amount) || input.amount <= 0) {
      setError("Amount must be greater than zero.");
      return;
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(input.expenseDate)) {
      setError("Date is required.");
      return;
    }

    if (!input.paidByTravelerId) {
      setError("Paid by is required.");
      return;
    }

    if (input.splitTravelerIds.length === 0) {
      setError("Select at least one traveler to split this expense.");
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
        editingId ? "Unable to update expense." : "Unable to create expense."
      );
      setExpenses(data.expenses);
      setTravelers(data.travelers);
      setNotice(editingId ? "Updated expense." : "Added miscellaneous expense.");
      resetForm(data.travelers);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to save expense.");
    } finally {
      setSubmitting(false);
    }
  }

  async function removeExpense(expense: SharedExpense) {
    if (expense.sourceType !== "misc") {
      setNotice("Linked expenses are deleted from the Itinerary or Bookings page.");
      return;
    }

    if (!window.confirm(`Delete "${expense.title}" from miscellaneous expenses?`)) {
      return;
    }

    setDeletingId(expense.id);
    setError(null);
    setNotice(null);

    try {
      const data = await fetchExpensesJson(
        `/api/expenses/${expense.id}`,
        { method: "DELETE" },
        "Unable to delete expense."
      );
      setExpenses(data.expenses);
      setTravelers(data.travelers);
      setNotice("Deleted expense.");
      if (editingId === expense.id) {
        resetForm(data.travelers);
      }
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Unable to delete expense.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="w-full max-w-full min-w-0 overflow-x-hidden space-y-5">
      <div className="flex flex-col gap-3 rounded-lg border border-zinc-200 bg-white p-3 shadow-soft sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-terracotta">Unified ledger</p>
          <p className="mt-1 text-sm text-zinc-600">
            Budget totals now come from shared expenses, including miscellaneous, itinerary, and booking sources.
          </p>
        </div>
        <button
          type="button"
          onClick={formOpen ? () => resetForm() : openAddForm}
          className="w-full max-w-full rounded-md bg-moss px-3 py-2 text-sm font-semibold text-white disabled:opacity-60 sm:w-auto"
          disabled={loading}
        >
          {formOpen ? "Close form" : "Add misc expense"}
        </button>
      </div>

      {error ? (
        <div className="flex flex-col gap-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 sm:flex-row sm:items-center sm:justify-between">
          <p>{error}</p>
          <button
            type="button"
            onClick={() => void loadExpenses()}
            disabled={loading}
            className="rounded-md border border-red-200 bg-white px-3 py-2 text-sm font-semibold text-red-700 disabled:opacity-60"
          >
            {loading ? "Retrying..." : "Retry"}
          </button>
        </div>
      ) : null}

      {notice ? (
        <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          {notice}
        </p>
      ) : null}

      {loading ? <p className="text-sm text-zinc-600">Loading budget ledger...</p> : null}

      {!loading && expenses.length === 0 ? (
        <p className="rounded-lg border border-zinc-200 bg-white px-4 py-8 text-sm text-zinc-600 shadow-soft">
          No expenses have been added yet. Add a miscellaneous expense to start the shared ledger.
        </p>
      ) : null}

      {!loading && expenses.length > 0 ? (
        <>
          <SummarySection summaries={summaries} travelers={orderedTravelers} />
          <SettlementSection summaries={summaries} travelerNameById={travelerNameById} />
        </>
      ) : null}

      {formOpen ? (
        <ExpenseForm
          form={form}
          travelers={orderedTravelers}
          editingId={editingId}
          submitting={submitting}
          onSubmit={submitExpense}
          onCancel={() => resetForm()}
          onChange={setForm}
        />
      ) : null}

      <FilterSection
        filtersOpen={filtersOpen}
        currencyFilter={currencyFilter}
        categoryFilter={categoryFilter}
        sourceFilter={sourceFilter}
        statusFilter={statusFilter}
        currencies={visibleCurrencies}
        categories={visibleCategories}
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
        onEdit={startEditing}
        onDelete={removeExpense}
      />
    </div>
  );
}

function SummarySection({
  summaries,
  travelers
}: {
  summaries: ReturnType<typeof summarizeExpenseLedger>;
  travelers: Traveler[];
}) {
  if (summaries.length === 0) {
    return null;
  }

  return (
    <section className="grid gap-4 lg:grid-cols-2">
      {summaries.map((summary) => (
        <article key={summary.currency} className="rounded-lg border border-zinc-200 bg-white p-4 shadow-soft">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-terracotta">
            {summary.currency} summary
          </p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <Metric label="Total spent" value={formatMoney(summary.totalSpent, summary.currency)} />
            <Metric label="Outstanding" value={formatMoney(summary.outstandingTotal, summary.currency)} />
            <Metric label="Settled" value={formatMoney(summary.settledTotal, summary.currency)} />
            <Metric
              label="Average outstanding/person"
              value={formatMoney(summary.outstandingTotal / Math.max(travelers.length, 1), summary.currency)}
            />
          </div>
          <div className="mt-4 rounded-lg bg-zinc-50 p-3">
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-zinc-500">
              Outstanding share by traveler
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
  travelerNameById
}: {
  summaries: ReturnType<typeof summarizeExpenseLedger>;
  travelerNameById: Map<string, string>;
}) {
  return (
    <section className="rounded-lg border border-zinc-200 bg-white p-4 shadow-soft">
      <h2 className="text-lg font-semibold text-ink">Settlement suggestions</h2>
      <div className="mt-3 grid gap-3 lg:grid-cols-2">
        {summaries.map((summary) => (
          <article key={summary.currency} className="rounded-lg bg-zinc-50 p-3">
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
                    pays{" "}
                    <span className="font-semibold text-ink">
                      {travelerNameById.get(settlement.toTravelerId) ?? settlement.toTravelerId}
                    </span>{" "}
                    {formatMoney(settlement.amount, settlement.currency)}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-zinc-600">All settled for this currency.</p>
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
  onSubmit,
  onCancel,
  onChange
}: {
  form: ExpenseFormState;
  travelers: Traveler[];
  editingId: string | null;
  submitting: boolean;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onCancel: () => void;
  onChange: (updater: (current: ExpenseFormState) => ExpenseFormState) => void;
}) {
  return (
    <form
      onSubmit={onSubmit}
      className="mobile-safe-form box-border w-full max-w-full min-w-0 overflow-hidden rounded-lg border border-zinc-200 bg-white p-4 shadow-soft"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-terracotta">
            {editingId ? "Edit misc expense" : "Add misc expense"}
          </p>
          <h2 className="mt-1 text-xl font-semibold text-ink">
            {editingId ? "Update a miscellaneous ledger item" : "Create a miscellaneous ledger item"}
          </h2>
        </div>
        {editingId ? (
          <button
            type="button"
            onClick={onCancel}
            className="max-w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold text-ink"
          >
            Cancel edit
          </button>
        ) : null}
      </div>

      <div className="mt-4 grid min-w-0 grid-cols-1 gap-3 md:grid-cols-2">
        <TextField
          label="Title"
          value={form.title}
          onChange={(value) => onChange((current) => ({ ...current, title: value }))}
          placeholder="Lunch near station"
        />
        <TextField
          label="Amount"
          type="number"
          value={form.amount}
          onChange={(value) => onChange((current) => ({ ...current, amount: value }))}
          placeholder="0"
        />
        <SelectField
          label="Currency"
          value={form.currency}
          options={bookingCurrencies}
          onChange={(value) => onChange((current) => ({ ...current, currency: value as SharedCurrency }))}
        />
        <SelectField
          label="Category"
          value={form.category}
          options={expenseCategories}
          onChange={(value) => onChange((current) => ({ ...current, category: value as ExpenseCategory }))}
        />
        <TextField
          label="Date"
          type="date"
          value={form.expenseDate}
          onChange={(value) => onChange((current) => ({ ...current, expenseDate: value }))}
        />
        <SelectField
          label="Paid by"
          value={form.paidByTravelerId}
          options={travelers.map((traveler) => traveler.id)}
          optionLabels={new Map(travelers.map((traveler) => [traveler.id, traveler.name]))}
          onChange={(value) => onChange((current) => ({ ...current, paidByTravelerId: value }))}
        />
      </div>

      <fieldset className="mt-3 min-w-0 rounded-lg border border-zinc-200 p-3">
        <legend className="px-1 text-sm font-semibold text-ink">Split among</legend>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          {travelers.map((traveler) => (
            <label key={traveler.id} className="flex min-w-0 items-center gap-2 text-sm text-zinc-700">
              <input
                type="checkbox"
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
          checked={form.settled}
          onChange={(event) => onChange((current) => ({ ...current, settled: event.target.checked }))}
          className="h-4 w-4 shrink-0 rounded border-zinc-300"
        />
        <span>Settled</span>
      </label>

      <label className="mt-3 block w-full max-w-full min-w-0 text-sm font-semibold text-ink">
        Notes
        <textarea
          value={form.notes}
          onChange={(event) => onChange((current) => ({ ...current, notes: event.target.value }))}
          className="mt-2 block box-border min-h-24 w-full max-w-full min-w-0 resize-y rounded-md border border-zinc-200 bg-white px-3 py-2 text-base text-zinc-700 sm:text-sm"
          placeholder="Safe notes only. Avoid private confirmation numbers."
        />
      </label>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <button
          type="submit"
          disabled={submitting}
          className="w-full max-w-full rounded-md bg-moss px-3 py-2 text-base font-semibold text-white disabled:opacity-60 sm:w-auto sm:text-sm"
        >
          {submitting ? "Saving..." : editingId ? "Save changes" : "Add expense"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={submitting}
          className="w-full max-w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-base font-semibold text-ink disabled:opacity-60 sm:w-auto sm:text-sm"
        >
          Cancel
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
  onToggleFilters: () => void;
  onCurrencyChange: (value: CurrencyFilter) => void;
  onCategoryChange: (value: CategoryFilter) => void;
  onSourceChange: (value: SourceFilter) => void;
  onStatusChange: (value: StatusFilter) => void;
}) {
  return (
    <section className="rounded-lg border border-zinc-200 bg-white p-3 shadow-soft">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-terracotta">Filters</p>
          <p className="mt-1 text-sm text-zinc-600">
            {currencyFilter} / {categoryFilter} / {sourceFilter} / {statusFilter}
          </p>
        </div>
        <button
          type="button"
          onClick={onToggleFilters}
          className="w-full max-w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold text-ink sm:w-auto"
        >
          {filtersOpen ? "Hide filters" : "Filters"}
        </button>
      </div>

      {filtersOpen ? (
        <>
          <p className="mt-3 text-sm text-zinc-600">
            Filters only change the expense list below. Summary and settlements stay based on the full ledger.
          </p>
          <div className="mt-3 grid min-w-0 grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
            <CompactSelect
              label="Currency"
              value={currencyFilter}
              options={["All", ...currencies]}
              onChange={(value) => onCurrencyChange(value as CurrencyFilter)}
            />
            <CompactSelect
              label="Category"
              value={categoryFilter}
              options={["All", ...categories]}
              onChange={(value) => onCategoryChange(value as CategoryFilter)}
            />
            <CompactSelect
              label="Source"
              value={sourceFilter}
              options={["All", ...expenseSourceTypes]}
              onChange={(value) => onSourceChange(value as SourceFilter)}
            />
            <CompactSelect
              label="Status"
              value={statusFilter}
              options={["All", "Outstanding", "Settled"]}
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
  onEdit,
  onDelete
}: {
  expenses: SharedExpense[];
  travelerNameById: Map<string, string>;
  deletingId: string | null;
  onEdit: (expense: SharedExpense) => void;
  onDelete: (expense: SharedExpense) => Promise<void>;
}) {
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-ink">Expenses</h2>
        <p className="text-sm text-zinc-500">{expenses.length} visible</p>
      </div>
      {expenses.length === 0 ? (
        <p className="rounded-lg border border-zinc-200 bg-white px-4 py-8 text-sm text-zinc-600 shadow-soft">
          No expenses match the selected filters.
        </p>
      ) : null}
      <div className="grid gap-3">
        {expenses.map((expense) => (
          <ExpenseCard
            key={expense.id}
            expense={expense}
            travelerNameById={travelerNameById}
            deletingId={deletingId}
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
  onEdit,
  onDelete
}: {
  expense: SharedExpense;
  travelerNameById: Map<string, string>;
  deletingId: string | null;
  onEdit: (expense: SharedExpense) => void;
  onDelete: (expense: SharedExpense) => Promise<void>;
}) {
  const [detailsOpen, setDetailsOpen] = useState(false);
  const isMisc = expense.sourceType === "misc";
  const splitAmong = expense.splitTravelerIds
    .map((travelerId) => travelerNameById.get(travelerId) ?? travelerId)
    .join(", ");

  return (
    <article className="rounded-lg border border-zinc-200 bg-white p-4 shadow-soft">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-terracotta">
              {sourceTypeLabel(expense.sourceType)}
            </p>
            <StatusPill settled={expense.settled} />
          </div>
          <h3 className="mt-1 break-words text-lg font-semibold text-ink">{expense.title}</h3>
          <p className="mt-1 text-sm text-zinc-600">
            {expense.category} - {expense.expenseDate}
          </p>
        </div>
        <p className="shrink-0 text-base font-semibold text-ink">
          {formatMoney(expense.amount, expense.currency)}
        </p>
      </div>

      {detailsOpen ? (
        <>
          <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
            <Field
              label="Paid by"
              value={travelerNameById.get(expense.paidByTravelerId) ?? expense.paidByTravelerId}
            />
            <Field label="Split among" value={splitAmong} />
          </dl>
          {expense.notes ? (
            <p className="mt-3 break-words text-sm leading-6 text-zinc-600">{expense.notes}</p>
          ) : null}
        </>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setDetailsOpen((current) => !current)}
          className="rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold text-ink"
        >
          {detailsOpen ? "Hide details" : "Details"}
        </button>
        {isMisc ? (
          <>
            <button
              type="button"
              onClick={() => onEdit(expense)}
              className="rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold text-ink"
            >
              Edit
            </button>
            <button
              type="button"
              onClick={() => void onDelete(expense)}
              disabled={deletingId === expense.id}
              className="rounded-md border border-red-200 bg-white px-3 py-2 text-sm font-semibold text-red-700 disabled:opacity-60"
            >
              {deletingId === expense.id ? "Deleting..." : "Delete"}
            </button>
          </>
        ) : (
          <p className="rounded-md bg-zinc-100 px-3 py-2 text-sm font-medium text-zinc-600">
            Edit from {sourceEditPageLabel(expense.sourceType)}.
          </p>
        )}
      </div>
    </article>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-zinc-50 p-3">
      <p className="text-xs font-semibold uppercase tracking-[0.08em] text-zinc-500">{label}</p>
      <p className="mt-1 break-words text-xl font-semibold text-ink">{value}</p>
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

function StatusPill({ settled }: { settled: boolean }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${
        settled
          ? "bg-emerald-100 text-emerald-800 ring-emerald-200"
          : "bg-amber-100 text-amber-800 ring-amber-200"
      }`}
    >
      {settled ? "Settled" : "Outstanding"}
    </span>
  );
}

function sourceTypeLabel(sourceType: ExpenseSourceType) {
  if (sourceType === "misc") {
    return "Misc";
  }

  if (sourceType === "itinerary") {
    return "Itinerary";
  }

  return "Booking";
}

function sourceEditPageLabel(sourceType: ExpenseSourceType) {
  return sourceType === "itinerary" ? "Itinerary" : "Bookings";
}

function TextField({
  label,
  value,
  onChange,
  placeholder,
  type = "text"
}: {
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
        type={type}
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
  label,
  value,
  options,
  optionLabels,
  onChange
}: {
  label: string;
  value: string;
  options: readonly string[];
  optionLabels?: Map<string, string>;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block w-full max-w-full min-w-0 text-sm font-semibold text-ink">
      {label}
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 block box-border w-full max-w-full min-w-0 rounded-md border border-zinc-200 bg-white px-3 py-2 text-base text-zinc-700 sm:text-sm"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {optionLabels?.get(option) ?? option}
          </option>
        ))}
      </select>
    </label>
  );
}

function CompactSelect({
  label,
  value,
  options,
  onChange
}: {
  label: string;
  value: string;
  options: readonly string[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="block w-full max-w-full min-w-0 text-sm font-semibold text-ink">
      {label}
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 block box-border w-full max-w-full min-w-0 rounded-md border border-zinc-200 bg-white px-3 py-2 text-base text-zinc-700 sm:text-sm"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

async function fetchExpensesJson(
  url: string,
  options: RequestInit | undefined,
  fallbackMessage: string
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
      throw new Error(`${fallbackMessage} Request timed out. Please retry.`);
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

function ensureFormTravelers(form: ExpenseFormState, travelers: Traveler[]) {
  const travelerIds = new Set(travelers.map((traveler) => traveler.id));
  const validSplitTravelerIds = form.splitTravelerIds.filter((travelerId) => travelerIds.has(travelerId));

  if (travelerIds.has(form.paidByTravelerId) && validSplitTravelerIds.length > 0) {
    return {
      ...form,
      splitTravelerIds: validSplitTravelerIds
    };
  }

  return emptyForm(travelers);
}

function orderTravelers(travelers: Traveler[]) {
  return travelers.slice().sort((a, b) => a.displayOrder - b.displayOrder);
}
