"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { StatusBadge } from "@/components/StatusBadge";
import { useTripAccess } from "@/lib/access";
import { formatMoney } from "@/lib/budget";
import { activeTripCurrencies, fallbackCurrency } from "@/lib/currencyPreferences";
import { useLanguage } from "@/lib/i18n";
import { translateOption } from "@/lib/localize";
import {
  bookingCategories,
  bookingStatuses,
  type BookingInput,
  type SharedCurrency,
  type SharedBooking,
  type SharedExpense
} from "@/lib/sharedDataTypes";
import type { Traveler } from "@/data/tripData";

type BookingsClientProps = {
  participants: string[];
  defaultCurrencies: SharedCurrency[];
};

type FilterValue = "All";

type ExpensesApiResponse = {
  expenses?: SharedExpense[];
  travelers?: Traveler[];
  error?: string;
};

const requestTimeoutMs = 10000;

function emptyForm(bookedBy: string, travelers: Traveler[] = [], currency: SharedCurrency = fallbackCurrency): BookingInput {
  return ensureBookingBudgetDefaults(
    {
      category: "Hotel",
      description: "",
      date: "",
      location: "",
      bookedBy,
      amount: null,
      currency,
      notes: "",
      status: "Pending",
      budgetSettled: false
    },
    travelers
  );
}

