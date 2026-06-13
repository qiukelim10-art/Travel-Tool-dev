"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { DashboardCard } from "@/components/DashboardCard";
import type { Traveler } from "@/data/tripData";
import { useLanguage } from "@/lib/i18n";
import { translateOption } from "@/lib/localize";
import {
  buildDefaultPackingStatuses,
  packingCategories,
  packingPriorities,
  packingTravelerStatuses,
  type PackingCategory,
  type PackingInput,
  type PackingPriority,
  type PackingTravelerStatus,
  type SharedPackingItem
} from "@/lib/sharedDataTypes";

type PackingClientProps = {
  travelers: Traveler[];
};

type FilterValue = "All";
type StatusFilter = "All" | "Incomplete only" | "Completed only" | "Unassigned only";
type OverallStatus = "Pending" | "Completed" | "Not assigned";

const PACKING_FETCH_TIMEOUT_MS = 10000;

const statusClass: Record<PackingTravelerStatus, string> = {
  required: "bg-amber-100 text-amber-800 ring-amber-200",
  packed: "bg-emerald-100 text-emerald-800 ring-emerald-200",
  not_needed: "bg-zinc-100 text-zinc-700 ring-zinc-200"
};

const priorityClass: Record<PackingPriority, string> = {
  High: "bg-red-100 text-red-800 ring-red-200",
  Medium: "bg-amber-100 text-amber-800 ring-amber-200",
  Low: "bg-zinc-100 text-zinc-700 ring-zinc-200"
};

const overallClass: Record<OverallStatus, string> = {
  Pending: "bg-amber-100 text-amber-800 ring-amber-200",
  Completed: "bg-emerald-100 text-emerald-800 ring-emerald-200",
  "Not assigned": "bg-zinc-100 text-zinc-700 ring-zinc-200"
};

function emptyForm(): PackingInput {
  return {
    name: "",
    category: "Documents",
    priority: "Medium",
    notes: "",
    quantity: null,
    sortOrder: 0,
    statuses: buildDefaultPackingStatuses("Documents")
  };
}

function getOverallStatus(item: SharedPackingItem): OverallStatus {
  const activeStatuses = item.statuses.filter((status) => status.status !== "not_needed");

  if (activeStatuses.length === 0) {
    return "Not assigned";
  }

  return activeStatuses.every((status) => status.status === "packed") ? "Completed" : "Pending";
}

function isPackingResponse(data: unknown): data is { items: SharedPackingItem[] } {
  return (
    typeof data === "object" &&
    data !== null &&
    Array.isArray((data as { items?: unknown }).items)
  );
}

