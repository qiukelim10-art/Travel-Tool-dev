"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { TripRouteMap } from "@/components/TripRouteMap";
import { useTripAccess } from "@/lib/access";
import { formatMoney, summarizeExpenseLedger } from "@/lib/budget";
import { activeTripCurrencies, fallbackCurrency } from "@/lib/currencyPreferences";
import type { DestinationVisualIdentity } from "@/lib/destinationVisuals";
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
  destinationVisual: DestinationVisualIdentity;
  defaultCurrencies: SharedCurrency[];
  tripDateRangeLabel: string;
  tripRouteLabel: string;
  tripTravelerCount: number;
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

function formatDisplayDate(value: string, language: ReturnType<typeof useLanguage>["language"]) {
  const [year, month, day] = value.split("-").map(Number);

  if (!year || !month || !day) {
    return value;
  }

  const date = new Date(year, month - 1, day);
  return new Intl.DateTimeFormat(language === "zh" ? "zh-CN" : "en", {
    day: "numeric",
    month: "short",
    year: "numeric"
  }).format(date);
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

export function BudgetClient({
  destinationVisual,
  defaultCurrencies,
  tripDateRangeLabel,
  tripRouteLabel,
  tripTravelerCount
}: BudgetClientProps) {
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
  const currencyLabel = currencyOptions.join(" / ");

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
      setError("Private trip access is required to add expenses.");
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
      setError("Private trip access is required to edit expenses.");
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
      setError("Private trip access is required to save expenses.");
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
      setError("Private trip access is required to delete expenses.");
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
    <div className="budget-workspace">
      <section className="budget-masthead" aria-labelledby="budget-page-title">
        <div className="budget-masthead__copy">
          <div className="budget-masthead__topline">
            <p className="cockpit-eyebrow">{t("page.budget.eyebrow")}</p>
          </div>
          <h1 id="budget-page-title">{t("page.budget.title")}</h1>
          <p>{t("page.budget.description")}</p>
          <div className="budget-chip-row" aria-label={t("budget.eyebrow")}>
            <span>{tripDateRangeLabel}</span>
            <span>{tripRouteLabel}</span>
            <span>{language === "zh" ? `${tripTravelerCount} 人同行` : `${tripTravelerCount} travelers`}</span>
            <span>{currencyLabel}</span>
          </div>
        </div>
        <TripRouteMap
          compact
          cityName={destinationVisual.routeMarks[0] ?? destinationVisual.destinationLabel}
          className="trip-route-map--budget"
          countryCode={destinationVisual.countryCode}
          countryName={destinationVisual.countryName}
          destinations={destinationVisual.destinations}
          label={formatBudgetRouteMapTitle(destinationVisual)}
        />
      </section>

      {error ? (
        <div role="alert" className="budget-inline-status budget-inline-status--error">
          <p>{error}</p>
          <button
            type="button"
            onClick={() => void loadExpenses()}
            disabled={loading}
            className="budget-action-button budget-action-button--ghost"
          >
            {loading ? t("budget.retrying") : t("common.retry")}
          </button>
        </div>
      ) : null}

      {notice ? (
        <p role="status" aria-live="polite" className="budget-inline-status budget-inline-status--success">
          {notice}
        </p>
      ) : null}

      {loading ? (
        <p role="status" aria-live="polite" className="budget-loading-card">
          {t("budget.loadingLedger")}
        </p>
      ) : null}

      {!loading && displayExpenses.length > 0 ? (
        <SettlementSection
          summaries={summaries}
          travelerNameById={travelerNameById}
          t={t}
          showAddForm={formOpen && !editingId}
          loading={loading}
          onToggleAddForm={formOpen && !editingId ? () => resetForm() : openAddForm}
        />
      ) : null}

      <div className="budget-grid">
        <div className="budget-main-stack">
          {formOpen && !editingId ? (
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
	            <EmptyLedgerState canEdit={canEdit} loading={loading} onAdd={openAddForm} t={t} />
	          ) : null}

	          {!loading && displayExpenses.length > 0 ? (
	            <SummarySection summaries={summaries} travelers={orderedTravelers} t={t} />
	          ) : null}

	          {!loading && displayExpenses.length > 0 ? (
	            <>
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
	                editingId={editingId}
	                form={form}
	                formOpen={formOpen}
	                formTravelers={formTravelers}
	                submitting={submitting}
	                currencies={currencyOptions}
	                onSubmit={submitExpense}
	                onCancel={() => resetForm()}
	                onFormChange={setForm}
	                onEdit={startEditing}
	                onDelete={removeExpense}
	              />
	            </>
	          ) : null}
	        </div>
      </div>
    </div>
  );
}

