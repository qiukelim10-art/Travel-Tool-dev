"use client";

import { useEffect, useMemo, useState, type FormEvent, type KeyboardEvent } from "react";
import type { Traveler } from "@/data/tripData";
import { useTripAccess } from "@/lib/access";
import { useLanguage } from "@/lib/i18n";
import { translateOption } from "@/lib/localize";
import {
  defaultPackingStatusForCategory,
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
  required: "packing-traveler-button--required",
  packed: "packing-traveler-button--packed",
  not_needed: "packing-traveler-button--not-needed"
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

function handleStatusMenuKeyboard(event: KeyboardEvent<HTMLDivElement>) {
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

function buildDefaultStatuses(category: PackingCategory, travelers: Traveler[]) {
  const status = defaultPackingStatusForCategory(category);
  return travelers.map((traveler) => ({
    travelerId: traveler.id,
    status
  }));
}

function emptyForm(travelers: Traveler[]): PackingInput {
  return {
    name: "",
    category: "Documents",
    priority: "Medium",
    notes: "",
    quantity: null,
    sortOrder: 0,
    statuses: buildDefaultStatuses("Documents", travelers)
  };
}

function getOverallStatus(item: SharedPackingItem): OverallStatus {
  const activeStatuses = item.statuses.filter((status) => status.status !== "not_needed");

  if (activeStatuses.length === 0) {
    return "Not assigned";
  }

  return activeStatuses.every((status) => status.status === "packed") ? "Completed" : "Pending";
}

function shortTravelerName(name: string) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 3);

  return initials || name.slice(0, 3);
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
  const { mode, selectedTravelerId } = useTripAccess();
  const canEdit = mode === "editor";
  const sortedTravelers = useMemo(
    () => travelers.slice().sort((a, b) => a.displayOrder - b.displayOrder),
    [travelers]
  );
  const activeTravelers = useMemo(
    () => sortedTravelers.filter((traveler) => traveler.isActive !== false),
    [sortedTravelers]
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
  const [form, setForm] = useState<PackingInput>(() => emptyForm(activeTravelers));
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [statusUpdatingId, setStatusUpdatingId] = useState<string | null>(null);

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
    setForm(emptyForm(activeTravelers));
    setFormOpen(false);
  }

  function openNewForm() {
    if (!canEdit) {
      setError("Editor mode is required to add packing items.");
      return;
    }

    setEditingId(null);
    setForm(emptyForm(activeTravelers));
    setFormOpen(true);
  }

  function startEditing(item: SharedPackingItem) {
    if (!canEdit) {
      setError("Editor mode is required to edit packing items.");
      return;
    }

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
      statuses: editingId ? current.statuses : buildDefaultStatuses(category, activeTravelers)
    }));
  }

  function applyCategoryDefault() {
    setForm((current) => ({
      ...current,
      statuses: buildDefaultStatuses(current.category, activeTravelers)
    }));
  }

  function changeTravelerStatus(travelerId: string, status: PackingTravelerStatus) {
    setForm((current) => ({
      ...current,
      statuses: activeTravelers.map((traveler) => {
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

    if (!canEdit) {
      setError("Editor mode is required to save packing items.");
      return;
    }

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
    if (!canEdit) {
      setError("Editor mode is required to delete packing items.");
      return;
    }

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

  async function updateTravelerStatus(
    item: SharedPackingItem,
    travelerId: string,
    status: PackingTravelerStatus
  ) {
    if (!canEdit && travelerId !== selectedTravelerId) {
      setError("Select a traveler identity before updating packing status.");
      return;
    }

    setStatusUpdatingId(`${item.id}:${travelerId}`);
    setError(null);

    try {
      const response = canEdit
        ? await fetch(`/api/packing/${item.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: item.name,
              category: item.category,
              priority: item.priority,
              notes: item.notes ?? "",
              quantity: item.quantity,
              sortOrder: item.sortOrder,
              statuses: item.statuses.map((currentStatus) => ({
                travelerId: currentStatus.travelerId,
                status: currentStatus.travelerId === travelerId ? status : currentStatus.status
              }))
            } satisfies PackingInput)
          })
        : await fetch(`/api/packing/${item.id}/status`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status })
          });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? t("packing.errorSave"));
      }

      setItems(data.items ?? []);
    } catch (statusError) {
      setError(statusError instanceof Error ? statusError.message : t("packing.errorSave"));
    } finally {
      setStatusUpdatingId(null);
    }
  }

  return (
    <div className="packing-workspace">
      <section className="packing-stats-strip" aria-label={t("page.packing.title")}>
        <PackingStat label={t("packing.summary.total")} value={String(items.length)} />
        <PackingStat label={t("packing.summary.highPriority")} value={String(highPriorityCount)} warm={highPriorityCount > 0} />
        <PackingStat label={t("packing.summary.requiredPeopleItems")} value={String(requiredPeopleItems)} />
        <PackingStat label={t("packing.summary.packedProgress")} value={`${packedPeopleItems} / ${requiredPeopleItems}`} />
      </section>

      <section className="packing-control-card" aria-label={t("page.packing.title")}>
        <div className="packing-control-card__header">
          <button
            type="button"
            onClick={openNewForm}
            disabled={!canEdit}
            className="itinerary-action-button itinerary-action-button--primary disabled:opacity-60"
          >
            {t("packing.addItem")}
          </button>
        </div>
        <div className="packing-filter-grid">
          <FilterChipGroup
            label={t("common.category")}
            value={categoryFilter}
            options={["All", ...packingCategories]}
            getOptionLabel={(value) => translateOption(language, value)}
            onChange={(value) => setCategoryFilter(value as typeof categoryFilter)}
          />
          <FilterChipGroup
            label={t("common.priority")}
            value={priorityFilter}
            options={["All", ...packingPriorities]}
            getOptionLabel={(value) => translateOption(language, value)}
            onChange={(value) => setPriorityFilter(value as typeof priorityFilter)}
          />
          <FilterChipGroup
            label={t("common.status")}
            value={statusFilter}
            options={["All", "Incomplete only", "Completed only", "Unassigned only"]}
            getOptionLabel={(value) => translateOption(language, value)}
            onChange={(value) => setStatusFilter(value as StatusFilter)}
          />
        </div>
      </section>

      {formOpen ? (
        <form
          onSubmit={submitPackingItem}
          className="packing-form packing-editor-card mobile-safe-form box-border w-full max-w-full min-w-0 overflow-hidden"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
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
              className="itinerary-action-button itinerary-action-button--ghost max-w-full"
            >
              {t("common.cancel")}
            </button>
          </div>

          <div className="mt-4 grid min-w-0 gap-3 md:grid-cols-2">
            <TextField
              name="packing-item-name"
              label={t("packing.form.itemName")}
              value={form.name}
              onChange={(value) => setForm((current) => ({ ...current, name: value }))}
              placeholder={t("packing.form.itemPlaceholder")}
            />
            <SelectField
              name="packing-category"
              label={t("common.category")}
              value={form.category}
              options={packingCategories}
              getOptionLabel={(value) => translateOption(language, value)}
              onChange={(value) => changeCategory(value as PackingCategory)}
            />
            <SelectField
              name="packing-priority"
              label={t("common.priority")}
              value={form.priority}
              options={packingPriorities}
              getOptionLabel={(value) => translateOption(language, value)}
              onChange={(value) => setForm((current) => ({ ...current, priority: value as PackingPriority }))}
            />
            <TextField
              name="packing-quantity"
              label={t("common.quantity")}
              type="number"
              value={form.quantity === null || form.quantity === undefined ? "" : String(form.quantity)}
              onChange={(value) =>
                setForm((current) => ({ ...current, quantity: value ? Number(value) : null }))
              }
              placeholder="1"
            />
            <TextField
              name="packing-sort-order"
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
              name="packing-notes"
              autoComplete="off"
              value={form.notes ?? ""}
              onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
              className="packing-textarea"
              placeholder={t("packing.form.notesPlaceholder")}
            />
          </label>

          <div className="packing-traveler-matrix">
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
                className="itinerary-action-button itinerary-action-button--ghost packing-small-action"
              >
                {t("packing.form.applyDefault")}
              </button>
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {activeTravelers.map((traveler) => (
                <SelectField
                  key={traveler.id}
                  name={`packing-traveler-${traveler.id}-status`}
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
            className="itinerary-action-button itinerary-action-button--primary mt-4 box-border w-full max-w-full disabled:opacity-60 sm:w-auto"
          >
            {submitting ? t("common.saving") : editingId ? t("bookings.saveChanges") : t("packing.addButton")}
          </button>
        </form>
      ) : null}

      {error ? (
        <div
          role="alert"
          className="packing-inline-status packing-inline-status--error flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
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
        <p role="status" aria-live="polite" className="packing-loading-card">
          {t("packing.loading")}
        </p>
      ) : null}

      {!loading && visibleItems.length === 0 ? (
        <p className="packing-empty-card">
          {t("packing.empty")}
        </p>
      ) : null}

      <section className="packing-category-list" aria-label={t("page.packing.title")}>
        {groupedItems.map((group) => (
          <section key={group.category} className="packing-category-section route-line">
            <div className="packing-category-section__header">
              <span className="route-dot" />
              <div>
                <p>{t("common.category")}</p>
                <h2>{translateOption(language, group.category)}</h2>
              </div>
              <span>{group.items.length}</span>
            </div>
            <div className="packing-category-section__cards">
              {group.items.map((item) => (
                <PackingItemCard
                  key={item.id}
                  item={item}
                  deletingId={deletingId}
                  statusUpdatingId={statusUpdatingId}
                  canEdit={canEdit}
                  selectedTravelerId={selectedTravelerId}
                  travelerNameById={travelerNameById}
                  onEdit={startEditing}
                  onDelete={removeItem}
                  onStatusChange={updateTravelerStatus}
                />
              ))}
            </div>
          </section>
        ))}
      </section>
    </div>
  );
}

function PackingItemCard({
  item,
  deletingId,
  statusUpdatingId,
  canEdit,
  selectedTravelerId,
  travelerNameById,
  onEdit,
  onDelete,
  onStatusChange
}: {
  item: SharedPackingItem;
  deletingId: string | null;
  statusUpdatingId: string | null;
  canEdit: boolean;
  selectedTravelerId: string;
  travelerNameById: Map<string, string>;
  onEdit: (item: SharedPackingItem) => void;
  onDelete: (item: SharedPackingItem) => Promise<void>;
  onStatusChange: (
    item: SharedPackingItem,
    travelerId: string,
    status: PackingTravelerStatus
  ) => Promise<void>;
}) {
  const { language, t } = useLanguage();
  const overallStatus = getOverallStatus(item);

  return (
    <article className="packing-item-card">
      <div className="packing-item-card__header">
        <div className="packing-item-card__title">
          <div className="packing-badge-row">
            <span className={`packing-badge ${priorityClass[item.priority]}`}>
              {translateOption(language, item.priority)}
            </span>
            <span className={`packing-badge ${overallClass[overallStatus]}`}>
              {translateOption(language, overallStatus)}
            </span>
            <span className="packing-badge packing-badge--category">
              {translateOption(language, item.category)}
            </span>
          </div>
          <h3>{item.name}</h3>
          {item.quantity !== null ? (
            <p>
              {t("common.quantity")}: {item.quantity}
            </p>
          ) : null}
        </div>
        {canEdit ? (
        <div className="packing-card-actions">
          <button
            type="button"
            onClick={() => onEdit(item)}
            className="itinerary-action-button itinerary-action-button--ghost"
          >
            {t("common.edit")}
          </button>
          <button
            type="button"
            onClick={() => void onDelete(item)}
            disabled={deletingId === item.id}
            className="itinerary-action-button itinerary-action-button--danger disabled:opacity-60"
          >
            {deletingId === item.id ? t("common.deleting") : t("common.delete")}
          </button>
        </div>
        ) : null}
      </div>

      {item.notes ? <p className="packing-item-card__notes">{item.notes}</p> : null}

      <div className="packing-traveler-grid">
        {item.statuses.map((status) => {
          const travelerName = travelerNameById.get(status.travelerId) ?? status.travelerId;
          const canUpdateStatus = canEdit || status.travelerId === selectedTravelerId;
          return (
            <TravelerStatusButton
              key={status.travelerId}
              travelerName={travelerName}
              status={status.status}
              disabled={!canUpdateStatus || statusUpdatingId === `${item.id}:${status.travelerId}`}
              saving={statusUpdatingId === `${item.id}:${status.travelerId}`}
              onStatusChange={(nextStatus) => void onStatusChange(item, status.travelerId, nextStatus)}
            />
          );
        })}
      </div>
    </article>
  );
}

function TravelerStatusButton({
  travelerName,
  status,
  disabled,
  saving,
  onStatusChange
}: {
  travelerName: string;
  status: PackingTravelerStatus;
  disabled: boolean;
  saving: boolean;
  onStatusChange: (status: PackingTravelerStatus) => void;
}) {
  const { language, t } = useLanguage();
  const [open, setOpen] = useState(false);
  const statusLabel = packingTravelerStatusLabel(language, status);
  const actionHint = disabled ? "" : ` ${t("packing.statusMenu.changeHint")}`;

  return (
    <div className="packing-traveler-status-menu">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        disabled={disabled}
        className={`packing-traveler-button ${statusClass[status]}`}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`${travelerName} status: ${statusLabel}.${actionHint}`}
        title={statusLabel}
      >
        <span>{shortTravelerName(travelerName)}</span>
      </button>
      {open ? (
        <div
          className="packing-traveler-status-menu__panel"
          role="menu"
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              event.preventDefault();
              setOpen(false);
              return;
            }

            handleStatusMenuKeyboard(event);
          }}
        >
          {packingTravelerStatuses.map((option) => (
            <button
              key={option}
              type="button"
              role="menuitemradio"
              aria-checked={option === status}
              onClick={() => {
                setOpen(false);
                onStatusChange(option);
              }}
            >
              {packingTravelerStatusLabel(language, option)}
            </button>
          ))}
        </div>
      ) : null}
      {saving ? <span className="packing-saving-note">{t("common.saving")}</span> : null}
    </div>
  );
}

function packingTravelerStatusLabel(
  language: ReturnType<typeof useLanguage>["language"],
  status: PackingTravelerStatus
) {
  if (status === "packed") {
    return language === "zh" ? "已经带了" : "Packed";
  }

  if (status === "not_needed") {
    return language === "zh" ? "不需要带" : "Not needed";
  }

  return language === "zh" ? "需要带" : "Need";
}

function PackingStat({ label, value, warm = false }: { label: string; value: string; warm?: boolean }) {
  return (
    <div className={`packing-stat ${warm ? "packing-stat--warm" : ""}`}>
      <p>{label}</p>
      <strong>{value}</strong>
    </div>
  );
}

function FilterChipGroup({
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
    <div className="packing-filter-group">
      <div className="packing-filter-group__label">{label}</div>
      <div className="scroll-fade-x itinerary-chip-row" role="list" aria-label={label}>
        {options.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => onChange(option)}
            className={`itinerary-chip ${value === option ? "itinerary-chip--active" : ""}`}
          >
            {getOptionLabel ? getOptionLabel(option) : option}
          </button>
        ))}
      </div>
    </div>
  );
}

function SelectField({
  name,
  label,
  value,
  options,
  onChange,
  getOptionLabel
}: {
  name: string;
  label: string;
  value: string;
  options: readonly string[];
  onChange: (value: string) => void;
  getOptionLabel?: (value: string) => string;
}) {
  return (
    <label className="packing-field">
      {label}
      <select
        name={name}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="packing-input"
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
  type?: "number" | "text";
}) {
  return (
    <label className="packing-field">
      {label}
      <input
        name={name}
        type={type}
        autoComplete="off"
        inputMode={type === "number" ? "numeric" : undefined}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        min={type === "number" ? "0" : undefined}
        step={type === "number" ? "1" : undefined}
        className="packing-input"
      />
    </label>
  );
}

