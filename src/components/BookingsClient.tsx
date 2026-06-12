"use client";

import { Fragment, useEffect, useMemo, useState, type FormEvent } from "react";
import { StatusBadge } from "@/components/StatusBadge";
import { formatMoney } from "@/lib/budget";
import {
  bookingCategories,
  bookingCurrencies,
  bookingStatuses,
  expenseCategories,
  type BookingInput,
  type ExpenseCategory,
  type ExpenseInput,
  type SharedBooking,
  type SharedCurrency,
  type SharedExpense
} from "@/lib/sharedDataTypes";
import type { Traveler } from "@/data/tripData";

type BookingsClientProps = {
  participants: string[];
};

type FilterValue = "All";

type ExpensesApiResponse = {
  expenses?: SharedExpense[];
  travelers?: Traveler[];
  error?: string;
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

const emptyForm = (bookedBy: string): BookingInput => ({
  category: "Hotel",
  description: "",
  date: "",
  location: "",
  bookedBy,
  amount: null,
  currency: "EUR",
  notes: "",
  status: "Pending"
});

function emptyExpenseForm(booking: SharedBooking, travelers: Traveler[]): ExpenseFormState {
  const orderedTravelers = orderTravelers(travelers);

  return {
    title: booking.description,
    amount: booking.amount === null || booking.amount === undefined ? "" : String(booking.amount),
    currency: booking.currency ?? "EUR",
    category: mapBookingCategoryToExpenseCategory(booking.category),
    expenseDate: booking.date,
    paidByTravelerId: orderedTravelers[0]?.id ?? "person_a",
    splitTravelerIds: orderedTravelers.map((traveler) => traveler.id),
    settled: false,
    notes: ""
  };
}

export function BookingsClient({ participants }: BookingsClientProps) {
  const [bookings, setBookings] = useState<SharedBooking[]>([]);
  const [expenses, setExpenses] = useState<SharedExpense[]>([]);
  const [travelers, setTravelers] = useState<Traveler[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<FilterValue | SharedBooking["category"]>("All");
  const [statusFilter, setStatusFilter] = useState<FilterValue | SharedBooking["status"]>("All");
  const [bookedByFilter, setBookedByFilter] = useState<FilterValue | string>("All");
  const [form, setForm] = useState<BookingInput>(() => emptyForm(participants[0] ?? "Person A"));
  const [editingId, setEditingId] = useState<string | null>(null);
  const [expenseFormBookingId, setExpenseFormBookingId] = useState<string | null>(null);
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);
  const [expenseForm, setExpenseForm] = useState<ExpenseFormState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [expenseSubmitting, setExpenseSubmitting] = useState(false);
  const [deletingExpenseId, setDeletingExpenseId] = useState<string | null>(null);

  const visibleBookings = useMemo(
    () =>
      bookings.filter((booking) => {
        const categoryMatches = categoryFilter === "All" || booking.category === categoryFilter;
        const statusMatches = statusFilter === "All" || booking.status === statusFilter;
        const ownerMatches = bookedByFilter === "All" || booking.bookedBy === bookedByFilter;
        return categoryMatches && statusMatches && ownerMatches;
      }),
    [bookedByFilter, bookings, categoryFilter, statusFilter]
  );

  const incompleteCount = bookings.filter((booking) =>
    ["Not Booked", "Pending", "Need Confirmation"].includes(booking.status)
  ).length;

  const orderedTravelers = useMemo(() => orderTravelers(travelers), [travelers]);
  const travelerNameById = useMemo(
    () => new Map(orderedTravelers.map((traveler) => [traveler.id, traveler.name])),
    [orderedTravelers]
  );
  const linkedExpensesByBooking = useMemo(() => {
    const groups = new Map<string, SharedExpense[]>();

    for (const expense of expenses) {
      if (expense.sourceType !== "booking" || !expense.sourceId) {
        continue;
      }

      const current = groups.get(expense.sourceId) ?? [];
      current.push(expense);
      groups.set(expense.sourceId, current);
    }

    return groups;
  }, [expenses]);

  async function loadBookings() {
    setLoading(true);
    setError(null);
    setNotice(null);

    try {
      const [bookingsData, expensesData] = await Promise.all([
        fetchBookingsJson("/api/bookings", undefined, "Unable to load bookings."),
        fetchExpensesJson("/api/expenses", undefined, "Unable to load linked expenses.")
      ]);

      setBookings(bookingsData.bookings ?? []);
      setExpenses(expensesData.expenses);
      setTravelers(expensesData.travelers);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load bookings.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadBookings();
  }, []);

  function resetForm() {
    setEditingId(null);
    setForm(emptyForm(participants[0] ?? "Person A"));
  }

  function resetExpenseForm() {
    setExpenseFormBookingId(null);
    setEditingExpenseId(null);
    setExpenseForm(null);
  }

  function startEditing(booking: SharedBooking) {
    setEditingId(booking.id);
    setForm({
      category: booking.category,
      description: booking.description,
      date: booking.date,
      location: booking.location ?? "",
      bookedBy: booking.bookedBy,
      amount: booking.amount,
      currency: booking.currency ?? "EUR",
      notes: booking.notes ?? "",
      status: booking.status
    });
    setNotice(null);
  }

  function openExpenseForm(booking: SharedBooking) {
    setExpenseFormBookingId(booking.id);
    setEditingExpenseId(null);
    setExpenseForm(emptyExpenseForm(booking, travelers));
    setNotice(null);
    setError(null);
  }

  function startExpenseEditing(expense: SharedExpense) {
    if (expense.sourceType !== "booking" || !expense.sourceId) {
      return;
    }

    setExpenseFormBookingId(expense.sourceId);
    setEditingExpenseId(expense.id);
    setExpenseForm({
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
    setNotice(null);
    setError(null);
  }

  async function submitBooking(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!form.description.trim()) {
      setError("Description is required.");
      return;
    }

    if (!form.date) {
      setError("Date is required.");
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
        "Unable to save booking."
      );

      setBookings(data.bookings ?? []);
      setNotice(editingId ? "Updated booking." : "Added booking.");
      resetForm();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to save booking.");
    } finally {
      setSubmitting(false);
    }
  }

  async function submitExpense(booking: SharedBooking, event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!expenseForm) {
      return;
    }

    const input = buildExpenseInput(booking, expenseForm);
    if (!input.title) {
      setError("Expense title is required.");
      return;
    }

    if (!Number.isFinite(input.amount) || input.amount <= 0) {
      setError("Expense amount must be greater than zero.");
      return;
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(input.expenseDate)) {
      setError("Expense date is required.");
      return;
    }

    if (input.splitTravelerIds.length === 0) {
      setError("Select at least one traveler to split this expense.");
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
        editingExpenseId ? "Unable to update linked expense." : "Unable to add linked expense."
      );
      setExpenses(data.expenses);
      setTravelers(data.travelers);
      setNotice(editingExpenseId ? "Updated linked expense." : "Added linked expense.");
      resetExpenseForm();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to save linked expense.");
    } finally {
      setExpenseSubmitting(false);
    }
  }

  async function removeBooking(booking: SharedBooking) {
    setDeletingId(booking.id);
    setError(null);
    setNotice(null);

    try {
      const data = await fetchBookingsJson(
        `/api/bookings/${booking.id}`,
        { method: "DELETE" },
        "Unable to delete booking."
      );

      setBookings(data.bookings ?? []);
      setNotice("Deleted booking.");
      if (editingId === booking.id) {
        resetForm();
      }
      if (expenseFormBookingId === booking.id) {
        resetExpenseForm();
      }
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Unable to delete booking.");
    } finally {
      setDeletingId(null);
    }
  }

  async function removeExpense(expense: SharedExpense) {
    if (expense.sourceType !== "booking") {
      return;
    }

    if (!window.confirm(`Delete "${expense.title}" from linked booking expenses?`)) {
      return;
    }

    setDeletingExpenseId(expense.id);
    setError(null);
    setNotice(null);

    try {
      const data = await fetchExpensesJson(
        `/api/expenses/${expense.id}`,
        { method: "DELETE" },
        "Unable to delete linked expense."
      );
      setExpenses(data.expenses);
      setTravelers(data.travelers);
      setNotice("Deleted linked expense.");
      if (editingExpenseId === expense.id) {
        resetExpenseForm();
      }
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Unable to delete linked expense.");
    } finally {
      setDeletingExpenseId(null);
    }
  }

  return (
    <div className="w-full max-w-full min-w-0 space-y-5">
      <div className="grid gap-3 sm:grid-cols-3">
        <SummaryPill label="Total items" value={String(bookings.length)} />
        <SummaryPill label="Need action" value={String(incompleteCount)} />
        <SummaryPill label="Visible" value={String(visibleBookings.length)} />
      </div>

      <form
        onSubmit={submitBooking}
        className="box-border w-full max-w-full min-w-0 rounded-lg border border-zinc-200 bg-white p-4 shadow-soft"
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-terracotta">
              {editingId ? "Edit booking" : "Add booking"}
            </p>
            <h2 className="mt-1 text-xl font-semibold text-ink">
              {editingId ? "Update shared booking details" : "Create a shared booking item"}
            </h2>
          </div>
          {editingId ? (
            <button
              type="button"
              onClick={resetForm}
              className="rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold text-ink"
            >
              Cancel edit
            </button>
          ) : null}
        </div>

        <div className="mt-4 grid min-w-0 grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
          <SelectField
            label="Category"
            value={form.category}
            options={bookingCategories}
            onChange={(value) => setForm((current) => ({ ...current, category: value as BookingInput["category"] }))}
          />
          <TextField
            label="Description"
            value={form.description}
            onChange={(value) => setForm((current) => ({ ...current, description: value }))}
            placeholder="Rome hotel booking"
          />
          <TextField
            label="Date"
            type="date"
            value={form.date}
            onChange={(value) => setForm((current) => ({ ...current, date: value }))}
          />
          <TextField
            label="Location"
            value={form.location ?? ""}
            onChange={(value) => setForm((current) => ({ ...current, location: value }))}
            placeholder="Rome"
          />
          <SelectField
            label="Booked by"
            value={form.bookedBy}
            options={participants}
            onChange={(value) => setForm((current) => ({ ...current, bookedBy: value }))}
          />
          <TextField
            label="Amount"
            type="number"
            value={form.amount === null || form.amount === undefined ? "" : String(form.amount)}
            onChange={(value) =>
              setForm((current) => ({ ...current, amount: value ? Number(value) : null }))
            }
            placeholder="0"
          />
          <SelectField
            label="Currency"
            value={form.currency ?? "EUR"}
            options={bookingCurrencies}
            onChange={(value) => setForm((current) => ({ ...current, currency: value as BookingInput["currency"] }))}
          />
          <SelectField
            label="Status"
            value={form.status}
            options={bookingStatuses}
            onChange={(value) => setForm((current) => ({ ...current, status: value as BookingInput["status"] }))}
          />
        </div>

        <label className="mt-3 block w-full max-w-full min-w-0 text-sm font-semibold text-ink">
          Notes
          <textarea
            value={form.notes ?? ""}
            onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
            className="mt-2 block box-border min-h-24 w-full max-w-full min-w-0 rounded-md border border-zinc-200 bg-white px-3 py-2 text-base text-zinc-700 sm:text-sm"
            placeholder="Safe notes only. Do not paste private confirmation numbers."
          />
        </label>

        <button
          type="submit"
          disabled={submitting}
          className="mt-4 w-full max-w-full rounded-md bg-moss px-3 py-2 text-base font-semibold text-white disabled:opacity-60 sm:w-auto sm:text-sm"
        >
          {submitting ? "Saving..." : editingId ? "Save changes" : "Add booking"}
        </button>
      </form>

      <div className="grid gap-3 rounded-lg border border-zinc-200 bg-white p-3 sm:grid-cols-3">
        <SelectField
          label="Category"
          value={categoryFilter}
          options={["All", ...bookingCategories]}
          onChange={(value) => setCategoryFilter(value as typeof categoryFilter)}
        />
        <SelectField
          label="Status"
          value={statusFilter}
          options={["All", ...bookingStatuses]}
          onChange={(value) => setStatusFilter(value as typeof statusFilter)}
        />
        <SelectField
          label="Booked by"
          value={bookedByFilter}
          options={["All", ...participants]}
          onChange={(value) => setBookedByFilter(value)}
        />
      </div>

      {notice ? (
        <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          {notice}
        </p>
      ) : null}

      {error ? (
        <div className="flex flex-col gap-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 sm:flex-row sm:items-center sm:justify-between">
          <p>{error}</p>
          <button
            type="button"
            onClick={() => void loadBookings()}
            disabled={loading}
            className="rounded-md border border-red-200 bg-white px-3 py-2 text-sm font-semibold text-red-700 disabled:opacity-60"
          >
            {loading ? "Retrying..." : "Retry"}
          </button>
        </div>
      ) : null}

      {loading ? <p className="text-sm text-zinc-600">Loading bookings...</p> : null}

      {!loading && visibleBookings.length === 0 ? (
        <p className="rounded-lg border border-zinc-200 bg-white px-4 py-8 text-sm text-zinc-600 shadow-soft">
          No bookings match this filter yet.
        </p>
      ) : null}

      <div className="hidden overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-soft lg:block">
        <table className="w-full text-left text-sm">
          <thead className="bg-zinc-50 text-xs uppercase tracking-[0.08em] text-zinc-500">
            <tr>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Description</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Owner</th>
              <th className="px-4 py-3">Amount</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200">
            {visibleBookings.map((booking) => {
              const bookingExpenses = linkedExpensesByBooking.get(booking.id) ?? [];
              const activeExpenseForm = expenseFormBookingId === booking.id ? expenseForm : null;

              return (
                <Fragment key={booking.id}>
                  <tr>
                    <td className="px-4 py-4 font-medium text-ink">{booking.category}</td>
                    <td className="px-4 py-4">
                      <p className="font-medium text-ink">{booking.description}</p>
                      <p className="mt-1 text-zinc-500">{booking.location ?? booking.notes ?? "TBC"}</p>
                    </td>
                    <td className="px-4 py-4 text-zinc-600">{booking.date}</td>
                    <td className="px-4 py-4 text-zinc-600">{booking.bookedBy}</td>
                    <td className="px-4 py-4 text-zinc-600">
                      {booking.amount && booking.currency
                        ? formatMoney(booking.amount, booking.currency)
                        : "TBC"}
                    </td>
                    <td className="px-4 py-4">
                      <StatusBadge status={booking.status} />
                    </td>
                    <td className="px-4 py-4">
                      <ActionButtons
                        booking={booking}
                        deletingId={deletingId}
                        onEdit={startEditing}
                        onDelete={removeBooking}
                      />
                    </td>
                  </tr>
                  <tr>
                    <td colSpan={7} className="bg-zinc-50 px-4 py-4">
                      <BookingExpensesSection
                        booking={booking}
                        expenses={bookingExpenses}
                        travelers={orderedTravelers}
                        travelerNameById={travelerNameById}
                        expenseForm={activeExpenseForm}
                        editingExpenseId={editingExpenseId}
                        expenseSubmitting={expenseSubmitting}
                        deletingExpenseId={deletingExpenseId}
                        onAddExpense={openExpenseForm}
                        onEditExpense={startExpenseEditing}
                        onDeleteExpense={removeExpense}
                        onSubmitExpense={submitExpense}
                        onCancelExpense={resetExpenseForm}
                        onExpenseFormChange={(updater) =>
                          setExpenseForm((current) => (current ? updater(current) : current))
                        }
                      />
                    </td>
                  </tr>
                </Fragment>
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
            expenses={linkedExpensesByBooking.get(booking.id) ?? []}
            travelers={orderedTravelers}
            travelerNameById={travelerNameById}
            expenseForm={expenseFormBookingId === booking.id ? expenseForm : null}
            editingExpenseId={editingExpenseId}
            expenseSubmitting={expenseSubmitting}
            deletingId={deletingId}
            deletingExpenseId={deletingExpenseId}
            onEdit={startEditing}
            onDelete={removeBooking}
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
    </div>
  );
}

function BookingCard({
  booking,
  expenses,
  travelers,
  travelerNameById,
  expenseForm,
  editingExpenseId,
  expenseSubmitting,
  deletingId,
  deletingExpenseId,
  onEdit,
  onDelete,
  onAddExpense,
  onEditExpense,
  onDeleteExpense,
  onSubmitExpense,
  onCancelExpense,
  onExpenseFormChange
}: {
  booking: SharedBooking;
  expenses: SharedExpense[];
  travelers: Traveler[];
  travelerNameById: Map<string, string>;
  expenseForm: ExpenseFormState | null;
  editingExpenseId: string | null;
  expenseSubmitting: boolean;
  deletingId: string | null;
  deletingExpenseId: string | null;
  onEdit: (booking: SharedBooking) => void;
  onDelete: (booking: SharedBooking) => Promise<void>;
  onAddExpense: (booking: SharedBooking) => void;
  onEditExpense: (expense: SharedExpense) => void;
  onDeleteExpense: (expense: SharedExpense) => Promise<void>;
  onSubmitExpense: (booking: SharedBooking, event: FormEvent<HTMLFormElement>) => Promise<void>;
  onCancelExpense: () => void;
  onExpenseFormChange: (updater: (current: ExpenseFormState) => ExpenseFormState) => void;
}) {
  return (
    <article className="rounded-lg border border-zinc-200 bg-white p-4 shadow-soft">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-zinc-500">
            {booking.category}
          </p>
          <h2 className="mt-1 break-words text-lg font-semibold text-ink">{booking.description}</h2>
        </div>
        <StatusBadge status={booking.status} />
      </div>
      <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <Field label="Date" value={booking.date} />
        <Field label="Location" value={booking.location ?? "TBC"} />
        <Field label="Booked by" value={booking.bookedBy} />
        <Field
          label="Amount"
          value={
            booking.amount && booking.currency
              ? formatMoney(booking.amount, booking.currency)
              : "TBC"
          }
        />
      </dl>
      {booking.notes ? <p className="mt-3 break-words text-sm leading-6 text-zinc-600">{booking.notes}</p> : null}
      <div className="mt-4">
        <ActionButtons
          booking={booking}
          deletingId={deletingId}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      </div>
      <BookingExpensesSection
        booking={booking}
        expenses={expenses}
        travelers={travelers}
        travelerNameById={travelerNameById}
        expenseForm={expenseForm}
        editingExpenseId={editingExpenseId}
        expenseSubmitting={expenseSubmitting}
        deletingExpenseId={deletingExpenseId}
        onAddExpense={onAddExpense}
        onEditExpense={onEditExpense}
        onDeleteExpense={onDeleteExpense}
        onSubmitExpense={onSubmitExpense}
        onCancelExpense={onCancelExpense}
        onExpenseFormChange={onExpenseFormChange}
      />
    </article>
  );
}

function BookingExpensesSection({
  booking,
  expenses,
  travelers,
  travelerNameById,
  expenseForm,
  editingExpenseId,
  expenseSubmitting,
  deletingExpenseId,
  onAddExpense,
  onEditExpense,
  onDeleteExpense,
  onSubmitExpense,
  onCancelExpense,
  onExpenseFormChange
}: {
  booking: SharedBooking;
  expenses: SharedExpense[];
  travelers: Traveler[];
  travelerNameById: Map<string, string>;
  expenseForm: ExpenseFormState | null;
  editingExpenseId: string | null;
  expenseSubmitting: boolean;
  deletingExpenseId: string | null;
  onAddExpense: (booking: SharedBooking) => void;
  onEditExpense: (expense: SharedExpense) => void;
  onDeleteExpense: (expense: SharedExpense) => Promise<void>;
  onSubmitExpense: (booking: SharedBooking, event: FormEvent<HTMLFormElement>) => Promise<void>;
  onCancelExpense: () => void;
  onExpenseFormChange: (updater: (current: ExpenseFormState) => ExpenseFormState) => void;
}) {
  return (
    <section className="mt-4 rounded-lg border border-zinc-200 bg-white p-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-terracotta">
            Linked expenses
          </p>
          <p className="mt-1 text-sm text-zinc-600">
            These are real ledger expenses for this booking. Booking amount stays separate.
          </p>
        </div>
        <button
          type="button"
          onClick={() => onAddExpense(booking)}
          className="w-full max-w-full rounded-md bg-moss px-3 py-2 text-sm font-semibold text-white sm:w-auto"
        >
          Add expense
        </button>
      </div>

      {expenseForm ? (
        <BookingExpenseForm
          booking={booking}
          form={expenseForm}
          travelers={travelers}
          editingExpenseId={editingExpenseId}
          submitting={expenseSubmitting}
          onSubmit={onSubmitExpense}
          onCancel={onCancelExpense}
          onChange={onExpenseFormChange}
        />
      ) : null}

      <div className="mt-3 grid gap-3">
        {expenses.length === 0 ? (
          <p className="rounded-lg bg-zinc-50 px-3 py-4 text-sm text-zinc-600">
            No linked expenses yet.
          </p>
        ) : null}
        {expenses.map((expense) => (
          <BookingExpenseCard
            key={expense.id}
            expense={expense}
            travelerNameById={travelerNameById}
            deletingExpenseId={deletingExpenseId}
            onEdit={onEditExpense}
            onDelete={onDeleteExpense}
          />
        ))}
      </div>
    </section>
  );
}

function BookingExpenseForm({
  booking,
  form,
  travelers,
  editingExpenseId,
  submitting,
  onSubmit,
  onCancel,
  onChange
}: {
  booking: SharedBooking;
  form: ExpenseFormState;
  travelers: Traveler[];
  editingExpenseId: string | null;
  submitting: boolean;
  onSubmit: (booking: SharedBooking, event: FormEvent<HTMLFormElement>) => Promise<void>;
  onCancel: () => void;
  onChange: (updater: (current: ExpenseFormState) => ExpenseFormState) => void;
}) {
  return (
    <form
      onSubmit={(event) => void onSubmit(booking, event)}
      className="mt-3 box-border w-full max-w-full min-w-0 overflow-hidden rounded-lg border border-zinc-200 bg-zinc-50 p-3"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-zinc-500">
            {editingExpenseId ? "Edit linked expense" : "Add linked expense"}
          </p>
          <h4 className="mt-1 text-base font-semibold text-ink">
            {editingExpenseId ? "Update booking ledger item" : "Create booking ledger item"}
          </h4>
        </div>
        {booking.amount !== null && booking.currency ? (
          <p className="rounded-md bg-white px-3 py-2 text-xs font-medium text-zinc-600">
            Booking amount: {formatMoney(booking.amount, booking.currency)}
          </p>
        ) : null}
      </div>

      <div className="mt-3 grid min-w-0 grid-cols-1 gap-3 md:grid-cols-2">
        <TextField
          label="Title"
          value={form.title}
          onChange={(value) => onChange((current) => ({ ...current, title: value }))}
          placeholder={booking.description}
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

      <fieldset className="mt-3 min-w-0 rounded-lg border border-zinc-200 bg-white p-3">
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
          {submitting ? "Saving..." : editingExpenseId ? "Save expense" : "Add expense"}
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

function BookingExpenseCard({
  expense,
  travelerNameById,
  deletingExpenseId,
  onEdit,
  onDelete
}: {
  expense: SharedExpense;
  travelerNameById: Map<string, string>;
  deletingExpenseId: string | null;
  onEdit: (expense: SharedExpense) => void;
  onDelete: (expense: SharedExpense) => Promise<void>;
}) {
  return (
    <article className="rounded-lg border border-zinc-200 bg-zinc-50 p-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold text-ink">{expense.title}</p>
            <ExpenseStatusPill settled={expense.settled} />
          </div>
          <p className="mt-1 text-xs uppercase tracking-[0.08em] text-zinc-500">
            {expense.category} - {expense.expenseDate}
          </p>
        </div>
        <p className="shrink-0 text-sm font-semibold text-ink">
          {formatMoney(expense.amount, expense.currency)}
        </p>
      </div>
      <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
        <Field
          label="Paid by"
          value={travelerNameById.get(expense.paidByTravelerId) ?? expense.paidByTravelerId}
        />
        <Field
          label="Split among"
          value={expense.splitTravelerIds
            .map((travelerId) => travelerNameById.get(travelerId) ?? travelerId)
            .join(", ")}
        />
      </dl>
      {expense.notes ? <p className="mt-2 break-words text-sm leading-6 text-zinc-600">{expense.notes}</p> : null}
      <div className="mt-3 flex flex-wrap gap-2">
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
          disabled={deletingExpenseId === expense.id}
          className="rounded-md border border-red-200 bg-white px-3 py-2 text-sm font-semibold text-red-700 disabled:opacity-60"
        >
          {deletingExpenseId === expense.id ? "Deleting..." : "Delete"}
        </button>
      </div>
    </article>
  );
}

function SummaryPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-4 shadow-soft">
      <p className="text-xs font-semibold uppercase tracking-[0.08em] text-zinc-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-ink">{value}</p>
    </div>
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
  onEdit,
  onDelete
}: {
  booking: SharedBooking;
  deletingId: string | null;
  onEdit: (booking: SharedBooking) => void;
  onDelete: (booking: SharedBooking) => Promise<void>;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        onClick={() => onEdit(booking)}
        className="rounded-md border border-zinc-200 bg-white px-2 py-1 text-xs font-semibold text-ink"
      >
        Edit
      </button>
      <button
        type="button"
        onClick={() => void onDelete(booking)}
        disabled={deletingId === booking.id}
        className="rounded-md border border-red-200 bg-white px-2 py-1 text-xs font-semibold text-red-700 disabled:opacity-60"
      >
        {deletingId === booking.id ? "Deleting..." : "Delete"}
      </button>
    </div>
  );
}

function ExpenseStatusPill({ settled }: { settled: boolean }) {
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

function buildExpenseInput(booking: SharedBooking, form: ExpenseFormState): ExpenseInput {
  return {
    sourceType: "booking",
    sourceId: booking.id,
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

function mapBookingCategoryToExpenseCategory(category: SharedBooking["category"]): ExpenseCategory {
  switch (category) {
    case "Flight":
      return "Flight";
    case "Hotel":
      return "Accommodation";
    case "Train":
      return "Transport";
    case "Attraction":
      return "Attraction";
    case "Restaurant":
      return "Food";
    case "Insurance":
      return "Insurance";
    default:
      return "Other";
  }
}

function orderTravelers(travelers: Traveler[]) {
  return travelers.slice().sort((a, b) => a.displayOrder - b.displayOrder);
}