function EmptyLedgerState({
  canEdit,
  loading,
  onAdd,
  t
}: {
  canEdit: boolean;
  loading: boolean;
  onAdd: () => void;
  t: TFunction;
}) {
  return (
    <section className="budget-empty-card budget-empty-card--action">
      <p>{t("budget.emptyLedger")}</p>
      <button
        type="button"
        onClick={onAdd}
        disabled={loading}
        data-edit-required={!canEdit ? "true" : undefined}
        title={!canEdit ? "Private trip access is required to add expenses." : undefined}
        className="budget-action-button budget-action-button--primary"
      >
        {t("budget.emptyCta")}
      </button>
    </section>
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
    <section className="budget-summary-grid">
      {summaries.map((summary) => (
        <article key={summary.currency} className="budget-ledger-card">
          <div className="budget-ledger-card__header">
            <p className="cockpit-eyebrow">
              {t("budget.summary.currencySummary", { currency: summary.currency })}
            </p>
            <span className="budget-currency-pill">
              {summary.currency}
            </span>
          </div>
          <div className="budget-metric-grid">
            <Metric label={t("budget.summary.totalSpent")} value={formatMoney(summary.totalSpent, summary.currency)} />
            <Metric label={t("budget.summary.outstanding")} value={formatMoney(summary.outstandingTotal, summary.currency)} />
            <Metric label={t("budget.summary.settled")} value={formatMoney(summary.settledTotal, summary.currency)} />
            <Metric
              label={t("budget.summary.averageOutstanding")}
              value={formatMoney(summary.outstandingTotal / Math.max(travelers.length, 1), summary.currency)}
            />
          </div>
          <div className="budget-traveler-ledger">
            <p className="cockpit-eyebrow">
              {t("budget.summary.outstandingByTraveler")}
            </p>
            <dl>
              {travelers.map((traveler) => (
                <div key={traveler.id}>
                  <dt>{traveler.name}</dt>
                  <dd>
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
  t,
  showAddForm,
  loading,
  onToggleAddForm
}: {
  summaries: ReturnType<typeof summarizeExpenseLedger>;
  travelerNameById: Map<string, string>;
  t: TFunction;
  showAddForm: boolean;
  loading: boolean;
  onToggleAddForm: () => void;
}) {
  return (
    <section className="budget-rail-card">
      <div className="budget-rail-card__header">
        <h2>{t("budget.settlements.title")}</h2>
        <button
          type="button"
          onClick={onToggleAddForm}
          className="budget-action-button budget-action-button--primary"
          disabled={loading}
        >
          {showAddForm ? t("budget.closeForm") : t("budget.addMiscExpense")}
        </button>
      </div>
      <div className="budget-settlement-stack">
        {summaries.map((summary) => (
          <article key={summary.currency} className="budget-settlement-currency">
            <p>
              {summary.currency}
            </p>
            {summary.settlements.length > 0 ? (
              <ul>
                {summary.settlements.map((settlement) => (
                  <li
                    key={`${summary.currency}-${settlement.fromTravelerId}-${settlement.toTravelerId}-${settlement.amount}`}
                  >
                    <span>
                      {travelerNameById.get(settlement.fromTravelerId) ?? settlement.fromTravelerId}
                    </span>{" "}
                    {t("budget.settlements.pays")}{" "}
                    <span>
                      {travelerNameById.get(settlement.toTravelerId) ?? settlement.toTravelerId}
                    </span>{" "}
                    {formatMoney(settlement.amount, settlement.currency)}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="budget-settlement-empty">{t("budget.settlements.allSettled")}</p>
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
  t,
  inline = false
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
  inline?: boolean;
}) {
  return (
    <form
      onSubmit={onSubmit}
      className={`budget-editor-card mobile-safe-form ${inline ? "budget-editor-card--inline" : ""}`}
    >
      <div className="budget-editor-card__header">
        <div>
          <p className="cockpit-eyebrow">
            {editingId ? t("budget.form.editEyebrow") : t("budget.form.addEyebrow")}
          </p>
          <h2>
            {editingId ? t("budget.form.editTitle") : t("budget.form.addTitle")}
          </h2>
        </div>
        {editingId ? (
          <button
            type="button"
            onClick={onCancel}
            className="budget-action-button budget-action-button--ghost"
          >
            {t("budget.form.cancelEdit")}
          </button>
        ) : null}
      </div>

      <div className="budget-form-grid">
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

      <fieldset className="budget-split-fieldset">
        <legend>{t("budget.form.splitAmong")}</legend>
        <div>
          {travelers.map((traveler) => (
            <label key={traveler.id}>
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
                className="budget-checkbox"
              />
              <span>{traveler.name}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <label className="budget-settled-toggle">
        <input
          type="checkbox"
          name="expense-settled"
          checked={form.settled}
          onChange={(event) => onChange((current) => ({ ...current, settled: event.target.checked }))}
          className="budget-checkbox"
        />
        <span>{t("budget.form.settled")}</span>
      </label>

      <label className="budget-field">
        {t("budget.form.notes")}
        <textarea
          name="expense-notes"
          autoComplete="off"
          value={form.notes}
          onChange={(event) => onChange((current) => ({ ...current, notes: event.target.value }))}
          className="budget-form-control budget-form-control--textarea"
          placeholder={t("budget.form.notesPlaceholder")}
        />
      </label>

      <div className="budget-form-actions">
        <button
          type="submit"
          disabled={submitting}
          className="budget-action-button budget-action-button--primary"
        >
          {submitting ? t("budget.form.saving") : editingId ? t("budget.form.saveChanges") : t("budget.form.addExpense")}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={submitting}
          className="budget-action-button budget-action-button--ghost"
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
  const filterSummary = [
    `${t("budget.filters.currency")}: ${formatFilterValue(language, currencyFilter)}`,
    `${t("budget.filters.category")}: ${formatFilterValue(language, categoryFilter)}`,
    `${t("budget.filters.source")}: ${formatFilterValue(language, sourceFilter)}`,
    `${t("budget.filters.status")}: ${formatFilterValue(language, statusFilter)}`
  ].join(" · ");

  return (
    <section className="budget-filter-card">
      <div className="budget-filter-card__header">
        <div>
          <p className="cockpit-eyebrow">{t("budget.filters.title")}</p>
          <p>{filterSummary}</p>
        </div>
        <button
          type="button"
          onClick={onToggleFilters}
          className="budget-action-button budget-action-button--ghost"
        >
          {filtersOpen ? t("budget.filters.hide") : t("budget.filters.title")}
        </button>
      </div>

      {filtersOpen ? (
        <div className="budget-filter-drawer">
          <p>
            {t("budget.filters.note")}
          </p>
          <div className="budget-filter-grid">
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
        </div>
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
  editingId,
  form,
  formOpen,
  formTravelers,
  submitting,
  currencies,
  onSubmit,
  onCancel,
  onFormChange,
  onEdit,
  onDelete
}: {
  expenses: SharedExpense[];
  travelerNameById: Map<string, string>;
  deletingId: string | null;
  canEdit: boolean;
  language: ReturnType<typeof useLanguage>["language"];
  t: TFunction;
  editingId: string | null;
  form: ExpenseFormState;
  formOpen: boolean;
  formTravelers: Traveler[];
  submitting: boolean;
  currencies: readonly SharedCurrency[];
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onCancel: () => void;
  onFormChange: (updater: (current: ExpenseFormState) => ExpenseFormState) => void;
  onEdit: (expense: SharedExpense) => void;
  onDelete: (expense: SharedExpense) => Promise<void>;
}) {
  return (
    <section className="budget-expense-list">
      <div className="budget-expense-list__header">
        <h2>{t("budget.expenses.title")}</h2>
        <p>{t("budget.expenses.visible", { count: expenses.length })}</p>
      </div>
      {expenses.length === 0 ? (
        <p className="budget-empty-card">
          {t("budget.expenses.emptyFiltered")}
        </p>
      ) : null}
      <div className="budget-expense-list__items">
        {expenses.map((expense) => (
          <ExpenseCard
            key={expense.id}
            expense={expense}
            travelerNameById={travelerNameById}
            deletingId={deletingId}
            canEdit={canEdit}
            language={language}
            t={t}
            isEditing={formOpen && editingId === expense.id}
            editForm={form}
            editFormTravelers={formTravelers}
            editSubmitting={submitting}
            currencies={currencies}
            onSubmitEdit={onSubmit}
            onCancelEdit={onCancel}
            onFormChange={onFormChange}
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
  isEditing,
  editForm,
  editFormTravelers,
  editSubmitting,
  currencies,
  onSubmitEdit,
  onCancelEdit,
  onFormChange,
  onEdit,
  onDelete
}: {
  expense: SharedExpense;
  travelerNameById: Map<string, string>;
  deletingId: string | null;
  canEdit: boolean;
  language: ReturnType<typeof useLanguage>["language"];
  t: TFunction;
  isEditing: boolean;
  editForm: ExpenseFormState;
  editFormTravelers: Traveler[];
  editSubmitting: boolean;
  currencies: readonly SharedCurrency[];
  onSubmitEdit: (event: FormEvent<HTMLFormElement>) => void;
  onCancelEdit: () => void;
  onFormChange: (updater: (current: ExpenseFormState) => ExpenseFormState) => void;
  onEdit: (expense: SharedExpense) => void;
  onDelete: (expense: SharedExpense) => Promise<void>;
}) {
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [actionsOpen, setActionsOpen] = useState(false);
  const isMisc = expense.sourceType === "misc";
  const splitAmong = expense.splitTravelerIds
    .map((travelerId) => travelerNameById.get(travelerId) ?? travelerId)
    .join(", ");

  return (
    <article className="budget-expense-card">
      <div className="budget-expense-card__header">
        <div className="budget-expense-card__title">
          <div className="budget-expense-card__meta">
            <p className="cockpit-eyebrow">
              {sourceTypeLabel(t, expense.sourceType)}
            </p>
            <StatusPill settled={expense.settled} t={t} />
          </div>
          <h3>{expense.title}</h3>
          <p>
            {translateOption(language, expense.category)} - {formatDisplayDate(expense.expenseDate, language)}
          </p>
        </div>
        <div className="budget-expense-card__side">
          <p>
            {formatMoney(expense.amount, expense.currency)}
          </p>
          <div>
            <button
              type="button"
              onClick={() => setDetailsOpen((current) => !current)}
              className="budget-action-button budget-action-button--mini"
            >
              {detailsOpen ? t("budget.expenses.hideDetails") : t("budget.expenses.details")}
            </button>
	            {isMisc && canEdit ? (
	              <>
	                <button
	                  type="button"
	                  onClick={() => setActionsOpen((current) => !current)}
	                  aria-expanded={actionsOpen}
	                  aria-label={t("common.moreActions")}
	                  className="budget-action-button budget-action-button--mini"
	                >
	                  {t("common.manage")}
	                </button>
	                {actionsOpen ? (
	                  <div className="budget-expense-actions__menu">
	                    <button
	                      type="button"
	                      onClick={() => onEdit(expense)}
	                      className="budget-action-button budget-action-button--mini"
	                    >
	                      {t("common.edit")}
	                    </button>
	                    <button
	                      type="button"
	                      onClick={() => void onDelete(expense)}
	                      disabled={deletingId === expense.id}
	                      className="budget-action-button budget-action-button--mini budget-action-button--danger"
	                    >
	                      {deletingId === expense.id ? t("budget.expenses.deleting") : t("common.delete")}
	                    </button>
	                  </div>
	                ) : null}
	              </>
	            ) : null}
          </div>
        </div>
      </div>

      {detailsOpen ? (
        <>
          <dl className="budget-expense-details">
            <Field
              label={t("budget.form.paidBy")}
              value={travelerNameById.get(expense.paidByTravelerId) ?? expense.paidByTravelerId}
            />
            <Field label={t("budget.form.splitAmong")} value={splitAmong} />
          </dl>
          {expense.notes ? (
            <p className="budget-expense-notes">{expense.notes}</p>
          ) : null}
        </>
      ) : null}

      {!isMisc ? (
        <p className="budget-linked-note">
          {t("budget.expenses.editFrom", { source: sourceEditPageLabel(t, expense.sourceType) })}
        </p>
      ) : null}

      {isEditing ? (
        <div className="budget-expense-card__edit-form">
          <ExpenseForm
            form={editForm}
            travelers={editFormTravelers}
            editingId={expense.id}
            submitting={editSubmitting}
            currencies={currencies}
            onSubmit={onSubmitEdit}
            onCancel={onCancelEdit}
            onChange={onFormChange}
            language={language}
            t={t}
            inline
          />
        </div>
      ) : null}
    </article>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="budget-metric">
      <p>{label}</p>
      <strong>{value}</strong>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="budget-field-readout">
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

function StatusPill({ settled, t }: { settled: boolean; t: TFunction }) {
  return (
    <span
      className={`budget-status-pill ${
        settled
          ? "budget-status-pill--settled"
          : "budget-status-pill--outstanding"
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

function formatBudgetRouteMapTitle(visual: DestinationVisualIdentity) {
  if (visual.countryNames.length > 1) {
    return "Multi-country route map";
  }

  if (visual.countryCode === "GB") {
    return "UK route map";
  }

  if (visual.countryCode === "KR") {
    return "Korea route map";
  }

  if (visual.countryCode === "GENERIC") {
    return `${visual.destinationLabel} route map`;
  }

  return `${visual.countryName.split(/\s+/)[0] || visual.destinationLabel} route map`;
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
    <label className="budget-field">
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
        className="budget-form-control"
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
    <label className="budget-field">
      {label}
      <select
        name={name}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="budget-form-control"
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
    <label className="budget-field budget-field--compact">
      {label}
      <select
        name={name}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="budget-form-control"
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
