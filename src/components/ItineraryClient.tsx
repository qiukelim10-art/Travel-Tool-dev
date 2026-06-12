"use client";

import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import { formatMoney } from "@/lib/budget";
import {
  bookingCurrencies,
  type ItineraryInput,
  type SharedCurrency,
  type SharedItineraryItem
} from "@/lib/sharedDataTypes";

const cityFilters = ["All", "Rome", "Vatican City", "Florence", "Venice", "Milan"] as const;
const requestTimeoutMs = 10000;
const monthLabels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

type CityFilter = (typeof cityFilters)[number];
type DateFilter = "All";
type ItineraryApiResponse = {
  itineraryItems?: SharedItineraryItem[];
  error?: string;
};

const emptyForm = (): ItineraryInput => ({
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
  currency: "EUR",
  notes: "",
  mapQuery: "",
  sortOrder: 0
});

export function ItineraryClient() {
  const [items, setItems] = useState<SharedItineraryItem[]>([]);
  const [selectedCity, setSelectedCity] = useState<CityFilter>("All");
  const [selectedDate, setSelectedDate] = useState<DateFilter | string>("All");
  const [form, setForm] = useState<ItineraryInput>(() => emptyForm());
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const dateOptions = useMemo(
    () => Array.from(new Set(items.map((item) => item.travelDate))).sort(),
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

  async function loadItems() {
    setLoading(true);
    setError(null);
    setNotice(null);

    try {
      const data = await fetchItineraryJson("/api/itinerary", undefined, "Unable to load itinerary.");
      setItems(data.itineraryItems ?? []);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load itinerary.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadItems();
  }, []);

  function resetForm() {
    setEditingId(null);
    setForm(emptyForm());
    setFormOpen(false);
  }

  function openAddForm() {
    setEditingId(null);
    setForm(emptyForm());
    setFormOpen(true);
    setNotice(null);
  }

  function startEditing(item: SharedItineraryItem) {
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
      costAmount: item.costAmount,
      currency: item.currency,
      notes: item.notes ?? "",
      mapQuery: item.mapQuery ?? "",
      sortOrder: item.sortOrder
    });
    setFormOpen(true);
    setNotice(null);
  }

  async function submitItem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!form.travelDate) {
      setError("Date is required.");
      return;
    }

    if (!form.city.trim()) {
      setError("City is required.");
      return;
    }

    if (!form.title.trim()) {
      setError("Title is required.");
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
        "Unable to save itinerary item."
      );
      setItems(data.itineraryItems ?? []);
      const hiddenByFilters =
        (selectedDate !== "All" && selectedDate !== savedDate) ||
        (selectedCity !== "All" && selectedCity !== savedCity);
      setNotice(
        hiddenByFilters
          ? "Saved. It may be hidden by the current city or date filter."
          : "Saved itinerary item."
      );
      resetForm();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to save itinerary item.");
    } finally {
      setSubmitting(false);
    }
  }

  async function removeItem(item: SharedItineraryItem) {
    if (!window.confirm(`Delete "${item.title}" from the itinerary?`)) {
      return;
    }

    setDeletingId(item.id);
    setError(null);

    try {
      const data = await fetchItineraryJson(
        `/api/itinerary/${item.id}`,
        { method: "DELETE" },
        "Unable to delete itinerary item."
      );
      setItems(data.itineraryItems ?? []);
      setNotice("Deleted itinerary item.");
      if (editingId === item.id) {
        resetForm();
      }
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Unable to delete itinerary item.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="w-full max-w-full min-w-0 space-y-5">
      <div className="flex w-full max-w-full min-w-0 flex-col gap-3 rounded-lg border border-zinc-200 bg-white p-3 shadow-soft md:flex-row md:items-center md:justify-between">
        <div className="flex max-w-full min-w-0 gap-2 overflow-x-auto pb-1 md:pb-0">
          {cityFilters.map((city) => (
            <button
              key={city}
              type="button"
              onClick={() => setSelectedCity(city)}
              className={`shrink-0 rounded-md border px-3 py-2 text-sm font-semibold ${
                selectedCity === city
                  ? "border-moss bg-moss text-white"
                  : "border-zinc-200 bg-white text-zinc-700"
              }`}
            >
              {city}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={formOpen ? resetForm : openAddForm}
          className="w-full max-w-full rounded-md bg-moss px-3 py-2 text-sm font-semibold text-white sm:w-auto"
        >
          {formOpen ? "Close form" : "Add itinerary item"}
        </button>
      </div>

      <div className="flex max-w-full min-w-0 gap-2 overflow-x-auto pb-1">
        <button
          type="button"
          onClick={() => setSelectedDate("All")}
          className={`shrink-0 rounded-md border px-3 py-2 text-sm font-semibold ${
            selectedDate === "All"
              ? "border-moss bg-moss text-white"
              : "border-zinc-200 bg-white text-zinc-700"
          }`}
        >
          All dates
        </button>
        {dateOptions.map((date) => (
          <button
            key={date}
            type="button"
            onClick={() => setSelectedDate(date)}
            className={`shrink-0 rounded-md border px-3 py-2 text-sm font-semibold ${
              selectedDate === date
                ? "border-moss bg-moss text-white"
                : "border-zinc-200 bg-white text-zinc-700"
            }`}
          >
            {formatDateLabel(date)}
          </button>
        ))}
      </div>

      {formOpen ? (
        <form
          onSubmit={submitItem}
          className="itinerary-form box-border w-full max-w-full min-w-0 overflow-hidden rounded-lg border border-zinc-200 bg-white p-4 shadow-soft"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-terracotta">
                {editingId ? "Edit itinerary item" : "Add itinerary item"}
              </p>
              <h2 className="mt-1 text-xl font-semibold text-ink">
                {editingId ? "Update the shared plan" : "Create a shared plan entry"}
              </h2>
            </div>
            {editingId ? (
              <button
                type="button"
                onClick={resetForm}
                className="max-w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold text-ink"
              >
                Cancel edit
              </button>
            ) : null}
          </div>

          <div className="mt-4 grid min-w-0 grid-cols-1 gap-3 md:grid-cols-2">
            <TextField
              label="Date"
              type="date"
              value={form.travelDate}
              onChange={(value) => setForm((current) => ({ ...current, travelDate: value }))}
            />
            <TextField
              label="City"
              value={form.city}
              onChange={(value) => setForm((current) => ({ ...current, city: value }))}
              placeholder="Rome"
            />
            <TextField
              label="Start time"
              type="time"
              value={form.startTime ?? ""}
              onChange={(value) => setForm((current) => ({ ...current, startTime: value }))}
            />
            <TextField
              label="End time"
              type="time"
              value={form.endTime ?? ""}
              onChange={(value) => setForm((current) => ({ ...current, endTime: value }))}
            />
            <TextField
              label="Title"
              value={form.title}
              onChange={(value) => setForm((current) => ({ ...current, title: value }))}
              placeholder="Colosseum timed entry"
            />
            <TextField
              label="Location"
              value={form.location ?? ""}
              onChange={(value) => setForm((current) => ({ ...current, location: value }))}
              placeholder="Colosseum, Rome"
            />
            <TextField
              label="Cost amount"
              type="number"
              value={form.costAmount === null || form.costAmount === undefined ? "" : String(form.costAmount)}
              onChange={(value) =>
                setForm((current) => ({ ...current, costAmount: value ? Number(value) : null }))
              }
              placeholder="0"
            />
            <SelectField
              label="Currency"
              value={form.currency ?? "EUR"}
              options={bookingCurrencies}
              onChange={(value) => setForm((current) => ({ ...current, currency: value as SharedCurrency }))}
            />
            <TextField
              label="Map search query"
              value={form.mapQuery ?? ""}
              onChange={(value) => setForm((current) => ({ ...current, mapQuery: value }))}
              placeholder="Colosseum Rome"
            />
            <TextField
              label="Sort order"
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
              label="Details"
              value={form.details ?? ""}
              onChange={(value) => setForm((current) => ({ ...current, details: value }))}
              placeholder={"**Morning plan**\n- Colosseum timed entry\n- Roman Forum walk"}
            />
            <TextareaField
              label="Transport"
              value={form.transport ?? ""}
              onChange={(value) => setForm((current) => ({ ...current, transport: value }))}
              placeholder="- Metro to Colosseo"
            />
            <TextareaField
              label="Meal"
              value={form.meal ?? ""}
              onChange={(value) => setForm((current) => ({ ...current, meal: value }))}
              placeholder="- Lunch near Monti"
            />
            <TextareaField
              label="Notes"
              value={form.notes ?? ""}
              onChange={(value) => setForm((current) => ({ ...current, notes: value }))}
              placeholder="Safe notes only. Avoid private confirmation numbers."
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="mt-4 box-border w-full max-w-full rounded-md bg-moss px-3 py-2 text-base font-semibold text-white disabled:opacity-60 sm:w-auto sm:text-sm"
          >
            {submitting ? "Saving..." : editingId ? "Save changes" : "Add item"}
          </button>
        </form>
      ) : null}

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
            onClick={() => void loadItems()}
            disabled={loading}
            className="rounded-md border border-red-200 bg-white px-3 py-2 text-sm font-semibold text-red-700 disabled:opacity-60"
          >
            {loading ? "Retrying..." : "Retry"}
          </button>
        </div>
      ) : null}

      {loading ? <p className="text-sm text-zinc-600">Loading itinerary...</p> : null}

      {!loading && visibleItems.length === 0 ? (
        <p className="rounded-lg border border-zinc-200 bg-white px-4 py-8 text-sm text-zinc-600 shadow-soft">
          No itinerary items match this filter yet.
        </p>
      ) : null}

      <div className="space-y-5">
        {groupedItems.map((group) => (
          <section key={group.date} className="space-y-3">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-semibold text-ink">{group.date}</h2>
              <span className="h-px flex-1 bg-zinc-200" />
            </div>
            <div className="grid gap-3">
              {group.items.map((item) => (
                <ItineraryCard
                  key={item.id}
                  item={item}
                  deletingId={deletingId}
                  onEdit={startEditing}
                  onDelete={removeItem}
                />
              ))}
            </div>
          </section>
        ))}
      </div>
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
  const [, month, day] = date.split("-");
  const monthIndex = Number(month) - 1;
  const monthLabel = monthLabels[monthIndex] ?? month;
  return `${monthLabel} ${day}`;
}

function ItineraryCard({
  item,
  deletingId,
  onEdit,
  onDelete
}: {
  item: SharedItineraryItem;
  deletingId: string | null;
  onEdit: (item: SharedItineraryItem) => void;
  onDelete: (item: SharedItineraryItem) => Promise<void>;
}) {
  const mapsQuery = item.mapQuery || item.location;

  return (
    <article className="rounded-lg border border-zinc-200 bg-white p-4 shadow-soft">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-terracotta">
            {formatTimeRange(item)}
          </p>
          <h3 className="mt-1 text-xl font-semibold text-ink">{item.title}</h3>
          <div className="mt-2 flex flex-wrap gap-2 text-sm text-zinc-600">
            <span>{item.city}</span>
            {item.location ? <span>- {item.location}</span> : null}
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <button
            type="button"
            onClick={() => onEdit(item)}
            className="rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold text-ink"
          >
            Edit
          </button>
          <button
            type="button"
            onClick={() => void onDelete(item)}
            disabled={deletingId === item.id}
            className="rounded-md border border-red-200 bg-white px-3 py-2 text-sm font-semibold text-red-700 disabled:opacity-60"
          >
            {deletingId === item.id ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-3">
          <RichTextBlock title="Details" value={item.details} />
          <RichTextBlock title="Notes" value={item.notes} />
        </div>
        <aside className="space-y-3 rounded-lg border border-zinc-200 bg-zinc-50 p-3">
          <RichTextBlock title="Transport" value={item.transport} />
          <RichTextBlock title="Meal" value={item.meal} />
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-zinc-500">Cost</p>
            <p className="mt-1 text-sm text-zinc-700">
              {item.costAmount !== null ? formatMoney(item.costAmount, item.currency) : "TBC"}
            </p>
          </div>
          {mapsQuery ? (
            <a
              href={googleMapsSearchUrl(mapsQuery)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex rounded-md bg-moss px-3 py-2 text-sm font-semibold text-white"
            >
              Open in Google Maps
            </a>
          ) : null}
        </aside>
      </div>
    </article>
  );
}

function formatTimeRange(item: SharedItineraryItem) {
  if (item.startTime && item.endTime) {
    return `${item.startTime}-${item.endTime}`;
  }

  return item.startTime || "Flexible time";
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
  type?: "date" | "number" | "text" | "time";
}) {
  return (
    <label className="block w-full max-w-full min-w-0 text-sm font-semibold text-ink">
      {label}
      <input
        type={type}
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
  label,
  value,
  onChange,
  placeholder
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block w-full max-w-full min-w-0 text-sm font-semibold text-ink">
      {label}
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="mt-2 block box-border min-h-28 w-full max-w-full min-w-0 resize-y rounded-md border border-zinc-200 bg-white px-3 py-2 text-base text-zinc-700 sm:text-sm"
      />
    </label>
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