export function PackingClient({ travelers }: PackingClientProps) {
  const { language, t } = useLanguage();
  const sortedTravelers = useMemo(
    () => travelers.slice().sort((a, b) => a.displayOrder - b.displayOrder),
    [travelers]
  );
  const travelerNameById = useMemo(
    () => new Map(sortedTravelers.map((traveler) => [traveler.id, traveler.name])),
    [sortedTravelers]
  );

  const [items, setItems] = useState<SharedPackingItem[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<FilterValue | PackingCategory>("All");
  const [priorityFilter, setPriorityFilter] = useState<FilterValue | PackingPriority>("All");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("All");
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<PackingInput>(() => emptyForm());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const requiredPeopleItems = items.reduce(
    (count, item) =>
      count + item.statuses.filter((status) => status.status !== "not_needed").length,
    0
  );
  const packedPeopleItems = items.reduce(
    (count, item) => count + item.statuses.filter((status) => status.status === "packed").length,
    0
  );
  const highPriorityCount = items.filter((item) => item.priority === "High").length;

  const visibleItems = useMemo(
    () =>
      items.filter((item) => {
        const categoryMatches = categoryFilter === "All" || item.category === categoryFilter;
        const priorityMatches = priorityFilter === "All" || item.priority === priorityFilter;
        const overallStatus = getOverallStatus(item);
        const statusMatches =
          statusFilter === "All" ||
          (statusFilter === "Incomplete only" && overallStatus === "Pending") ||
          (statusFilter === "Completed only" && overallStatus === "Completed") ||
          (statusFilter === "Unassigned only" && overallStatus === "Not assigned");

        return categoryMatches && priorityMatches && statusMatches;
      }),
    [categoryFilter, items, priorityFilter, statusFilter]
  );

  const groupedItems = packingCategories
    .map((category) => ({
      category,
      items: visibleItems.filter((item) => item.category === category)
    }))
    .filter((group) => group.items.length > 0);

  async function loadItems() {
    setLoading(true);
    setError(null);
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), PACKING_FETCH_TIMEOUT_MS);

    try {
      const response = await fetch("/api/packing", {
        cache: "no-store",
        signal: controller.signal
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? t("packing.errorLoad"));
      }

      if (!isPackingResponse(data)) {
        throw new Error(t("packing.errorUnexpected"));
      }

      setItems(data.items);
    } catch (loadError) {
      setError(
        loadError instanceof Error && loadError.name === "AbortError"
          ? t("packing.errorTimeout")
          : loadError instanceof Error
            ? loadError.message
            : t("packing.errorLoad")
      );
    } finally {
      window.clearTimeout(timeoutId);
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

  function openNewForm() {
    setEditingId(null);
    setForm(emptyForm());
    setFormOpen(true);
  }

  function startEditing(item: SharedPackingItem) {
    setEditingId(item.id);
    setForm({
      name: item.name,
      category: item.category,
      priority: item.priority,
      notes: item.notes ?? "",
      quantity: item.quantity,
      sortOrder: item.sortOrder,
      statuses: item.statuses.map((status) => ({
        travelerId: status.travelerId,
        status: status.status
      }))
    });
    setFormOpen(true);
  }

  function changeCategory(category: PackingCategory) {
    setForm((current) => ({
      ...current,
      category,
      statuses: editingId ? current.statuses : buildDefaultPackingStatuses(category)
    }));
  }

  function applyCategoryDefault() {
    setForm((current) => ({
      ...current,
      statuses: buildDefaultPackingStatuses(current.category)
    }));
  }

  function changeTravelerStatus(travelerId: string, status: PackingTravelerStatus) {
    setForm((current) => ({
      ...current,
      statuses: sortedTravelers.map((traveler) => {
        if (traveler.id === travelerId) {
          return { travelerId, status };
        }

        return (
          current.statuses.find((currentStatus) => currentStatus.travelerId === traveler.id) ?? {
            travelerId: traveler.id,
            status: "required"
          }
        );
      })
    }));
  }

  async function submitPackingItem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!form.name.trim()) {
      setError(t("packing.validationName"));
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch(editingId ? `/api/packing/${editingId}` : "/api/packing", {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? t("packing.errorSave"));
      }

      setItems(data.items ?? []);
      resetForm();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : t("packing.errorSave"));
    } finally {
      setSubmitting(false);
    }
  }

  async function removeItem(item: SharedPackingItem) {
    if (!window.confirm(t("packing.confirmDelete"))) {
      return;
    }

    setDeletingId(item.id);
    setError(null);

    try {
      const response = await fetch(`/api/packing/${item.id}`, { method: "DELETE" });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? t("packing.errorDelete"));
      }

      setItems(data.items ?? []);
      if (editingId === item.id) {
        resetForm();
      }
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : t("packing.errorDelete"));
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <DashboardCard label={t("packing.summary.total")} value={String(items.length)} />
        <DashboardCard label={t("packing.summary.highPriority")} value={String(highPriorityCount)} />
        <DashboardCard label={t("packing.summary.requiredPeopleItems")} value={String(requiredPeopleItems)} />
        <DashboardCard label={t("packing.summary.packedProgress")} value={`${packedPeopleItems} / ${requiredPeopleItems}`} />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="grid flex-1 gap-3 rounded-lg border border-zinc-200 bg-white p-3 sm:grid-cols-3">
          <SelectField
            label={t("common.category")}
            value={categoryFilter}
            options={["All", ...packingCategories]}
            getOptionLabel={(value) => translateOption(language, value)}
            onChange={(value) => setCategoryFilter(value as typeof categoryFilter)}
          />
          <SelectField
            label={t("common.priority")}
            value={priorityFilter}
            options={["All", ...packingPriorities]}
            getOptionLabel={(value) => translateOption(language, value)}
            onChange={(value) => setPriorityFilter(value as typeof priorityFilter)}
          />
          <SelectField
            label={t("common.status")}
            value={statusFilter}
            options={["All", "Incomplete only", "Completed only", "Unassigned only"]}
            getOptionLabel={(value) => translateOption(language, value)}
            onChange={(value) => setStatusFilter(value as StatusFilter)}
          />
        </div>
        <button
          type="button"
          onClick={openNewForm}
          className="rounded-md bg-moss px-4 py-2 text-sm font-semibold text-white"
        >
          {t("packing.addItem")}
        </button>
      </div>

      {formOpen ? (
        <form onSubmit={submitPackingItem} className="rounded-lg border border-zinc-200 bg-white p-4 shadow-soft">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-terracotta">
                {editingId ? t("packing.editItem") : t("packing.addItemEyebrow")}
              </p>
              <h2 className="mt-1 text-xl font-semibold text-ink">
                {editingId ? t("packing.editTitle") : t("packing.addTitle")}
              </h2>
            </div>
            <button
              type="button"
              onClick={resetForm}
              className="rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold text-ink"
            >
              {t("common.cancel")}
            </button>
          </div>

          <div className="mt-4 grid min-w-0 gap-3 md:grid-cols-2">
            <TextField
              label={t("packing.form.itemName")}
              value={form.name}
              onChange={(value) => setForm((current) => ({ ...current, name: value }))}
              placeholder={t("packing.form.itemPlaceholder")}
            />
            <SelectField
              label={t("common.category")}
              value={form.category}
              options={packingCategories}
              getOptionLabel={(value) => translateOption(language, value)}
              onChange={(value) => changeCategory(value as PackingCategory)}
            />
            <SelectField
              label={t("common.priority")}
              value={form.priority}
              options={packingPriorities}
              getOptionLabel={(value) => translateOption(language, value)}
              onChange={(value) => setForm((current) => ({ ...current, priority: value as PackingPriority }))}
            />
            <TextField
              label={t("common.quantity")}
              type="number"
              value={form.quantity === null || form.quantity === undefined ? "" : String(form.quantity)}
              onChange={(value) =>
                setForm((current) => ({ ...current, quantity: value ? Number(value) : null }))
              }
              placeholder="1"
            />
            <TextField
              label={t("common.sortOrder")}
              type="number"
              value={String(form.sortOrder ?? 0)}
              onChange={(value) => setForm((current) => ({ ...current, sortOrder: value ? Number(value) : 0 }))}
              placeholder="0"
            />
          </div>

          <label className="mt-3 block text-sm font-semibold text-ink">
            {t("common.notes")}
            <textarea
              value={form.notes ?? ""}
              onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
              className="mt-2 min-h-24 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-700"
              placeholder={t("packing.form.notesPlaceholder")}
            />
          </label>

          <div className="mt-4 rounded-lg bg-zinc-50 p-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-ink">{t("packing.form.travelerStatuses")}</p>
                <p className="mt-1 text-xs text-zinc-500">
                  {t("packing.form.travelerStatusHint")}
                </p>
              </div>
              <button
                type="button"
                onClick={applyCategoryDefault}
                className="rounded-md border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold text-ink"
              >
                {t("packing.form.applyDefault")}
              </button>
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {sortedTravelers.map((traveler) => (
                <SelectField
                  key={traveler.id}
                  label={traveler.name}
                  value={
                    form.statuses.find((status) => status.travelerId === traveler.id)?.status ??
                    "required"
                  }
                  options={packingTravelerStatuses}
                  onChange={(value) => changeTravelerStatus(traveler.id, value as PackingTravelerStatus)}
                  getOptionLabel={(value) => translateOption(language, value)}
                />
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="mt-4 rounded-md bg-moss px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {submitting ? t("common.saving") : editingId ? t("bookings.saveChanges") : t("packing.addButton")}
          </button>
        </form>
      ) : null}

      {error ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          <p>{error}</p>
          <button
            type="button"
            onClick={() => void loadItems()}
            className="rounded-md border border-red-200 bg-white px-3 py-1.5 text-xs font-semibold text-red-700"
          >
            {t("common.retry")}
          </button>
        </div>
      ) : null}

      {loading ? <p className="text-sm text-zinc-600">{t("packing.loading")}</p> : null}

      {!loading && visibleItems.length === 0 ? (
        <p className="rounded-lg border border-zinc-200 bg-white px-4 py-8 text-sm text-zinc-600 shadow-soft">
          {t("packing.empty")}
        </p>
      ) : null}

      <div className="space-y-5">
        {groupedItems.map((group) => (
          <section key={group.category}>
            <h2 className="mb-3 text-lg font-semibold text-ink">{translateOption(language, group.category)}</h2>
            <div className="grid gap-3 lg:grid-cols-2">
              {group.items.map((item) => (
                <PackingItemCard
                  key={item.id}
                  item={item}
                  deletingId={deletingId}
                  travelerNameById={travelerNameById}
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

function PackingItemCard({
  item,
  deletingId,
  travelerNameById,
  onEdit,
  onDelete
}: {
  item: SharedPackingItem;
  deletingId: string | null;
  travelerNameById: Map<string, string>;
  onEdit: (item: SharedPackingItem) => void;
  onDelete: (item: SharedPackingItem) => Promise<void>;
}) {
  const { language, t } = useLanguage();
  const overallStatus = getOverallStatus(item);

  return (
    <article className="rounded-lg border border-zinc-200 bg-white p-4 shadow-soft">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded-full px-2 py-1 text-xs font-semibold ring-1 ${priorityClass[item.priority]}`}>
              {translateOption(language, item.priority)}
            </span>
            <span className={`rounded-full px-2 py-1 text-xs font-semibold ring-1 ${overallClass[overallStatus]}`}>
              {translateOption(language, overallStatus)}
            </span>
          </div>
          <h3 className="mt-2 text-lg font-semibold text-ink">{item.name}</h3>
          <p className="mt-1 text-sm text-zinc-500">{translateOption(language, item.category)}</p>
        </div>
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={() => onEdit(item)}
            className="rounded-md border border-zinc-200 bg-white px-2 py-1 text-xs font-semibold text-ink"
          >
            {t("common.edit")}
          </button>
          <button
            type="button"
            onClick={() => void onDelete(item)}
            disabled={deletingId === item.id}
            className="rounded-md border border-red-200 bg-white px-2 py-1 text-xs font-semibold text-red-700 disabled:opacity-60"
          >
            {deletingId === item.id ? t("common.deleting") : t("common.delete")}
          </button>
        </div>
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <Field label={t("common.quantity")} value={item.quantity === null ? t("common.tbc") : String(item.quantity)} />
        <Field label={t("common.sortOrder")} value={String(item.sortOrder)} />
      </dl>

      {item.notes ? <p className="mt-3 text-sm leading-6 text-zinc-600">{item.notes}</p> : null}

      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {item.statuses.map((status) => (
          <div key={status.travelerId} className="rounded-lg bg-zinc-50 p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-semibold text-ink">
                {travelerNameById.get(status.travelerId) ?? status.travelerId}
              </p>
              <span className={`rounded-full px-2 py-1 text-xs font-semibold ring-1 ${statusClass[status.status]}`}>
                {translateOption(language, status.status)}
              </span>
            </div>
            <p className="mt-1 text-xs text-zinc-500">
              {translateOption(language, status.status === "required" ? "Not packed yet" : status.status)}
            </p>
          </div>
        ))}
      </div>
    </article>
  );
}

function SelectField({
  label,
  value,
  options,
  onChange,
  getOptionLabel
}: {
  label: string;
  value: string;
  options: readonly string[];
  onChange: (value: string) => void;
  getOptionLabel?: (value: string) => string;
}) {
  return (
    <label className="min-w-0 text-sm font-semibold text-ink">
      {label}
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-700"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {getOptionLabel ? getOptionLabel(option) : option}
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
  type?: "number" | "text";
}) {
  return (
    <label className="min-w-0 text-sm font-semibold text-ink">
      {label}
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        min={type === "number" ? "0" : undefined}
        step={type === "number" ? "1" : undefined}
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
