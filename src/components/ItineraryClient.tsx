"use client";

import { useEffect, useMemo, useState, type FormEvent, type KeyboardEvent, type ReactNode } from "react";
import { useTripAccess } from "@/lib/access";
import { formatMoney } from "@/lib/budget";
import { activeTripCurrencies, fallbackCurrency } from "@/lib/currencyPreferences";
import { useLanguage } from "@/lib/i18n";
import { translateOption } from "@/lib/localize";
import {
  expenseCategories,
  type ExpenseCategory,
  type ExpenseInput,
  type ItineraryInput,
  type SharedCurrency,
  type SharedExpense,
  type SharedItineraryItem
} from "@/lib/sharedDataTypes";
import type { Traveler } from "@/data/tripData";

const requestTimeoutMs = 10000;

function handleMenuKeyboard(event: KeyboardEvent<HTMLDivElement>) {
  const buttons = Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>("button:not(:disabled)"));
  if (buttons.length === 0) {
    return;
  }

  const currentIndex = buttons.findIndex((button) => button === document.activeElement);
  let nextIndex: number | null = null;

  if (event.key === "ArrowDown") {
    nextIndex = currentIndex >= 0 ? (currentIndex + 1) % buttons.length : 0;
  } else if (event.key === "ArrowUp") {
    nextIndex = currentIndex >= 0 ? (currentIndex - 1 + buttons.length) % buttons.length : buttons.length - 1;
  } else if (event.key === "Home") {
    nextIndex = 0;
  } else if (event.key === "End") {
    nextIndex = buttons.length - 1;
  }

  if (nextIndex !== null) {
    event.preventDefault();
    buttons[nextIndex]?.focus();
  }
}

