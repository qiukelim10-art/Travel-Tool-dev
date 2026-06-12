"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { StatusBadge } from "@/components/StatusBadge";
import { formatMoney } from "@/lib/budget";
import {
  bookingCategories,
  bookingCurrencies,
  bookingStatuses,
  type BookingInput,
  type SharedBooking
} from "@/lib/sharedDataTypes";

type BookingsClientProps = {
  participants: string[];
};

type FilterValue = "All";

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

export function BookingsClient({ participants }: BookingsClientProps) {
  const [bookings, setBookings] = useState<SharedBooking[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<FilterValue | SharedBooking["category"]>("All");
  const [statusFilter, setStatusFilter] = useState<FilterValue | SharedBooking["status"]>("All");
  const [bookedByFilter, setBookedByFilter] = useState<FilterValue | string>("All");
  const [form, setForm] = useState<BookingInput>(() => emptyForm(participants[0] ?? "Person A"));
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

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

  async function loadBookings() {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/bookings");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Unable to load bookings.");
      }

      setBookings(data.bookings ?? []);
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

    try {
      const response = await fetch(editingId ? `/api/bookings/${editingId}` : "/api/bookings", {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Unable to save booking.");
      }

      setBookings(data.bookings ?? []);
      resetForm();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to save booking.");
    } finally {
      setSubmitting(false);
    }
  }

  async function removeBooking(booking: SharedBooking) {
    setDeletingId(booking.id);
    setError(null);

    try {
      const response = await fetch(`/api/bookings/${booking.id}`, { method: "DELETE" });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Unable to delete booking.");
      }

      setBookings(data.bookings ?? []);
      if (editingId === booking.id) {
        resetForm();
      }
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Unable to delete booking.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-3">
        <SummaryPill label="Total items" value={String(bookings.length)} />
        <SummaryPill label="Need action" value={String(incompleteCount)} />
        <SummaryPill label="Visible" value={String(visibleBookings.length)} />
      </div>

      <form onSubmit={submitBooking} className="rounded-lg border border-zinc-200 bg-white p-4 shadow-soft">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
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

        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
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

        <label className="mt-3 block text-sm font-semibold text-ink">
          Notes
          <textarea
            value={form.notes ?? ""}
            onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
            className="mt-2 min-h-24 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-700"
            placeholder="Safe notes only. Do not paste private confirmation numbers."
          />
        </label>

        <button
          type="submit"
          disabled={submitting}
          className="mt-4 rounded-md bg-moss px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"
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

      {error ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
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
            {visibleBookings.map((booking) => (
              <tr key={booking.id}>
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
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid gap-3 lg:hidden">
        {visibleBookings.map((booking) => (
          <article key={booking.id} className="rounded-lg border border-zinc-200 bg-white p-4 shadow-soft">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-zinc-500">
                  {booking.category}
                </p>
                <h2 className="mt-1 text-lg font-semibold text-ink">{booking.description}</h2>
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
            {booking.notes ? <p className="mt-3 text-sm leading-6 text-zinc-600">{booking.notes}</p> : null}
            <div className="mt-4">
              <ActionButtons
                booking={booking}
                deletingId={deletingId}
                onEdit={startEditing}
                onDelete={removeBooking}
              />
            </div>
          </article>
        ))}
      </div>
    </div>
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
  onChange
}: {
  label: string;
  value: string;
  options: readonly string[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="text-sm font-semibold text-ink">
      {label}
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-700"
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
    <label className="text-sm font-semibold text-ink">
      {label}
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        min={type === "number" ? "0" : undefined}
        step={type === "number" ? "0.01" : undefined}
        className="mt-2 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-700"
      />
    </label>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-[0.08em] text-zinc-500">{label}</dt>
      <dd className="mt-1 text-zinc-700">{value}</dd>
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
