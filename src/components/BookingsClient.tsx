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
      setError("Editor mode is required to edit bookings.");
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
      setError("Editor mode is required to add bookings.");
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
      setError("Editor mode is required to save bookings.");
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
      setError("Editor mode is required to delete bookings.");
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
    <div className="w-full max-w-full min-w-0 space-y-5">
      <div className="status-strip grid grid-cols-3 gap-2 p-2">
        <SummaryPill label={t("bookings.summary.total")} value={String(bookings.length)} />
        <SummaryPill label={t("bookings.summary.needAction")} value={String(incompleteCount)} />
        <SummaryPill label={t("common.visible")} value={String(visibleBookings.length)} />
      </div>

      {!formOpen ? (
        <section className="travel-panel p-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-stamp">
                {t("bookings.editor.eyebrow")}
              </p>
              <p className="mt-1 text-sm text-zinc-600">
                {t("bookings.editor.description")}
              </p>
            </div>
            <button
              type="button"
              onClick={openAddForm}
              disabled={!canEdit}
              className="w-full max-w-full rounded-md bg-moss px-3 py-2 text-sm font-semibold text-white sm:w-auto"
            >
              {t("bookings.addItem")}
            </button>
          </div>
        </section>
      ) : (
        <form
          ref={bookingFormRef}
          onSubmit={submitBooking}
          className="mobile-safe-form box-border w-full max-w-full min-w-0 rounded-lg border border-zinc-200 bg-white p-4 shadow-soft"
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
            <button
              type="button"
              onClick={resetForm}
              className="rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold text-ink"
            >
              {editingId ? t("bookings.cancelEdit") : t("bookings.closeForm")}
            </button>
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
            <p className="mt-3 rounded-md bg-zinc-50 px-3 py-2 text-sm text-zinc-600">
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
              className="mt-2 block box-border min-h-24 w-full max-w-full min-w-0 rounded-md border border-zinc-200 bg-white px-3 py-2 text-base text-zinc-700 sm:text-sm"
              placeholder={t("bookings.form.notesPlaceholder")}
            />
          </label>

          <button
            type="submit"
            disabled={submitting}
            className="mt-4 w-full max-w-full rounded-md bg-moss px-3 py-2 text-base font-semibold text-white disabled:opacity-60 sm:w-auto sm:text-sm"
          >
            {submitting ? t("common.saving") : editingId ? t("bookings.saveChanges") : t("bookings.addBookingButton")}
          </button>
        </form>
      )}

      <div className="travel-panel grid gap-3 p-3 sm:grid-cols-3">
        <SelectField
          name="booking-filter-category"
          label={t("common.category")}
          value={categoryFilter}
          options={["All", ...bookingCategories]}
          formatOption={(option) => translateOption(language, option)}
          onChange={(value) => setCategoryFilter(value as typeof categoryFilter)}
        />
        <SelectField
          name="booking-filter-status"
          label={t("common.status")}
          value={statusFilter}
          options={["All", ...bookingStatuses]}
          formatOption={(option) => translateOption(language, option)}
          onChange={(value) => setStatusFilter(value as typeof statusFilter)}
        />
        <SelectField
          name="booking-filter-booked-by"
          label={t("bookings.form.bookedBy")}
          value={bookedByFilter}
          options={["All", ...bookingOwnerOptions]}
          formatOption={(option) => (option === "All" ? translateOption(language, option) : option)}
          onChange={(value) => setBookedByFilter(value)}
        />
      </div>

      {notice ? (
        <p
          role="status"
          aria-live="polite"
          className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800"
        >
          {notice}
        </p>
      ) : null}

      {error ? (
        <div
          role="alert"
          className="flex flex-col gap-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 sm:flex-row sm:items-center sm:justify-between"
        >
          <p>{error}</p>
          <button
            type="button"
            onClick={() => void loadBookings()}
            disabled={loading}
            className="rounded-md border border-red-200 bg-white px-3 py-2 text-sm font-semibold text-red-700 disabled:opacity-60"
          >
            {loading ? t("common.retrying") : t("common.retry")}
          </button>
        </div>
      ) : null}

      {loading ? (
        <p role="status" aria-live="polite" className="text-sm text-zinc-600">
          {t("bookings.loading")}
        </p>
      ) : null}

      {!loading && visibleBookings.length === 0 ? (
        <p className="rounded-lg border border-zinc-200 bg-white px-4 py-8 text-sm text-zinc-600 shadow-soft">
          {t("bookings.empty")}
        </p>
      ) : null}

      <div className="hidden overflow-hidden rounded-lg border border-route/15 bg-white shadow-soft lg:block">
        <table className="w-full text-left text-sm">
          <thead className="bg-sky/35 text-xs uppercase tracking-[0.08em] text-zinc-500">
            <tr>
              <th className="px-4 py-3">{t("common.category")}</th>
              <th className="px-4 py-3">{t("common.description")}</th>
              <th className="px-4 py-3">{t("common.date")}</th>
              <th className="px-4 py-3">{t("common.owner")}</th>
              <th className="px-4 py-3">{t("common.amount")}</th>
              <th className="px-4 py-3">{t("common.status")}</th>
              <th className="px-4 py-3">{t("common.actions")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200">
            {visibleBookings.map((booking) => {
              const budgetExpense = budgetExpenseByBooking.get(booking.id);

              return (
                <tr key={booking.id}>
                  <td className="px-4 py-4 font-medium text-ink">{translateOption(language, booking.category)}</td>
                  <td className="px-4 py-4">
                    <p className="font-medium text-ink">{booking.description}</p>
                    <p className="mt-1 text-zinc-500">{booking.location ?? booking.notes ?? t("common.tbc")}</p>
                  </td>
                  <td className="px-4 py-4 text-zinc-600">{booking.date}</td>
                  <td className="px-4 py-4 text-zinc-600">{booking.bookedBy}</td>
                  <td className="px-4 py-4 text-zinc-600">
                    <BookingAmount booking={booking} budgetExpense={budgetExpense} />
                  </td>
                  <td className="px-4 py-4">
                    <StatusBadge status={booking.status} />
                  </td>
                  <td className="px-4 py-4">
                    <ActionButtons
                      booking={booking}
                      deletingId={deletingId}
                      canEdit={canEdit}
                      onEdit={startEditing}
                      onDelete={removeBooking}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="grid gap-3 lg:hidden">
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
    <article className="travel-panel p-3 sm:p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-stamp">
            {translateOption(language, booking.category)}
          </p>
          <h2 className="mt-1 break-words text-lg font-semibold text-ink">{booking.description}</h2>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2">
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
      <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
        <Field label={t("common.date")} value={booking.date} />
        <Field label={t("common.location")} value={booking.location ?? t("common.tbc")} />
        <Field label={t("bookings.form.bookedBy")} value={booking.bookedBy} />
        <div className="min-w-0">
          <dt className="text-xs font-semibold uppercase tracking-[0.08em] text-zinc-500">{t("common.amount")}</dt>
          <dd className="mt-1">
            <BookingAmount booking={booking} budgetExpense={budgetExpense} />
          </dd>
        </div>
      </dl>
      {booking.notes ? <p className="mt-2 break-words text-sm leading-6 text-zinc-600">{booking.notes}</p> : null}
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
    return <span className="text-zinc-600">{t("common.tbc")}</span>;
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <span className="font-medium text-zinc-700">{formatMoney(booking.amount, booking.currency)}</span>
      {budgetExpense ? (
        <a
          href="/budget"
          className="inline-flex rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-800 ring-1 ring-emerald-200"
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
    <section className="mt-3 rounded-lg border border-route/15 bg-zinc-50 p-3">
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
        <label className="flex min-w-0 items-center gap-2 self-end rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold text-ink">
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

      <fieldset className="mt-3 min-w-0 rounded-lg border border-zinc-200 bg-white p-3">
        <legend className="px-1 text-sm font-semibold text-ink">{t("budget.form.splitAmong")}</legend>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          {travelers.map((traveler) => (
            <label key={traveler.id} className="flex min-w-0 items-center gap-2 text-sm text-zinc-700">
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
    <div className="compact-stat">
      <p className="min-h-8 break-words text-[0.65rem] font-semibold uppercase leading-4 tracking-[0.08em] text-zinc-500 sm:min-h-0 sm:text-xs">
        {label}
      </p>
      <p className="mt-1 text-xl font-semibold text-ink sm:text-2xl">{value}</p>
    </div>
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

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs font-semibold uppercase tracking-[0.08em] text-zinc-500">{label}</dt>
      <dd className="mt-1 break-words text-zinc-700">{value}</dd>
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

  if (!canEdit) {
    return null;
  }

  return (
    <div className="flex flex-wrap justify-end gap-1.5">
      <button
        type="button"
        onClick={() => onEdit(booking)}
        className="rounded-md border border-zinc-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-ink sm:px-3 sm:py-2 sm:text-sm"
      >
        {t("common.edit")}
      </button>
      <button
        type="button"
        onClick={() => void onDelete(booking)}
        disabled={deletingId === booking.id}
        className="rounded-md border border-red-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-red-700 disabled:opacity-60 sm:px-3 sm:py-2 sm:text-sm"
      >
        {deletingId === booking.id ? t("common.deleting") : t("common.delete")}
      </button>
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