type CityFilter = "All" | string;
type DateFilter = "All";
type ItineraryApiResponse = {
  itineraryItems?: SharedItineraryItem[];
  error?: string;
};
type ExpensesApiResponse = {
  expenses?: SharedExpense[];
  travelers?: Traveler[];
  error?: string;
};
type ItineraryClientProps = {
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

const emptyForm = (currency: SharedCurrency = fallbackCurrency): ItineraryInput => ({
  travelDate: "",
  city: "Rome",
  startTime: "",
  endTime: "",
  title: "",
  location: "",
  details: "",
  transport: "",
  meal: "",
  costAmount: null,
  currency,
  notes: "",
  mapQuery: "",
  sortOrder: 0
});

function emptyExpenseForm(
  item: SharedItineraryItem,
  travelers: Traveler[],
  currency: SharedCurrency = fallbackCurrency
): ExpenseFormState {
  const orderedTravelers = orderTravelers(travelers);

  return {
    title: item.title,
    amount: "",
    currency,
    category: "Other",
    expenseDate: item.travelDate,
    paidByTravelerId: orderedTravelers[0]?.id ?? "person_a",
    splitTravelerIds: orderedTravelers.map((traveler) => traveler.id),
    settled: false,
    notes: ""
  };
}

export function ItineraryClient({ defaultCurrencies }: ItineraryClientProps) {
  const { language, t } = useLanguage();
  const { mode } = useTripAccess();
  const canEdit = mode === "editor";
  const currencyOptions = useMemo(() => activeTripCurrencies(defaultCurrencies), [defaultCurrencies]);
  const allowedCurrencySet = useMemo(() => new Set(currencyOptions), [currencyOptions]);
  const primaryCurrency = currencyOptions[0];
  const [items, setItems] = useState<SharedItineraryItem[]>([]);
  const [expenses, setExpenses] = useState<SharedExpense[]>([]);
  const [travelers, setTravelers] = useState<Traveler[]>([]);
  const [selectedCity, setSelectedCity] = useState<CityFilter>("All");
  const [selectedDate, setSelectedDate] = useState<DateFilter | string>("All");
  const [form, setForm] = useState<ItineraryInput>(() => emptyForm(primaryCurrency));
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [expenseFormItemId, setExpenseFormItemId] = useState<string | null>(null);
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);
  const [expenseForm, setExpenseForm] = useState<ExpenseFormState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [expenseSubmitting, setExpenseSubmitting] = useState(false);
  const [deletingExpenseId, setDeletingExpenseId] = useState<string | null>(null);

  const dateOptions = useMemo(
    () => Array.from(new Set(items.map((item) => item.travelDate))).sort(),
    [items]
  );
  const cityFilters = useMemo(
    () => ["All", ...Array.from(new Set(items.map((item) => item.city).filter(Boolean))).sort()],
    [items]
  );

  const visibleItems = useMemo(
    () =>
      items.filter((item) => {
        const cityMatches = selectedCity === "All" || item.city === selectedCity;
        const dateMatches = selectedDate === "All" || item.travelDate === selectedDate;
        return cityMatches && dateMatches;
      }),
    [items, selectedCity, selectedDate]
  );

  const groupedItems = useMemo(() => groupByDate(visibleItems), [visibleItems]);
  const orderedTravelers = useMemo(() => orderTravelers(travelers), [travelers]);
  const activeTravelers = useMemo(
    () => orderedTravelers.filter((traveler) => traveler.isActive !== false),
    [orderedTravelers]
  );
  const expenseFormTravelers = useMemo(
    () => (expenseForm ? mergeExpenseFormTravelers(activeTravelers, orderedTravelers, expenseForm) : activeTravelers),
    [activeTravelers, expenseForm, orderedTravelers]
  );
  const travelerNameById = useMemo(
    () => new Map(orderedTravelers.map((traveler) => [traveler.id, traveler.name])),
    [orderedTravelers]
  );
  const linkedExpensesByItem = useMemo(() => {
    const groups = new Map<string, SharedExpense[]>();

    for (const expense of expenses) {
      if (expense.sourceType !== "itinerary" || !expense.sourceId) {
        continue;
      }
      if (!allowedCurrencySet.has(expense.currency)) {
        continue;
      }

      const current = groups.get(expense.sourceId) ?? [];
      current.push(expense);
      groups.set(expense.sourceId, current);
    }

    return groups;
  }, [allowedCurrencySet, expenses]);
  async function loadItems() {
    setLoading(true);
    setError(null);
    setNotice(null);

    try {
      const [itineraryData, expensesData] = await Promise.all([
        fetchItineraryJson("/api/itinerary", undefined, t("itinerary.errorLoad")),
        fetchExpensesJson("/api/expenses", undefined, t("bookings.errorLinkedLoad"))
      ]);
      setItems(itineraryData.itineraryItems ?? []);
      setExpenses(expensesData.expenses);
      setTravelers(expensesData.travelers);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : t("itinerary.errorLoad"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadItems();
  }, []);

  useEffect(() => {
    setForm((current) => withAllowedItineraryCurrency(current, currencyOptions));
    setExpenseForm((current) => (current ? withAllowedExpenseCurrency(current, currencyOptions) : current));
  }, [currencyOptions]);

  useEffect(() => {
    if (selectedCity !== "All" && !cityFilters.includes(selectedCity)) {
      setSelectedCity("All");
    }
  }, [cityFilters, selectedCity]);

  function resetForm() {
    setEditingId(null);
    setForm(emptyForm(primaryCurrency));
    setFormOpen(false);
  }

  function resetExpenseForm() {
    setExpenseFormItemId(null);
    setEditingExpenseId(null);
    setExpenseForm(null);
  }

  function openAddForm() {
    if (!canEdit) {
      setError("Editor mode is required to add itinerary items.");
      return;
    }

    setEditingId(null);
    setForm(emptyForm(primaryCurrency));
    setFormOpen(true);
    setNotice(null);
  }

  function startEditing(item: SharedItineraryItem) {
    if (!canEdit) {
      setError("Editor mode is required to edit itinerary items.");
      return;
    }

    setEditingId(item.id);
    setForm({
      travelDate: item.travelDate,
      city: item.city,
      startTime: item.startTime ?? "",
      endTime: item.endTime ?? "",
      title: item.title,
      location: item.location ?? "",
      details: item.details ?? "",
      transport: item.transport ?? "",
      meal: item.meal ?? "",
      costAmount: null,
      currency: primaryCurrency,
      notes: item.notes ?? "",
      mapQuery: item.mapQuery ?? "",
      sortOrder: item.sortOrder
    });
    setFormOpen(true);
    setNotice(null);
  }

  function openExpenseForm(item: SharedItineraryItem) {
    if (!canEdit) {
      setError("Editor mode is required to add linked expenses.");
      return;
    }

    setExpenseFormItemId(item.id);
    setEditingExpenseId(null);
    setExpenseForm(emptyExpenseForm(item, activeTravelers, primaryCurrency));
    setNotice(null);
    setError(null);
  }

  function startExpenseEditing(expense: SharedExpense) {
    if (!canEdit) {
      setError("Editor mode is required to edit linked expenses.");
      return;
    }

    if (expense.sourceType !== "itinerary" || !expense.sourceId) {
      return;
    }

    setExpenseFormItemId(expense.sourceId);
    setEditingExpenseId(expense.id);
    setExpenseForm({
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
    setNotice(null);
    setError(null);
  }

  async function submitItem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!canEdit) {
      setError("Editor mode is required to save itinerary items.");
      return;
    }

    if (!form.travelDate) {
      setError(t("itinerary.validationDate"));
      return;
    }

    if (!form.city.trim()) {
      setError(t("itinerary.validationCity"));
      return;
    }

    if (!form.title.trim()) {
      setError(t("itinerary.validationTitle"));
      return;
    }

    setSubmitting(true);
    setError(null);
    setNotice(null);

    try {
      const savedDate = form.travelDate;
      const savedCity = form.city.trim();
      const data = await fetchItineraryJson(
        editingId ? `/api/itinerary/${editingId}` : "/api/itinerary",
        {
          method: editingId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form)
        },
        t("itinerary.errorSave")
      );
      setItems(data.itineraryItems ?? []);
      const hiddenByFilters =
        (selectedDate !== "All" && selectedDate !== savedDate) ||
        (selectedCity !== "All" && selectedCity !== savedCity);
      setNotice(hiddenByFilters ? t("itinerary.noticeHidden") : t("itinerary.noticeSaved"));
      resetForm();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : t("itinerary.errorSave"));
    } finally {
      setSubmitting(false);
    }
  }

  async function removeItem(item: SharedItineraryItem) {
    if (!canEdit) {
      setError("Editor mode is required to delete itinerary items.");
      return;
    }

    if (!window.confirm(t("itinerary.confirmDelete"))) {
      return;
    }

    setDeletingId(item.id);
    setError(null);

    try {
      const data = await fetchItineraryJson(
        `/api/itinerary/${item.id}`,
        { method: "DELETE" },
        t("itinerary.errorDelete")
      );
      setItems(data.itineraryItems ?? []);
      setNotice(t("itinerary.noticeDeleted"));
      if (editingId === item.id) {
        resetForm();
      }
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : t("itinerary.errorDelete"));
    } finally {
      setDeletingId(null);
    }
  }

  async function submitExpense(item: SharedItineraryItem, event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!canEdit) {
      setError("Editor mode is required to save linked expenses.");
      return;
    }

    if (!expenseForm) {
      return;
    }

    const input = buildExpenseInput(item, expenseForm);
    if (!input.title) {
      setError(t("linkedExpenses.validationTitle"));
      return;
    }

    if (!Number.isFinite(input.amount) || input.amount <= 0) {
      setError(t("linkedExpenses.validationAmount"));
      return;
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(input.expenseDate)) {
      setError(t("linkedExpenses.validationDate"));
      return;
    }

    if (input.splitTravelerIds.length === 0) {
      setError(t("linkedExpenses.validationSplit"));
      return;
    }

    setExpenseSubmitting(true);
    setError(null);
    setNotice(null);

    try {
      const data = await fetchExpensesJson(
        editingExpenseId ? `/api/expenses/${editingExpenseId}` : "/api/expenses",
        {
          method: editingExpenseId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(input)
        },
        editingExpenseId ? t("linkedExpenses.errorUpdate") : t("linkedExpenses.errorAdd")
      );
      setExpenses(data.expenses);
      setTravelers(data.travelers);
      setNotice(editingExpenseId ? t("linkedExpenses.noticeUpdated") : t("linkedExpenses.noticeAdded"));
      resetExpenseForm();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : t("linkedExpenses.errorSave"));
    } finally {
      setExpenseSubmitting(false);
    }
  }

  async function removeExpense(expense: SharedExpense) {
    if (!canEdit) {
      setError("Editor mode is required to delete linked expenses.");
      return;
    }

    if (expense.sourceType !== "itinerary") {
      return;
    }

    if (!window.confirm(t("linkedExpenses.confirmDeleteItinerary"))) {
      return;
    }

    setDeletingExpenseId(expense.id);
    setError(null);
    setNotice(null);

    try {
      const data = await fetchExpensesJson(
        `/api/expenses/${expense.id}`,
        { method: "DELETE" },
        t("linkedExpenses.errorDelete")
      );
      setExpenses(data.expenses);
      setTravelers(data.travelers);
      setNotice(t("linkedExpenses.noticeDeleted"));
      if (editingExpenseId === expense.id) {
        resetExpenseForm();
      }
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : t("linkedExpenses.errorDelete"));
    } finally {
      setDeletingExpenseId(null);
    }
  }

  return (
    <div className="itinerary-workspace">
      <section className="itinerary-control-card" aria-label={t("itinerary.controlsLabel")}>
        <div className="itinerary-control-card__header">
          <button
            type="button"
            onClick={formOpen ? resetForm : openAddForm}
            className="itinerary-action-button itinerary-action-button--primary"
          >
            {formOpen ? t("itinerary.closeForm") : t("itinerary.addItem")}
          </button>
        </div>

        <div className="itinerary-filter-group">
          <div className="itinerary-filter-group__label">{t("itinerary.cityFilter")}</div>
          <div className="scroll-fade-x itinerary-chip-row" role="list" aria-label={t("itinerary.cityFilter")}>
            {cityFilters.map((city) => (
              <button
                key={city}
                type="button"
                onClick={() => setSelectedCity(city)}
                className={`itinerary-chip ${selectedCity === city ? "itinerary-chip--active" : ""}`}
              >
                {city === "All" ? translateOption(language, city) : city}
              </button>
            ))}
          </div>
        </div>

        <div className="itinerary-filter-group">
          <div className="itinerary-filter-group__label">{t("itinerary.dateFilter")}</div>
          <div className="scroll-fade-x itinerary-chip-row" role="list" aria-label={t("itinerary.dateFilter")}>
            <button
              type="button"
              onClick={() => setSelectedDate("All")}
              className={`itinerary-chip ${selectedDate === "All" ? "itinerary-chip--active" : ""}`}
            >
              {t("itinerary.allDates")}
            </button>
            {dateOptions.map((date) => (
              <button
                key={date}
                type="button"
                onClick={() => setSelectedDate(date)}
                className={`itinerary-chip ${selectedDate === date ? "itinerary-chip--active" : ""}`}
              >
                {formatDateLabel(date)}
              </button>
            ))}
          </div>
        </div>
      </section>

      {formOpen ? (
        <form
          onSubmit={submitItem}
          className="itinerary-form itinerary-editor-card mobile-safe-form box-border w-full max-w-full min-w-0 overflow-hidden"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-terracotta">
                {editingId ? t("itinerary.editItem") : t("itinerary.addItemEyebrow")}
              </p>
              <h2 className="mt-1 text-xl font-semibold text-ink">
                {editingId ? t("itinerary.editTitle") : t("itinerary.addTitle")}
              </h2>
            </div>
            {editingId ? (
              <button
                type="button"
                onClick={resetForm}
                className="itinerary-action-button itinerary-action-button--ghost max-w-full"
              >
                {t("itinerary.cancelEdit")}
              </button>
            ) : null}
          </div>

          <div className="mt-4 grid min-w-0 grid-cols-1 gap-3 md:grid-cols-2">
            <TextField
              name="itinerary-travel-date"
              label={t("common.date")}
              type="date"
              value={form.travelDate}
              onChange={(value) => setForm((current) => ({ ...current, travelDate: value }))}
            />
            <TextField
              name="itinerary-city"
              label={t("itinerary.form.city")}
              value={form.city}
              onChange={(value) => setForm((current) => ({ ...current, city: value }))}
              placeholder="Rome"
            />
            <TextField
              name="itinerary-start-time"
              label={t("itinerary.form.startTime")}
              type="time"
              value={form.startTime ?? ""}
              onChange={(value) => setForm((current) => ({ ...current, startTime: value }))}
            />
            <TextField
              name="itinerary-end-time"
              label={t("itinerary.form.endTime")}
              type="time"
              value={form.endTime ?? ""}
              onChange={(value) => setForm((current) => ({ ...current, endTime: value }))}
            />
            <TextField
              name="itinerary-title"
              label={t("common.title")}
              value={form.title}
              onChange={(value) => setForm((current) => ({ ...current, title: value }))}
              placeholder="Colosseum timed entry"
            />
            <TextField
              name="itinerary-location"
              label={t("common.location")}
              value={form.location ?? ""}
              onChange={(value) => setForm((current) => ({ ...current, location: value }))}
              placeholder="Colosseum, Rome"
            />
            <TextField
              name="itinerary-map-query"
              label={t("itinerary.form.mapQuery")}
              value={form.mapQuery ?? ""}
              onChange={(value) => setForm((current) => ({ ...current, mapQuery: value }))}
              placeholder="Colosseum Rome"
            />
            <TextField
              name="itinerary-sort-order"
              label={t("common.sortOrder")}
              type="number"
              value={String(form.sortOrder ?? 0)}
              onChange={(value) =>
                setForm((current) => ({ ...current, sortOrder: value ? Number(value) : 0 }))
              }
              placeholder="0"
            />
          </div>

          <div className="mt-3 grid min-w-0 grid-cols-1 gap-3 md:grid-cols-2">
            <TextareaField
              name="itinerary-details"
              label={t("itinerary.details")}
              value={form.details ?? ""}
              onChange={(value) => setForm((current) => ({ ...current, details: value }))}
              placeholder={t("itinerary.form.detailsPlaceholder")}
            />
            <TextareaField
              name="itinerary-transport"
              label={t("itinerary.transport")}
              value={form.transport ?? ""}
              onChange={(value) => setForm((current) => ({ ...current, transport: value }))}
              placeholder={t("itinerary.form.transportPlaceholder")}
            />
            <TextareaField
              name="itinerary-meal"
              label={t("itinerary.meal")}
              value={form.meal ?? ""}
              onChange={(value) => setForm((current) => ({ ...current, meal: value }))}
              placeholder={t("itinerary.form.mealPlaceholder")}
            />
            <TextareaField
              name="itinerary-notes"
              label={t("common.notes")}
              value={form.notes ?? ""}
              onChange={(value) => setForm((current) => ({ ...current, notes: value }))}
              placeholder={t("bookings.form.notesPlaceholder")}
            />
          </div>

          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <button
              type="submit"
              disabled={submitting}
              className="itinerary-action-button itinerary-action-button--primary box-border w-full max-w-full disabled:opacity-60 sm:w-auto"
            >
              {submitting ? t("common.saving") : editingId ? t("bookings.saveChanges") : t("itinerary.addButton")}
            </button>
            <button
              type="button"
              onClick={resetForm}
              disabled={submitting}
              className="itinerary-action-button itinerary-action-button--ghost box-border w-full max-w-full disabled:opacity-60 sm:w-auto"
            >
              {editingId ? t("itinerary.cancelEdit") : t("itinerary.closeForm")}
            </button>
          </div>
        </form>
      ) : null}

      {notice ? (
        <p
          role="status"
          aria-live="polite"
          className="itinerary-inline-status itinerary-inline-status--success"
        >
          {notice}
        </p>
      ) : null}

      {error ? (
        <div
          role="alert"
          className="itinerary-inline-status itinerary-inline-status--error flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
        >
          <p>{error}</p>
          <button
            type="button"
            onClick={() => void loadItems()}
            disabled={loading}
            className="itinerary-action-button itinerary-action-button--ghost disabled:opacity-60"
          >
            {loading ? t("common.retrying") : t("common.retry")}
          </button>
        </div>
      ) : null}

      {loading ? (
        <p role="status" aria-live="polite" className="itinerary-loading-card">
          {t("itinerary.loading")}
        </p>
      ) : null}

      {!loading && visibleItems.length === 0 ? (
        <p className="itinerary-empty-card">
          {t("itinerary.empty")}
        </p>
      ) : null}

      <section className="itinerary-journal-grid" aria-label={t("itinerary.timeline")}>
        <div className="itinerary-timeline">
          {groupedItems.map((group, groupIndex) => (
            <section key={group.date} className="itinerary-day-section route-line">
              <div className="itinerary-day-section__header">
                <span className="route-dot" />
                <div>
                  <p>{t("dashboard.day", { day: groupIndex + 1 })}</p>
                  <h2>{group.date}</h2>
                </div>
                <span>{group.items.length}</span>
              </div>
              <div className="itinerary-day-section__cards">
                {group.items.map((item) => (
                  <ItineraryCard
                    key={item.id}
                    item={item}
                    expenses={linkedExpensesByItem.get(item.id) ?? []}
                    travelers={expenseFormTravelers}
                    travelerNameById={travelerNameById}
                    expenseForm={expenseFormItemId === item.id ? expenseForm : null}
                    currencyOptions={currencyOptions}
                    editingExpenseId={expenseFormItemId === item.id ? editingExpenseId : null}
                    expenseSubmitting={expenseSubmitting}
                    deletingId={deletingId}
                    deletingExpenseId={deletingExpenseId}
                    canEdit={canEdit}
                    onEdit={startEditing}
                    onDelete={removeItem}
                    onAddExpense={openExpenseForm}
                    onEditExpense={startExpenseEditing}
                    onDeleteExpense={removeExpense}
                    onSubmitExpense={submitExpense}
                    onCancelExpense={resetExpenseForm}
                    onExpenseFormChange={(updater) =>
                      setExpenseForm((current) => (current ? updater(current) : current))
                    }
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      </section>
    </div>
  );
}

async function fetchItineraryJson(
  url: string,
  options: RequestInit | undefined,
  fallbackMessage: string
): Promise<ItineraryApiResponse> {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), requestTimeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    const data = (await response.json()) as ItineraryApiResponse;

    if (!response.ok) {
      throw new Error(data.error ?? fallbackMessage);
    }

    return data;
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error(`${fallbackMessage} Request timed out. Please retry.`);
    }

    throw error;
  } finally {
    window.clearTimeout(timeoutId);
  }
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

    if (!Array.isArray(data.expenses) || !Array.isArray(data.travelers)) {
      throw new Error(fallbackMessage);
    }

    return {
      expenses: data.expenses.filter(isSharedExpense),
      travelers: data.travelers.filter(isTraveler)
    };
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error(`${fallbackMessage} Request timed out. Please retry.`);
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

function groupByDate(items: SharedItineraryItem[]) {
  const groups = new Map<string, SharedItineraryItem[]>();

  for (const item of items) {
    const group = groups.get(item.travelDate) ?? [];
    group.push(item);
    groups.set(item.travelDate, group);
  }

  return Array.from(groups.entries()).map(([date, groupItems]) => ({
    date,
    items: groupItems
  }));
}

function formatDateLabel(date: string) {
  return date;
}

function ItineraryCard({
  item,
  expenses,
  travelers,
  travelerNameById,
  expenseForm,
  currencyOptions,
  editingExpenseId,
  expenseSubmitting,
  deletingId,
  deletingExpenseId,
  canEdit,
  onEdit,
  onDelete,
  onAddExpense,
  onEditExpense,
  onDeleteExpense,
  onSubmitExpense,
  onCancelExpense,
  onExpenseFormChange
}: {
  item: SharedItineraryItem;
  expenses: SharedExpense[];
  travelers: Traveler[];
  travelerNameById: Map<string, string>;
  expenseForm: ExpenseFormState | null;
  currencyOptions: readonly SharedCurrency[];
  editingExpenseId: string | null;
  expenseSubmitting: boolean;
  deletingId: string | null;
  deletingExpenseId: string | null;
  canEdit: boolean;
  onEdit: (item: SharedItineraryItem) => void;
  onDelete: (item: SharedItineraryItem) => Promise<void>;
  onAddExpense: (item: SharedItineraryItem) => void;
  onEditExpense: (expense: SharedExpense) => void;
  onDeleteExpense: (expense: SharedExpense) => Promise<void>;
  onSubmitExpense: (item: SharedItineraryItem, event: FormEvent<HTMLFormElement>) => Promise<void>;
  onCancelExpense: () => void;
  onExpenseFormChange: (updater: (current: ExpenseFormState) => ExpenseFormState) => void;
}) {
  const { t } = useLanguage();
  const mapsQuery = item.mapQuery || item.location;
  const [expenseDetailsOpen, setExpenseDetailsOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const expenseDetailsVisible = expenseDetailsOpen || Boolean(expenseForm);
  const outstandingSummary = formatOutstandingSummary(expenses, t("linkedExpenses.none"));

  function handleAddExpense() {
    if (!canEdit) {
      return;
    }

    setExpenseDetailsOpen(true);
    onAddExpense(item);
  }

  return (
    <article className="itinerary-item-card">
      <div className="itinerary-item-card__header">
        <div className="itinerary-item-card__time">
          <p>
            {formatTimeRange(item, t("itinerary.flexibleTime"))}
          </p>
          <span>{item.travelDate}</span>
        </div>
        <div className="itinerary-item-card__title">
          <h3>{item.title}</h3>
          <div>
            <span>{item.city}</span>
            {item.location ? <span>- {item.location}</span> : null}
          </div>
        </div>
      </div>

      <section className="itinerary-expense-summary" aria-label={t("linkedExpenses.title")}>
        <span className="itinerary-expense-chip">
          {t("linkedExpenses.expensesCount", { count: expenses.length })}
        </span>
        <span className="itinerary-expense-chip">
          {t("linkedExpenses.outstanding", { amount: outstandingSummary })}
        </span>
      </section>

      <div className="itinerary-card-action-row">
        <div className="itinerary-card-action-group itinerary-card-action-group--expense" aria-label={t("linkedExpenses.title")}>
          {canEdit ? (
            <button
              type="button"
              onClick={handleAddExpense}
              className="itinerary-action-button itinerary-action-button--secondary itinerary-card-action-button"
              aria-label={t("linkedExpenses.addAria")}
            >
              {t("linkedExpenses.addAction")}
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => setExpenseDetailsOpen((current) => !current)}
            className="itinerary-action-button itinerary-action-button--ghost itinerary-card-action-button"
            aria-label={t("linkedExpenses.viewAria")}
          >
            {expenseDetailsVisible ? t("linkedExpenses.hideAction") : t("linkedExpenses.viewAction")}
          </button>
        </div>

        <div className="itinerary-card-action-group itinerary-card-action-group--trip" aria-label={t("itinerary.cardActions")}>
          {mapsQuery ? (
            <a
              href={googleMapsSearchUrl(mapsQuery)}
              target="_blank"
              rel="noopener noreferrer"
              className="itinerary-action-button itinerary-action-button--primary itinerary-card-action-button"
              aria-label={t("itinerary.openMapAria")}
            >
              {t("common.map")}
            </a>
          ) : null}
          {canEdit ? (
            <div className="itinerary-more-menu">
              <button
                type="button"
                onClick={() => setMoreOpen((current) => !current)}
                className="itinerary-action-button itinerary-action-button--ghost itinerary-more-menu__trigger"
                aria-haspopup="menu"
                aria-expanded={moreOpen}
                aria-label={t("itinerary.moreActionsAria")}
              >
                {t("nav.more")}
              </button>
              {moreOpen ? (
                <div
                  className="itinerary-more-menu__panel"
                  role="menu"
                  onKeyDown={(event) => {
                    if (event.key === "Escape") {
                      event.preventDefault();
                      setMoreOpen(false);
                      return;
                    }

                    handleMenuKeyboard(event);
                  }}
                >
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setMoreOpen(false);
                      onEdit(item);
                    }}
                  >
                    {t("itinerary.editAction")}
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setMoreOpen(false);
                      void onDelete(item);
                    }}
                    disabled={deletingId === item.id}
                    className="itinerary-more-menu__danger"
                  >
                    {deletingId === item.id ? t("common.deleting") : t("itinerary.deleteAction")}
                  </button>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>

      <div className="itinerary-card-details">
        <RichTextBlock title={t("itinerary.details")} value={item.details} />
        <RichTextBlock title={t("itinerary.transport")} value={item.transport} />
        <RichTextBlock title={t("itinerary.meal")} value={item.meal} />
        <RichTextBlock title={t("common.notes")} value={item.notes} />
      </div>

      {expenseDetailsVisible ? (
        <section className="itinerary-expense-details" aria-label={t("linkedExpenses.title")}>
          {expenseForm ? (
            <ItineraryExpenseForm
              item={item}
              form={expenseForm}
              travelers={travelers}
              currencies={currencyOptions}
              editingExpenseId={editingExpenseId}
              submitting={expenseSubmitting}
              onSubmit={onSubmitExpense}
              onCancel={onCancelExpense}
              onChange={onExpenseFormChange}
            />
          ) : null}

          <div className="itinerary-expense-list">
            {expenses.length === 0 ? (
              <p className="itinerary-expense-empty">
                {t("linkedExpenses.empty")}
              </p>
            ) : null}
            {expenses.map((expense) => (
              <ItineraryExpenseCard
                key={expense.id}
                expense={expense}
                travelerNameById={travelerNameById}
                deletingExpenseId={deletingExpenseId}
                canEdit={canEdit}
                onEdit={onEditExpense}
                onDelete={onDeleteExpense}
              />
            ))}
          </div>
        </section>
      ) : null}
    </article>
  );
}

function formatOutstandingSummary(expenses: SharedExpense[], noneLabel: string) {
  const totals = new Map<SharedCurrency, number>();

  for (const expense of expenses) {
    if (expense.settled) {
      continue;
    }

    totals.set(expense.currency, (totals.get(expense.currency) ?? 0) + expense.amount);
  }

  if (totals.size === 0) {
    return noneLabel;
  }

  return Array.from(totals.entries())
    .sort(([leftCurrency], [rightCurrency]) => leftCurrency.localeCompare(rightCurrency))
    .map(([currency, amount]) => formatMoney(amount, currency))
    .join(", ");
}

function ItineraryExpenseForm({
  item,
  form,
  travelers,
  currencies,
  editingExpenseId,
  submitting,
  onSubmit,
  onCancel,
  onChange
}: {
  item: SharedItineraryItem;
  form: ExpenseFormState;
  travelers: Traveler[];
  currencies: readonly SharedCurrency[];
  editingExpenseId: string | null;
  submitting: boolean;
  onSubmit: (item: SharedItineraryItem, event: FormEvent<HTMLFormElement>) => Promise<void>;
  onCancel: () => void;
  onChange: (updater: (current: ExpenseFormState) => ExpenseFormState) => void;
}) {
  const { language, t } = useLanguage();

  return (
    <form
      onSubmit={(event) => void onSubmit(item, event)}
      className="itinerary-expense-form mobile-safe-form mt-3 box-border w-full max-w-full min-w-0 overflow-hidden"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-zinc-500">
            {editingExpenseId ? t("linkedExpenses.editEyebrow") : t("linkedExpenses.addEyebrow")}
          </p>
          <h4 className="mt-1 text-base font-semibold text-ink">
            {editingExpenseId ? t("linkedExpenses.itineraryEditTitle") : t("linkedExpenses.itineraryAddTitle")}
          </h4>
        </div>
      </div>

      <div className="mt-3 grid min-w-0 grid-cols-1 gap-3 md:grid-cols-2">
        <TextField
          name={`itinerary-${item.id}-expense-title`}
          label={t("common.title")}
          value={form.title}
          onChange={(value) => onChange((current) => ({ ...current, title: value }))}
          placeholder={item.title}
        />
        <TextField
          name={`itinerary-${item.id}-expense-amount`}
          label={t("common.amount")}
          type="number"
          value={form.amount}
          onChange={(value) => onChange((current) => ({ ...current, amount: value }))}
          placeholder="0"
        />
        <SelectField
          name={`itinerary-${item.id}-expense-currency`}
          label={t("common.currency")}
          value={form.currency}
          options={currencies}
          onChange={(value) => onChange((current) => ({ ...current, currency: value as SharedCurrency }))}
        />
        <SelectField
          name={`itinerary-${item.id}-expense-category`}
          label={t("common.category")}
          value={form.category}
          options={expenseCategories}
          formatOption={(option) => translateOption(language, option)}
          onChange={(value) => onChange((current) => ({ ...current, category: value as ExpenseCategory }))}
        />
        <TextField
          name={`itinerary-${item.id}-expense-date`}
          label={t("common.date")}
          type="date"
          value={form.expenseDate}
          onChange={(value) => onChange((current) => ({ ...current, expenseDate: value }))}
        />
        <SelectField
          name={`itinerary-${item.id}-expense-paid-by`}
          label={t("budget.form.paidBy")}
          value={form.paidByTravelerId}
          options={travelers.map((traveler) => traveler.id)}
          optionLabels={new Map(travelers.map((traveler) => [traveler.id, traveler.name]))}
          onChange={(value) => onChange((current) => ({ ...current, paidByTravelerId: value }))}
        />
      </div>

      <fieldset className="itinerary-expense-split mt-3 min-w-0">
        <legend className="px-1 text-sm font-semibold text-ink">{t("budget.form.splitAmong")}</legend>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          {travelers.map((traveler) => (
            <label key={traveler.id} className="flex min-w-0 items-center gap-2 text-sm text-zinc-700">
              <input
                type="checkbox"
                name={`itinerary-${item.id}-expense-split-traveler`}
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
          name={`itinerary-${item.id}-expense-settled`}
          checked={form.settled}
          onChange={(event) => onChange((current) => ({ ...current, settled: event.target.checked }))}
          className="h-4 w-4 shrink-0 rounded border-zinc-300"
        />
        <span>{translateOption(language, "Settled")}</span>
      </label>

      <label className="mt-3 block w-full max-w-full min-w-0 text-sm font-semibold text-ink">
        {t("common.notes")}
        <textarea
          name={`itinerary-${item.id}-expense-notes`}
          autoComplete="off"
          value={form.notes}
          onChange={(event) => onChange((current) => ({ ...current, notes: event.target.value }))}
          className="mt-2 block box-border min-h-24 w-full max-w-full min-w-0 resize-y rounded-md border border-zinc-200 bg-white px-3 py-2 text-base text-zinc-700 sm:text-sm"
          placeholder={t("bookings.form.notesPlaceholder")}
        />
      </label>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <button
          type="submit"
          disabled={submitting}
          className="itinerary-action-button itinerary-action-button--primary w-full max-w-full disabled:opacity-60 sm:w-auto"
        >
          {submitting ? t("common.saving") : editingExpenseId ? t("linkedExpenses.saveExpense") : t("linkedExpenses.addExpense")}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={submitting}
          className="itinerary-action-button itinerary-action-button--ghost w-full max-w-full disabled:opacity-60 sm:w-auto"
        >
          {t("common.cancel")}
        </button>
      </div>
    </form>
  );
}

function ItineraryExpenseCard({
  expense,
  travelerNameById,
  deletingExpenseId,
  canEdit,
  onEdit,
  onDelete
}: {
  expense: SharedExpense;
  travelerNameById: Map<string, string>;
  deletingExpenseId: string | null;
  canEdit: boolean;
  onEdit: (expense: SharedExpense) => void;
  onDelete: (expense: SharedExpense) => Promise<void>;
}) {
  const { language, t } = useLanguage();

  return (
    <article className="itinerary-expense-card">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold text-ink">{expense.title}</p>
            <ExpenseStatusPill settled={expense.settled} />
          </div>
          <p className="mt-1 text-xs uppercase tracking-[0.08em] text-zinc-500">
            {translateOption(language, expense.category)} - {expense.expenseDate}
          </p>
        </div>
        <p className="shrink-0 text-sm font-semibold text-ink">
          {formatMoney(expense.amount, expense.currency)}
        </p>
      </div>
      <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
        <Field
          label={t("budget.form.paidBy")}
          value={travelerNameById.get(expense.paidByTravelerId) ?? expense.paidByTravelerId}
        />
        <Field
          label={t("budget.form.splitAmong")}
          value={expense.splitTravelerIds
            .map((travelerId) => travelerNameById.get(travelerId) ?? travelerId)
            .join(", ")}
        />
      </dl>
      {expense.notes ? <p className="mt-2 break-words text-sm leading-6 text-zinc-600">{expense.notes}</p> : null}
      {canEdit ? (
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => onEdit(expense)}
            className="itinerary-action-button itinerary-action-button--ghost"
          >
            {t("common.edit")}
          </button>
          <button
            type="button"
            onClick={() => void onDelete(expense)}
            disabled={deletingExpenseId === expense.id}
            className="itinerary-action-button itinerary-action-button--danger disabled:opacity-60"
          >
            {deletingExpenseId === expense.id ? t("common.deleting") : t("common.delete")}
          </button>
        </div>
      ) : null}
    </article>
  );
}

function ExpenseStatusPill({ settled }: { settled: boolean }) {
  const { language } = useLanguage();

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${
        settled
          ? "bg-emerald-100 text-emerald-800 ring-emerald-200"
          : "bg-amber-100 text-amber-800 ring-amber-200"
      }`}
    >
      {translateOption(language, settled ? "Settled" : "Outstanding")}
    </span>
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

function formatTimeRange(item: SharedItineraryItem, flexibleLabel: string) {
  if (item.startTime && item.endTime) {
    return `${item.startTime}-${item.endTime}`;
  }

  return item.startTime || flexibleLabel;
}

function googleMapsSearchUrl(query: string) {
  return `https://www.google.com/maps/search/${encodeURIComponent(query.trim())}`;
}

function RichTextBlock({ title, value }: { title: string; value: string | null }) {
  if (!value) {
    return null;
  }

  return (
    <section>
      <p className="text-xs font-semibold uppercase tracking-[0.08em] text-zinc-500">{title}</p>
      <div className="mt-2 space-y-2 text-sm leading-6 text-zinc-700">
        <SimpleMarkdown value={value} />
      </div>
    </section>
  );
}

function SimpleMarkdown({ value }: { value: string }) {
  const blocks: ReactNode[] = [];
  let bulletItems: ReactNode[] = [];
  let numberedItems: ReactNode[] = [];

  function flushLists() {
    if (bulletItems.length > 0) {
      blocks.push(
        <ul key={`ul-${blocks.length}`} className="list-disc space-y-1 pl-5">
          {bulletItems}
        </ul>
      );
      bulletItems = [];
    }

    if (numberedItems.length > 0) {
      blocks.push(
        <ol key={`ol-${blocks.length}`} className="list-decimal space-y-1 pl-5">
          {numberedItems}
        </ol>
      );
      numberedItems = [];
    }
  }

  value.split(/\r?\n/).forEach((line, index) => {
    const trimmed = line.trim();

    if (!trimmed) {
      flushLists();
      return;
    }

    const numberedMatch = trimmed.match(/^\d+\.\s+(.*)$/);

    if (trimmed.startsWith("- ")) {
      if (numberedItems.length > 0) {
        flushLists();
      }
      bulletItems.push(<li key={`li-${index}`}>{renderBold(trimmed.slice(2))}</li>);
      return;
    }

    if (numberedMatch) {
      if (bulletItems.length > 0) {
        flushLists();
      }
      numberedItems.push(<li key={`ni-${index}`}>{renderBold(numberedMatch[1])}</li>);
      return;
    }

    flushLists();
    blocks.push(<p key={`p-${index}`}>{renderBold(trimmed)}</p>);
  });

  flushLists();
  return blocks;
}

function renderBold(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);

  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={index}>{part.slice(2, -2)}</strong>;
    }

    return part;
  });
}

function buildExpenseInput(item: SharedItineraryItem, form: ExpenseFormState): ExpenseInput {
  return {
    sourceType: "itinerary",
    sourceId: item.id,
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

function withAllowedItineraryCurrency(form: ItineraryInput, currencies: readonly SharedCurrency[]) {
  if (form.currency && currencies.includes(form.currency)) {
    return form;
  }

  return { ...form, currency: currencies[0] };
}

function withAllowedExpenseCurrency(form: ExpenseFormState, currencies: readonly SharedCurrency[]) {
  if (currencies.includes(form.currency)) {
    return form;
  }

  return { ...form, currency: currencies[0] };
}

function orderTravelers(travelers: Traveler[]) {
  return travelers.slice().sort((a, b) => a.displayOrder - b.displayOrder);
}

function mergeExpenseFormTravelers(
  activeTravelers: Traveler[],
  allTravelers: Traveler[],
  form: ExpenseFormState
) {
  const included = new Set(activeTravelers.map((traveler) => traveler.id));
  const selectedIds = new Set([form.paidByTravelerId, ...form.splitTravelerIds]);
  const extraTravelers = allTravelers.filter(
    (traveler) => selectedIds.has(traveler.id) && !included.has(traveler.id)
  );

  return orderTravelers([...activeTravelers, ...extraTravelers]);
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
  type?: "date" | "number" | "text" | "time";
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
        min={type === "number" ? "0" : undefined}
        step={type === "number" ? "0.01" : undefined}
        className="mt-2 block box-border w-full max-w-full min-w-0 rounded-md border border-zinc-200 bg-white px-3 py-2 text-base text-zinc-700 sm:text-sm"
      />
    </label>
  );
}

function TextareaField({
  name,
  label,
  value,
  onChange,
  placeholder
}: {
  name: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block w-full max-w-full min-w-0 text-sm font-semibold text-ink">
      {label}
      <textarea
        name={name}
        autoComplete="off"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="mt-2 block box-border min-h-28 w-full max-w-full min-w-0 resize-y rounded-md border border-zinc-200 bg-white px-3 py-2 text-base text-zinc-700 sm:text-sm"
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