export function BookingsClient({ participants, defaultCurrencies }: BookingsClientProps) {
  const { language, t } = useLanguage();
  const { mode } = useTripAccess();
  const canEdit = mode === "editor";
  const currencyOptions = useMemo(() => activeTripCurrencies(defaultCurrencies), [defaultCurrencies]);
  const allowedCurrencySet = useMemo(() => new Set(currencyOptions), [currencyOptions]);
  const primaryCurrency = currencyOptions[0];
  const [bookings, setBookings] = useState<SharedBooking[]>([]);
  const [expenses, setExpenses] = useState<SharedExpense[]>([]);
  const [travelers, setTravelers] = useState<Traveler[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<FilterValue | SharedBooking["category"]>("All");
  const [statusFilter, setStatusFilter] = useState<FilterValue | SharedBooking["status"]>("All");
  const [bookedByFilter, setBookedByFilter] = useState<FilterValue | string>("All");
  const [form, setForm] = useState<BookingInput>(() => emptyForm(participants[0] ?? "Person A", [], primaryCurrency));
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const bookingFormRef = useRef<HTMLFormElement>(null);

  const visibleBookings = useMemo(
    () =>
      bookings.filter((booking) => {
        const categoryMatches = categoryFilter === "All" || booking.category === categoryFilter;
        const statusMatches = statusFilter === "All" || booking.status === statusFilter;
        const ownerMatches = bookedByFilter === "All" || booking.bookedBy === bookedByFilter;
        const currencyMatches = !booking.currency || allowedCurrencySet.has(booking.currency);
        return categoryMatches && statusMatches && ownerMatches && currencyMatches;
      }),
    [allowedCurrencySet, bookedByFilter, bookings, categoryFilter, statusFilter]
  );

  const incompleteCount = bookings.filter((booking) =>
    ["Not Booked", "Pending", "Need Confirmation"].includes(booking.status)
  ).length;

  const orderedTravelers = useMemo(() => orderTravelers(travelers), [travelers]);
  const activeTravelers = useMemo(
    () => orderedTravelers.filter((traveler) => traveler.isActive !== false),
    [orderedTravelers]
  );
  const bookingOwnerOptions = useMemo(
    () => Array.from(new Set([...participants, ...bookings.map((booking) => booking.bookedBy)].filter(Boolean))),
    [bookings, participants]
  );
  const formParticipants = useMemo(
    () => (participants.includes(form.bookedBy) ? participants : [form.bookedBy, ...participants].filter(Boolean)),
    [form.bookedBy, participants]
  );
  const budgetExpenseByBooking = useMemo(() => {
    const expenseByBooking = new Map<string, SharedExpense>();

    for (const expense of expenses) {
      if (expense.sourceType !== "booking" || !expense.sourceId) {
        continue;
      }

      if (!expenseByBooking.has(expense.sourceId)) {
        expenseByBooking.set(expense.sourceId, expense);
      }
    }

    return expenseByBooking;
  }, [expenses]);

  async function loadBookings() {
    setLoading(true);
    setError(null);
    setNotice(null);

    try {
      const [bookingsData, expensesData] = await Promise.all([
        fetchBookingsJson("/api/bookings", undefined, t("bookings.errorLoad")),
        fetchExpensesJson("/api/expenses", undefined, t("bookings.errorLinkedLoad"))
      ]);

      setBookings(bookingsData.bookings ?? []);
      setExpenses(expensesData.expenses);
      setTravelers(expensesData.travelers);
      setForm((current) => ensureBookingBudgetDefaults(withAllowedCurrency(current, currencyOptions), expensesData.travelers));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : t("bookings.errorLoad"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadBookings();
  }, []);

  useEffect(() => {
    setForm((current) => withAllowedCurrency(current, currencyOptions));
  }, [currencyOptions]);

  function resetForm() {
    setEditingId(null);
    setForm(emptyForm(participants[0] ?? "Person A", activeTravelers, primaryCurrency));
    setFormOpen(false);
  }

  function startEditing(booking: SharedBooking) {
    if (!canEdit) {
      setError("Private trip access is required to edit bookings.");
      return;
    }

    const budgetExpense = budgetExpenseByBooking.get(booking.id);
    setEditingId(booking.id);
    setForm(bookingToForm(booking, budgetExpense, activeTravelers, currencyOptions));
    setFormOpen(true);
    setNotice(null);
    window.setTimeout(() => {
      bookingFormRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 0);
  }

  function openAddForm() {
    if (!canEdit) {
      setError("Private trip access is required to add bookings.");
      return;
    }

    setEditingId(null);
    setForm(emptyForm(participants[0] ?? "Person A", activeTravelers, primaryCurrency));
    setFormOpen(true);
    setNotice(null);
    setError(null);
  }

  async function submitBooking(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!canEdit) {
      setError("Private trip access is required to save bookings.");
      return;
    }

    if (!form.description.trim()) {
      setError(t("bookings.validationDescription"));
      return;
    }

    if (!form.date) {
      setError(t("bookings.validationDate"));
      return;
    }

    if (hasBudgetAmount(form) && !form.budgetPaidByTravelerId) {
      setError(t("bookings.validationBudgetPaidBy"));
      return;
    }

    if (hasBudgetAmount(form) && (!form.budgetSplitTravelerIds || form.budgetSplitTravelerIds.length === 0)) {
      setError(t("bookings.validationBudgetSplit"));
      return;
    }

    setSubmitting(true);
    setError(null);
    setNotice(null);

    try {
      const data = await fetchBookingsJson(
        editingId ? `/api/bookings/${editingId}` : "/api/bookings",
        {
          method: editingId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form)
        },
        t("bookings.errorSave")
      );

      setBookings(data.bookings ?? []);
      const expensesData = await fetchExpensesJson("/api/expenses", undefined, t("budget.errorLoad"));
      setExpenses(expensesData.expenses);
      setTravelers(expensesData.travelers);
      setNotice(editingId ? t("bookings.noticeUpdated") : t("bookings.noticeAdded"));
      resetForm();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : t("bookings.errorSave"));
    } finally {
      setSubmitting(false);
    }
  }

  async function removeBooking(booking: SharedBooking) {
    if (!canEdit) {
      setError("Private trip access is required to delete bookings.");
      return;
    }

    if (!window.confirm(t("bookings.confirmDelete"))) {
      return;
    }

    setDeletingId(booking.id);
    setError(null);
    setNotice(null);

    try {
      const data = await fetchBookingsJson(
        `/api/bookings/${booking.id}`,
        { method: "DELETE" },
        t("bookings.errorDelete")
      );

      setBookings(data.bookings ?? []);
      const expensesData = await fetchExpensesJson("/api/expenses", undefined, t("budget.errorLoad"));
      setExpenses(expensesData.expenses);
      setTravelers(expensesData.travelers);
      setNotice(t("bookings.noticeDeleted"));
      if (editingId === booking.id) {
        resetForm();
      }
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : t("bookings.errorDelete"));
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="bookings-workspace">
      <section className="bookings-control-card" aria-label={t("page.bookings.title")}>
        <div className="bookings-control-card__header">
          <div className="bookings-stats-strip">
            <SummaryPill label={t("bookings.summary.total")} value={String(bookings.length)} />
            <SummaryPill label={t("bookings.summary.needAction")} value={String(incompleteCount)} />
            <SummaryPill label={t("common.visible")} value={String(visibleBookings.length)} />
          </div>
          <button
            type="button"
            onClick={formOpen ? resetForm : openAddForm}
            data-edit-required={!canEdit ? "true" : undefined}
            title={!canEdit ? "Private trip access is required to add bookings." : undefined}
            className="bookings-add-button itinerary-action-button itinerary-action-button--primary"
          >
            {formOpen ? t("bookings.closeForm") : t("bookings.addItem")}
          </button>
        </div>

        <div className="bookings-filter-group">
          <div className="bookings-filter-group__label">{t("common.category")}</div>
          <div className="scroll-fade-x bookings-chip-row" role="list" aria-label={t("common.category")}>
            {(["All", ...bookingCategories] as const).map((category) => (
              <FilterChip
                key={category}
                active={categoryFilter === category}
                label={translateOption(language, category)}
                onClick={() => setCategoryFilter(category as typeof categoryFilter)}
              />
            ))}
          </div>
        </div>

        <div className="bookings-filter-row">
          <div className="bookings-filter-group">
            <div className="bookings-filter-group__label">{t("common.status")}</div>
            <div className="scroll-fade-x bookings-chip-row" role="list" aria-label={t("common.status")}>
              {(["All", ...bookingStatuses] as const).map((status) => (
                <FilterChip
                  key={status}
                  active={statusFilter === status}
                  label={translateOption(language, status)}
                  onClick={() => setStatusFilter(status as typeof statusFilter)}
                />
              ))}
            </div>
          </div>
          <div className="bookings-filter-group">
            <div className="bookings-filter-group__label">{t("bookings.form.bookedBy")}</div>
            <div className="scroll-fade-x bookings-chip-row" role="list" aria-label={t("bookings.form.bookedBy")}>
              {(["All", ...bookingOwnerOptions] as const).map((owner) => (
                <FilterChip
                  key={owner}
                  active={bookedByFilter === owner}
                  label={owner === "All" ? translateOption(language, owner) : owner}
                  onClick={() => setBookedByFilter(owner)}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {formOpen ? (
        <form
          ref={bookingFormRef}
          onSubmit={submitBooking}
          className="bookings-form bookings-editor-card mobile-safe-form box-border w-full max-w-full min-w-0 overflow-hidden"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-terracotta">
                {editingId ? t("bookings.editBooking") : t("bookings.addBooking")}
              </p>
              <h2 className="mt-1 text-xl font-semibold text-ink">
                {editingId ? t("bookings.editTitle") : t("bookings.addTitle")}
              </h2>
            </div>
            {editingId ? (
              <button
                type="button"
                onClick={resetForm}
                className="itinerary-action-button itinerary-action-button--ghost max-w-full"
              >
                {t("bookings.cancelEdit")}
              </button>
            ) : null}
          </div>

          <div className="mt-4 grid min-w-0 grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
            <SelectField
              name="booking-category"
              label={t("common.category")}
              value={form.category}
              options={bookingCategories}
              formatOption={(option) => translateOption(language, option)}
              onChange={(value) => setForm((current) => ({ ...current, category: value as BookingInput["category"] }))}
            />
            <TextField
              name="booking-description"
              label={t("common.description")}
              value={form.description}
              onChange={(value) => setForm((current) => ({ ...current, description: value }))}
              placeholder={t("bookings.form.descriptionPlaceholder")}
            />
            <TextField
              name="booking-date"
              label={t("common.date")}
              type="date"
              value={form.date}
              onChange={(value) => setForm((current) => ({ ...current, date: value }))}
            />
            <TextField
              name="booking-location"
              label={t("common.location")}
              value={form.location ?? ""}
              onChange={(value) => setForm((current) => ({ ...current, location: value }))}
              placeholder="Rome"
            />
            <SelectField
              name="booking-booked-by"
              label={t("bookings.form.bookedBy")}
              value={form.bookedBy}
              options={formParticipants}
              onChange={(value) =>
                setForm((current) =>
                  ensureBookingBudgetDefaults(
                    {
                      ...current,
                      bookedBy: value,
                      budgetPaidByTravelerId: findTravelerIdByName(value, activeTravelers) ?? current.budgetPaidByTravelerId
                    },
                    activeTravelers
                  )
                )
              }
            />
            <TextField
              name="booking-amount"
              label={t("common.amount")}
              type="number"
              value={form.amount === null || form.amount === undefined ? "" : String(form.amount)}
              onChange={(value) =>
                setForm((current) =>
                  ensureBookingBudgetDefaults(
                    { ...current, amount: value ? Number(value) : null },
                    activeTravelers
                  )
                )
              }
              placeholder="0"
            />
            <SelectField
              name="booking-currency"
              label={t("common.currency")}
              value={form.currency ?? primaryCurrency}
              options={currencyOptions}
              onChange={(value) => setForm((current) => ({ ...current, currency: value as BookingInput["currency"] }))}
            />
            <SelectField
              name="booking-status"
              label={t("common.status")}
              value={form.status}
              options={bookingStatuses}
              formatOption={(option) => translateOption(language, option)}
              onChange={(value) => setForm((current) => ({ ...current, status: value as BookingInput["status"] }))}
            />
          </div>

          {hasBudgetAmount(form) ? (
            <BookingBudgetSplitSection
              form={form}
              travelers={activeTravelers}
              onChange={(updater) => setForm((current) => updater(current))}
            />
          ) : (
            <p className="bookings-budget-empty">
              {t("bookings.budget.noAmount")}
            </p>
          )}

          <label className="mt-3 block w-full max-w-full min-w-0 text-sm font-semibold text-ink">
            {t("common.notes")}
            <textarea
              name="booking-notes"
              autoComplete="off"
              value={form.notes ?? ""}
              onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
              className="bookings-textarea"
              placeholder={t("bookings.form.notesPlaceholder")}
            />
          </label>

          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <button
              type="submit"
              disabled={submitting}
              className="itinerary-action-button itinerary-action-button--primary box-border w-full max-w-full disabled:opacity-60 sm:w-auto"
            >
              {submitting ? t("common.saving") : editingId ? t("bookings.saveChanges") : t("bookings.addBookingButton")}
            </button>
            <button
              type="button"
              onClick={resetForm}
              disabled={submitting}
              className="itinerary-action-button itinerary-action-button--ghost box-border w-full max-w-full disabled:opacity-60 sm:w-auto"
            >
              {editingId ? t("bookings.cancelEdit") : t("bookings.closeForm")}
            </button>
          </div>
        </form>
      ) : null}

      {notice ? (
        <p
          role="status"
          aria-live="polite"
          className="bookings-inline-status bookings-inline-status--success"
        >
          {notice}
        </p>
      ) : null}

      {error ? (
        <div
          role="alert"
          className="bookings-inline-status bookings-inline-status--error flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
        >
          <p>{error}</p>
          <button
            type="button"
            onClick={() => void loadBookings()}
            disabled={loading}
            className="itinerary-action-button itinerary-action-button--ghost disabled:opacity-60"
          >
            {loading ? t("common.retrying") : t("common.retry")}
          </button>
        </div>
      ) : null}

      {loading ? (
        <p role="status" aria-live="polite" className="bookings-loading-card">
          {t("bookings.loading")}
        </p>
      ) : null}

      {!loading && visibleBookings.length === 0 ? (
        <p className="bookings-empty-card">
          {t("bookings.empty")}
        </p>
      ) : null}

      {!loading && visibleBookings.length > 0 ? (
        <section className="bookings-list-card" aria-label={t("page.bookings.title")}>
          <div className="bookings-card-grid">
            {visibleBookings.map((booking) => (
              <BookingCard
                key={booking.id}
                booking={booking}
                budgetExpense={budgetExpenseByBooking.get(booking.id)}
                deletingId={deletingId}
                canEdit={canEdit}
                onEdit={startEditing}
                onDelete={removeBooking}
              />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}

function BookingCard({
  booking,
  budgetExpense,
  deletingId,
  canEdit,
  onEdit,
  onDelete
}: {
  booking: SharedBooking;
  budgetExpense?: SharedExpense;
  deletingId: string | null;
  canEdit: boolean;
  onEdit: (booking: SharedBooking) => void;
  onDelete: (booking: SharedBooking) => Promise<void>;
}) {
  const { language, t } = useLanguage();

  return (
    <article className="bookings-item-card">
      <div className="bookings-item-card__header">
        <div className="bookings-item-card__title">
          <p>
            {translateOption(language, booking.category)}
          </p>
          <h3>{booking.description}</h3>
          <div>
            <span>{booking.date}</span>
            <span>{booking.location ?? t("common.tbc")}</span>
          </div>
        </div>
        <div className="bookings-item-card__side">
          <StatusBadge status={booking.status} />
          <ActionButtons
            booking={booking}
            deletingId={deletingId}
            canEdit={canEdit}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        </div>
      </div>
      <dl className="bookings-item-card__details">
        <Field label={t("bookings.form.bookedBy")} value={booking.bookedBy} />
        <div>
          <dt>{t("common.amount")}</dt>
          <dd className="mt-1">
            <BookingAmount booking={booking} budgetExpense={budgetExpense} />
          </dd>
        </div>
      </dl>
      {booking.notes ? <p className="bookings-item-card__notes">{booking.notes}</p> : null}
    </article>
  );
}

function BookingAmount({
  booking,
  budgetExpense
}: {
  booking: SharedBooking;
  budgetExpense?: SharedExpense;
}) {
  const { t } = useLanguage();

  if (!booking.amount || !booking.currency) {
    return <span className="bookings-amount bookings-amount--empty">{t("common.tbc")}</span>;
  }

  return (
    <div className="bookings-amount">
      <span>{formatMoney(booking.amount, booking.currency)}</span>
      {budgetExpense ? (
        <a
          href="/budget"
          className="bookings-budget-link"
        >
          {t("bookings.budget.inBudget")}
        </a>
      ) : null}
    </div>
  );
}

function BookingBudgetSplitSection({
  form,
  travelers,
  onChange
}: {
  form: BookingInput;
  travelers: Traveler[];
  onChange: (updater: (current: BookingInput) => BookingInput) => void;
}) {
  const { language, t } = useLanguage();
  const travelerOptions = travelers.map((traveler) => traveler.id);
  const travelerLabels = new Map(travelers.map((traveler) => [traveler.id, traveler.name]));

  return (
    <section className="bookings-budget-split">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-terracotta">
            {t("bookings.budget.title")}
          </p>
          <p className="mt-1 text-sm text-zinc-600">{t("bookings.budget.description")}</p>
        </div>
      </div>

      <div className="mt-3 grid min-w-0 grid-cols-1 gap-3 md:grid-cols-2">
        <SelectField
          name="booking-budget-paid-by"
          label={t("budget.form.paidBy")}
          value={form.budgetPaidByTravelerId ?? ""}
          options={travelerOptions}
          optionLabels={travelerLabels}
          onChange={(value) => onChange((current) => ({ ...current, budgetPaidByTravelerId: value }))}
        />
        <label className="bookings-checkbox-card self-end">
          <input
            type="checkbox"
            name="booking-budget-settled"
            checked={Boolean(form.budgetSettled)}
            onChange={(event) => onChange((current) => ({ ...current, budgetSettled: event.target.checked }))}
            className="h-4 w-4 shrink-0 rounded border-zinc-300"
          />
          <span>{translateOption(language, "Settled")}</span>
        </label>
      </div>

      <fieldset className="bookings-split-fieldset">
        <legend className="px-1 text-sm font-semibold text-ink">{t("budget.form.splitAmong")}</legend>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          {travelers.map((traveler) => (
            <label key={traveler.id} className="bookings-checkbox-row">
              <input
                type="checkbox"
                name="booking-budget-split-traveler"
                checked={form.budgetSplitTravelerIds?.includes(traveler.id) ?? false}
                onChange={(event) =>
                  onChange((current) => ({
                    ...current,
                    budgetSplitTravelerIds: event.target.checked
                      ? Array.from(new Set([...(current.budgetSplitTravelerIds ?? []), traveler.id]))
                      : (current.budgetSplitTravelerIds ?? []).filter((travelerId) => travelerId !== traveler.id)
                  }))
                }
                className="h-4 w-4 shrink-0 rounded border-zinc-300"
              />
              <span className="min-w-0 truncate">{traveler.name}</span>
            </label>
          ))}
        </div>
      </fieldset>
    </section>
  );
}

function SummaryPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="bookings-stat-pill">
      <small>{label}</small>
      <strong>{value}</strong>
    </div>
  );
}

function FilterChip({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`bookings-chip ${active ? "bookings-chip--active" : ""}`}
    >
      {label}
    </button>
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
    <label className="bookings-field">
      {label}
      <select
        name={name}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="bookings-input"
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
    <label className="bookings-field">
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
        className="bookings-input"
      />
    </label>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

function ActionButtons({
  booking,
  deletingId,
  canEdit,
  onEdit,
  onDelete
}: {
  booking: SharedBooking;
  deletingId: string | null;
  canEdit: boolean;
  onEdit: (booking: SharedBooking) => void;
  onDelete: (booking: SharedBooking) => Promise<void>;
}) {
  const { t } = useLanguage();

  return (
    <div className="bookings-card-actions">
      <button
        type="button"
        onClick={() => onEdit(booking)}
        data-edit-required={!canEdit ? "true" : undefined}
        title={!canEdit ? "Private trip access is required to edit bookings." : undefined}
        className="itinerary-action-button itinerary-action-button--ghost"
      >
        {t("common.edit")}
      </button>
      {canEdit ? (
        <button
          type="button"
          onClick={() => void onDelete(booking)}
          disabled={deletingId === booking.id}
          className="itinerary-action-button itinerary-action-button--danger disabled:opacity-60"
        >
          {deletingId === booking.id ? t("common.deleting") : t("common.delete")}
        </button>
      ) : null}
    </div>
  );
}

async function fetchBookingsJson(
  url: string,
  options: RequestInit | undefined,
  fallbackMessage: string
): Promise<{ bookings: SharedBooking[] }> {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), requestTimeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    const data = (await response.json()) as { bookings?: SharedBooking[]; error?: string };

    if (!response.ok) {
      throw new Error(data.error ?? fallbackMessage);
    }

    if (!Array.isArray(data.bookings)) {
      throw new Error(fallbackMessage);
    }

    return {
      bookings: data.bookings
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

function orderTravelers(travelers: Traveler[]) {
  return travelers.slice().sort((a, b) => a.displayOrder - b.displayOrder);
}

function activeBookingTravelers(travelers: Traveler[]) {
  const activeTravelers = orderTravelers(travelers).filter((traveler) => traveler.isActive !== false);
  return activeTravelers.length > 0 ? activeTravelers : orderTravelers(travelers);
}

function findTravelerIdByName(name: string, travelers: Traveler[]) {
  const normalizedName = name.trim().toLowerCase();
  return travelers.find((traveler) => {
    const names = [traveler.id, traveler.name, traveler.displayName ?? ""].map((current) =>
      current.trim().toLowerCase()
    );
    return names.includes(normalizedName);
  })?.id;
}

function hasBudgetAmount(form: BookingInput) {
  return typeof form.amount === "number" && Number.isFinite(form.amount) && form.amount > 0 && Boolean(form.currency);
}

function ensureBookingBudgetDefaults(form: BookingInput, travelers: Traveler[]) {
  const eligibleTravelers = activeBookingTravelers(travelers);
  const eligibleTravelerIds = eligibleTravelers.map((traveler) => traveler.id);
  const selectedSplitIds =
    form.budgetSplitTravelerIds?.filter((travelerId) => eligibleTravelerIds.includes(travelerId)) ?? [];
  const paidByTravelerId = eligibleTravelerIds.includes(form.budgetPaidByTravelerId ?? "")
    ? form.budgetPaidByTravelerId
    : findTravelerIdByName(form.bookedBy, eligibleTravelers) ?? eligibleTravelerIds[0] ?? null;

  return {
    ...form,
    budgetPaidByTravelerId: paidByTravelerId,
    budgetSplitTravelerIds: selectedSplitIds.length > 0 ? selectedSplitIds : eligibleTravelerIds,
    budgetSettled: Boolean(form.budgetSettled)
  };
}

function bookingToForm(
  booking: SharedBooking,
  budgetExpense: SharedExpense | undefined,
  travelers: Traveler[],
  currencyOptions: readonly SharedCurrency[]
) {
  const currency = booking.currency && currencyOptions.includes(booking.currency) ? booking.currency : currencyOptions[0];

  return ensureBookingBudgetDefaults(
    {
      category: booking.category,
      description: booking.description,
      date: booking.date,
      location: booking.location ?? "",
      bookedBy: booking.bookedBy,
      amount: booking.amount,
      currency,
      notes: booking.notes ?? "",
      status: booking.status,
      budgetPaidByTravelerId: budgetExpense?.paidByTravelerId,
      budgetSplitTravelerIds: budgetExpense?.splitTravelerIds,
      budgetSettled: budgetExpense?.settled ?? false
    },
    travelers
  );
}

function withAllowedCurrency(form: BookingInput, currencyOptions: readonly SharedCurrency[]) {
  if (form.currency && currencyOptions.includes(form.currency)) {
    return form;
  }

  return { ...form, currency: currencyOptions[0] };
}
