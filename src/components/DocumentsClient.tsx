"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { DashboardCard } from "@/components/DashboardCard";
import type { Traveler } from "@/data/tripData";
import {
  documentCategories,
  documentPriorities,
  documentStatuses,
  documentTravelerStatuses,
  type DocumentCategory,
  type DocumentInput,
  type DocumentPriority,
  type DocumentStatus,
  type DocumentTravelerStatus,
  type SharedDocumentItem
} from "@/lib/sharedDataTypes";

type DocumentsClientProps = {
  travelers: Traveler[];
};

type DocumentsApiResponse = {
  documents?: SharedDocumentItem[];
  travelers?: Traveler[];
  error?: string;
};

type FilterValue = "All";
type ProtectedFilter = "All" | "Protected" | "Open";

const requestTimeoutMs = 10000;

const travelerStatusLabel: Record<DocumentTravelerStatus, string> = {
  required: "Required",
  saved: "Saved",
  not_needed: "Not needed"
};

const travelerStatusClass: Record<DocumentTravelerStatus, string> = {
  required: "bg-amber-100 text-amber-800 ring-amber-200",
  saved: "bg-emerald-100 text-emerald-800 ring-emerald-200",
  not_needed: "bg-zinc-100 text-zinc-700 ring-zinc-200"
};

const priorityClass: Record<DocumentPriority, string> = {
  High: "bg-red-100 text-red-800 ring-red-200",
  Medium: "bg-amber-100 text-amber-800 ring-amber-200",
  Low: "bg-zinc-100 text-zinc-700 ring-zinc-200"
};

const statusClass: Record<DocumentStatus, string> = {
  Needed: "bg-amber-100 text-amber-800 ring-amber-200",
  Saved: "bg-sky-100 text-sky-800 ring-sky-200",
  Printed: "bg-indigo-100 text-indigo-800 ring-indigo-200",
  Ready: "bg-emerald-100 text-emerald-800 ring-emerald-200",
  "Not needed": "bg-zinc-100 text-zinc-700 ring-zinc-200"
};

function orderTravelers(travelers: Traveler[]) {
  return travelers.slice().sort((a, b) => a.displayOrder - b.displayOrder);
}

function defaultStatuses(travelers: Traveler[]) {
  return orderTravelers(travelers).map((traveler) => ({
    travelerId: traveler.id,
    status: "required" as DocumentTravelerStatus
  }));
}

function emptyForm(travelers: Traveler[]): DocumentInput {
  return {
    title: "",
    category: "Passport",
    priority: "Medium",
    status: "Needed",
    externalUrl: "",
    requiresPasscode: false,
    passcode: "",
    notes: "",
    sortOrder: 0,
    statuses: defaultStatuses(travelers)
  };
}

export function DocumentsClient({ travelers: initialTravelers }: DocumentsClientProps) {
  const [travelers, setTravelers] = useState<Traveler[]>(initialTravelers);
  const [documents, setDocuments] = useState<SharedDocumentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<DocumentInput>(() => emptyForm(initialTravelers));
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<FilterValue | DocumentCategory>("All");
  const [priorityFilter, setPriorityFilter] = useState<FilterValue | DocumentPriority>("All");
  const [statusFilter, setStatusFilter] = useState<FilterValue | DocumentStatus>("All");
  const [protectedFilter, setProtectedFilter] = useState<ProtectedFilter>("All");
  const [passcodeInputs, setPasscodeInputs] = useState<Record<string, string>>({});
  const [unlockedUrls, setUnlockedUrls] = useState<Record<string, string>>({});
  const [unlockingId, setUnlockingId] = useState<string | null>(null);

  const orderedTravelers = useMemo(() => orderTravelers(travelers), [travelers]);
  const travelerNameById = useMemo(
    () => new Map(orderedTravelers.map((traveler) => [traveler.id, traveler.name])),
    [orderedTravelers]
  );

  const readySavedCount = documents.filter((document) =>
    ["Saved", "Printed", "Ready"].includes(document.status)
  ).length;
  const highPriorityCount = documents.filter((document) => document.priority === "High").length;
  const protectedCount = documents.filter((document) => document.requiresPasscode).length;

  const visibleDocuments = useMemo(
    () =>
      documents.filter((document) => {
        const categoryMatches = categoryFilter === "All" || document.category === categoryFilter;
        const priorityMatches = priorityFilter === "All" || document.priority === priorityFilter;
        const statusMatches = statusFilter === "All" || document.status === statusFilter;
        const protectedMatches =
          protectedFilter === "All" ||
          (protectedFilter === "Protected" && document.requiresPasscode) ||
          (protectedFilter === "Open" && !document.requiresPasscode);

        return categoryMatches && priorityMatches && statusMatches && protectedMatches;
      }),
    [categoryFilter, documents, priorityFilter, protectedFilter, statusFilter]
  );

  async function loadDocuments() {
    setLoading(true);
    setError(null);
    setNotice(null);

    try {
      const data = await fetchDocumentsJson("/api/documents", undefined, "Unable to load documents.");
      setDocuments(data.documents);
      setTravelers(data.travelers);
      setForm((current) => ensureFormTravelers(current, data.travelers));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load documents.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadDocuments();
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
    setError(null);
    setNotice(null);
  }

  function startEditing(document: SharedDocumentItem) {
    setEditingId(document.id);
    setForm({
      title: document.title,
      category: document.category,
      priority: document.priority,
      status: document.status,
      externalUrl: document.externalUrl ?? unlockedUrls[document.id] ?? "",
      requiresPasscode: document.requiresPasscode,
      passcode: "",
      notes: document.notes ?? "",
      sortOrder: document.sortOrder,
      statuses: document.statuses.map((status) => ({
        travelerId: status.travelerId,
        status: status.status
      }))
    });
    setFormOpen(true);
    setError(null);
    setNotice(null);
  }

  function changeTravelerStatus(travelerId: string, status: DocumentTravelerStatus) {
    setForm((current) => ({
      ...current,
      statuses: orderedTravelers.map((traveler) => {
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

  async function submitDocument(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!form.title.trim()) {
      setError("Document title is required.");
      return;
    }

    if (form.requiresPasscode && !editingId && !String(form.passcode ?? "").trim()) {
      setError("Passcode is required for a protected folder link.");
      return;
    }

    setSubmitting(true);
    setError(null);
    setNotice(null);

    try {
      const editingDocument = editingId
        ? documents.find((document) => document.id === editingId)
        : null;
      const shouldPreserveHiddenProtectedUrl =
        Boolean(
          editingDocument?.requiresPasscode &&
            editingDocument.hasExternalUrl &&
            !editingDocument.externalUrl &&
            !unlockedUrls[editingDocument.id] &&
            !String(form.externalUrl ?? "").trim()
        );
      const data = await fetchDocumentsJson(
        editingId ? `/api/documents/${editingId}` : "/api/documents",
        {
          method: editingId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...form,
            title: form.title.trim(),
            externalUrl: shouldPreserveHiddenProtectedUrl
              ? undefined
              : String(form.externalUrl ?? "").trim(),
            passcode: String(form.passcode ?? "").trim(),
            notes: String(form.notes ?? "").trim()
          })
        },
        editingId ? "Unable to update document." : "Unable to create document."
      );

      setDocuments(data.documents);
      setTravelers(data.travelers);
      if (editingId) {
        setUnlockedUrls((current) => {
          const next = { ...current };
          delete next[editingId];
          return next;
        });
      }
      setNotice(editingId ? "Updated document item." : "Added document item.");
      resetForm(data.travelers);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to save document.");
    } finally {
      setSubmitting(false);
    }
  }

  async function removeDocument(document: SharedDocumentItem) {
    if (!window.confirm(`Delete "${document.title}" from Documents?`)) {
      return;
    }

    setDeletingId(document.id);
    setError(null);
    setNotice(null);

    try {
      const data = await fetchDocumentsJson(
        `/api/documents/${document.id}`,
        { method: "DELETE" },
        "Unable to delete document."
      );
      setDocuments(data.documents);
      setTravelers(data.travelers);
      setUnlockedUrls((current) => {
        const next = { ...current };
        delete next[document.id];
        return next;
      });
      setNotice("Deleted document item.");
      if (editingId === document.id) {
        resetForm(data.travelers);
      }
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Unable to delete document.");
    } finally {
      setDeletingId(null);
    }
  }

  async function unlockDocument(document: SharedDocumentItem) {
    const passcode = String(passcodeInputs[document.id] ?? "").trim();

    if (!passcode) {
      setError("Enter the folder access code first.");
      return;
    }

    setUnlockingId(document.id);
    setError(null);
    setNotice(null);

    try {
      const response = await fetch(`/api/documents/${document.id}/unlock`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passcode })
      });
      const data = (await response.json()) as { externalUrl?: string; error?: string };

      if (!response.ok || !data.externalUrl) {
        throw new Error(data.error ?? "Unable to unlock folder.");
      }

      setUnlockedUrls((current) => ({ ...current, [document.id]: data.externalUrl as string }));
      setPasscodeInputs((current) => ({ ...current, [document.id]: "" }));
      setNotice("Folder link unlocked.");
    } catch (unlockError) {
      setError(unlockError instanceof Error ? unlockError.message : "Unable to unlock folder.");
    } finally {
      setUnlockingId(null);
    }
  }

  return (
    <div className="w-full max-w-full min-w-0 overflow-x-hidden space-y-5">
      <section className="rounded-lg border border-red-200 bg-red-50 p-4 shadow-soft">
        <h2 className="text-lg font-semibold text-red-800">Sensitive documents stay outside the app</h2>
        <p className="mt-2 text-sm leading-6 text-red-800">
          Keep files in private cloud storage. This page only stores safe checklist labels and optional folder links.
        </p>
      </section>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <DashboardCard label="Total documents" value={String(documents.length)} />
        <DashboardCard label="High priority" value={String(highPriorityCount)} />
        <DashboardCard label="Ready / saved" value={String(readySavedCount)} />
        <DashboardCard label="Protected links" value={String(protectedCount)} tone={protectedCount > 0 ? "warm" : "default"} />
      </div>

      <div className="flex flex-col gap-3 rounded-lg border border-zinc-200 bg-white p-3 shadow-soft sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-terracotta">Shared checklist</p>
          <p className="mt-1 text-sm text-zinc-600">
            {visibleDocuments.length} visible / {documents.length} total
          </p>
        </div>
        <button
          type="button"
          onClick={formOpen ? () => resetForm() : openAddForm}
          disabled={loading}
          className="w-full max-w-full rounded-md bg-moss px-3 py-2 text-base font-semibold text-white disabled:opacity-60 sm:w-auto sm:text-sm"
        >
          {formOpen ? "Close form" : "Add document item"}
        </button>
      </div>

      {formOpen ? (
        <DocumentForm
          form={form}
          travelers={orderedTravelers}
          editingId={editingId}
          submitting={submitting}
          onSubmit={submitDocument}
          onCancel={() => resetForm()}
          onChange={setForm}
          onTravelerStatusChange={changeTravelerStatus}
        />
      ) : null}

      <FilterSection
        filtersOpen={filtersOpen}
        categoryFilter={categoryFilter}
        priorityFilter={priorityFilter}
        statusFilter={statusFilter}
        protectedFilter={protectedFilter}
        onToggleFilters={() => setFiltersOpen((current) => !current)}
        onCategoryChange={setCategoryFilter}
        onPriorityChange={setPriorityFilter}
        onStatusChange={setStatusFilter}
        onProtectedChange={setProtectedFilter}
      />

      {error ? (
        <div className="flex flex-col gap-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 sm:flex-row sm:items-center sm:justify-between">
          <p>{error}</p>
          <button
            type="button"
            onClick={() => void loadDocuments()}
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

      {loading ? <p className="text-sm text-zinc-600">Loading documents...</p> : null}

      {!loading && documents.length === 0 ? (
        <p className="rounded-lg border border-zinc-200 bg-white px-4 py-8 text-sm text-zinc-600 shadow-soft">
          No document checklist items have been added yet.
        </p>
      ) : null}

      {!loading && documents.length > 0 && visibleDocuments.length === 0 ? (
        <p className="rounded-lg border border-zinc-200 bg-white px-4 py-8 text-sm text-zinc-600 shadow-soft">
          No document items match the selected filters.
        </p>
      ) : null}

      <section className="grid gap-3 lg:grid-cols-2">
        {visibleDocuments.map((document) => (
          <DocumentCard
            key={document.id}
            document={document}
            deletingId={deletingId}
            unlockingId={unlockingId}
            passcodeValue={passcodeInputs[document.id] ?? ""}
            unlockedUrl={unlockedUrls[document.id]}
            travelerNameById={travelerNameById}
            onPasscodeChange={(value) =>
              setPasscodeInputs((current) => ({ ...current, [document.id]: value }))
            }
            onUnlock={unlockDocument}
            onEdit={startEditing}
            onDelete={removeDocument}
          />
        ))}
      </section>
    </div>
  );
}

function DocumentForm({
  form,
  travelers,
  editingId,
  submitting,
  onSubmit,
  onCancel,
  onChange,
  onTravelerStatusChange
}: {
  form: DocumentInput;
  travelers: Traveler[];
  editingId: string | null;
  submitting: boolean;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onCancel: () => void;
  onChange: (updater: (current: DocumentInput) => DocumentInput) => void;
  onTravelerStatusChange: (travelerId: string, status: DocumentTravelerStatus) => void;
}) {
  return (
    <form
      onSubmit={onSubmit}
      className="mobile-safe-form box-border w-full max-w-full min-w-0 overflow-hidden rounded-lg border border-zinc-200 bg-white p-4 shadow-soft"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-terracotta">
            {editingId ? "Edit document item" : "Add document item"}
          </p>
          <h2 className="mt-1 text-xl font-semibold text-ink">
            {editingId ? "Update checklist and folder access" : "Create a shared document checklist item"}
          </h2>
        </div>
        <button
          type="button"
          onClick={onCancel}
          disabled={submitting}
          className="max-w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold text-ink disabled:opacity-60"
        >
          Cancel
        </button>
      </div>

      <div className="mt-4 grid w-full max-w-full min-w-0 grid-cols-1 gap-3 md:grid-cols-2">
        <TextField
          label="Title"
          value={form.title}
          onChange={(value) => onChange((current) => ({ ...current, title: value }))}
          placeholder="Hotel bookings folder"
        />
        <SelectField
          label="Category"
          value={form.category}
          options={documentCategories}
          onChange={(value) => onChange((current) => ({ ...current, category: value as DocumentCategory }))}
        />
        <SelectField
          label="Priority"
          value={form.priority}
          options={documentPriorities}
          onChange={(value) => onChange((current) => ({ ...current, priority: value as DocumentPriority }))}
        />
        <SelectField
          label="Status"
          value={form.status}
          options={documentStatuses}
          onChange={(value) => onChange((current) => ({ ...current, status: value as DocumentStatus }))}
        />
        <TextField
          label="External folder link"
          type="url"
          value={String(form.externalUrl ?? "")}
          onChange={(value) => onChange((current) => ({ ...current, externalUrl: value }))}
          placeholder="https://drive.google.com/..."
        />
        <TextField
          label="Sort order"
          type="number"
          value={String(form.sortOrder ?? 0)}
          onChange={(value) => onChange((current) => ({ ...current, sortOrder: value ? Number(value) : 0 }))}
          placeholder="0"
        />
      </div>

      <label className="mt-3 flex w-full max-w-full min-w-0 items-start gap-3 text-sm font-semibold text-ink">
        <input
          type="checkbox"
          checked={form.requiresPasscode}
          onChange={(event) =>
            onChange((current) => ({ ...current, requiresPasscode: event.target.checked }))
          }
          className="mt-0.5 h-4 w-4 shrink-0 rounded border-zinc-300"
        />
        <span className="min-w-0 flex-1 break-words whitespace-normal leading-5">
          Requires access code
        </span>
      </label>

      {form.requiresPasscode ? (
        <TextField
          label={editingId ? "Access code (blank keeps existing)" : "Access code"}
          type="password"
          value={String(form.passcode ?? "")}
          onChange={(value) => onChange((current) => ({ ...current, passcode: value }))}
          placeholder={editingId ? "Leave blank to keep" : "Folder access code"}
        />
      ) : null}

      <label className="mt-3 block w-full max-w-full min-w-0 text-sm font-semibold text-ink">
        Notes
        <textarea
          value={String(form.notes ?? "")}
          onChange={(event) => onChange((current) => ({ ...current, notes: event.target.value }))}
          className="mt-2 block box-border min-h-24 w-full max-w-full min-w-0 resize-y rounded-md border border-zinc-200 bg-white px-3 py-2 text-base text-zinc-700 sm:text-sm"
          placeholder="Safe notes only. Do not paste access codes or document numbers."
        />
      </label>

      <fieldset className="mt-4 w-full max-w-full min-w-0 overflow-hidden rounded-lg border border-zinc-200 p-3">
        <legend className="px-1 text-sm font-semibold text-ink">Traveler statuses</legend>
        <div className="mt-2 grid w-full max-w-full min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {travelers.map((traveler) => (
            <SelectField
              key={traveler.id}
              label={traveler.name}
              value={
                form.statuses.find((status) => status.travelerId === traveler.id)?.status ??
                "required"
              }
              options={documentTravelerStatuses}
              optionLabels={new Map(documentTravelerStatuses.map((status) => [status, travelerStatusLabel[status]]))}
              onChange={(value) => onTravelerStatusChange(traveler.id, value as DocumentTravelerStatus)}
            />
          ))}
        </div>
      </fieldset>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <button
          type="submit"
          disabled={submitting}
          className="w-full max-w-full rounded-md bg-moss px-3 py-2 text-base font-semibold text-white disabled:opacity-60 sm:w-auto sm:text-sm"
        >
          {submitting ? "Saving..." : editingId ? "Save changes" : "Add document item"}
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
  categoryFilter,
  priorityFilter,
  statusFilter,
  protectedFilter,
  onToggleFilters,
  onCategoryChange,
  onPriorityChange,
  onStatusChange,
  onProtectedChange
}: {
  filtersOpen: boolean;
  categoryFilter: FilterValue | DocumentCategory;
  priorityFilter: FilterValue | DocumentPriority;
  statusFilter: FilterValue | DocumentStatus;
  protectedFilter: ProtectedFilter;
  onToggleFilters: () => void;
  onCategoryChange: (value: FilterValue | DocumentCategory) => void;
  onPriorityChange: (value: FilterValue | DocumentPriority) => void;
  onStatusChange: (value: FilterValue | DocumentStatus) => void;
  onProtectedChange: (value: ProtectedFilter) => void;
}) {
  return (
    <section className="rounded-lg border border-zinc-200 bg-white p-3 shadow-soft">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-terracotta">Filters</p>
          <p className="mt-1 text-sm text-zinc-600">
            {categoryFilter} / {priorityFilter} / {statusFilter} / {protectedFilter}
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
        <div className="mt-3 grid min-w-0 grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <SelectField
            label="Category"
            value={categoryFilter}
            options={["All", ...documentCategories]}
            onChange={(value) => onCategoryChange(value as FilterValue | DocumentCategory)}
          />
          <SelectField
            label="Priority"
            value={priorityFilter}
            options={["All", ...documentPriorities]}
            onChange={(value) => onPriorityChange(value as FilterValue | DocumentPriority)}
          />
          <SelectField
            label="Status"
            value={statusFilter}
            options={["All", ...documentStatuses]}
            onChange={(value) => onStatusChange(value as FilterValue | DocumentStatus)}
          />
          <SelectField
            label="Link access"
            value={protectedFilter}
            options={["All", "Protected", "Open"]}
            onChange={(value) => onProtectedChange(value as ProtectedFilter)}
          />
        </div>
      ) : null}
    </section>
  );
}

function DocumentCard({
  document,
  deletingId,
  unlockingId,
  passcodeValue,
  unlockedUrl,
  travelerNameById,
  onPasscodeChange,
  onUnlock,
  onEdit,
  onDelete
}: {
  document: SharedDocumentItem;
  deletingId: string | null;
  unlockingId: string | null;
  passcodeValue: string;
  unlockedUrl?: string;
  travelerNameById: Map<string, string>;
  onPasscodeChange: (value: string) => void;
  onUnlock: (document: SharedDocumentItem) => Promise<void>;
  onEdit: (document: SharedDocumentItem) => void;
  onDelete: (document: SharedDocumentItem) => Promise<void>;
}) {
  const folderUrl = document.externalUrl ?? unlockedUrl ?? null;

  return (
    <article className="rounded-lg border border-zinc-200 bg-white p-4 shadow-soft">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded-full px-2 py-1 text-xs font-semibold ring-1 ${priorityClass[document.priority]}`}>
              {document.priority}
            </span>
            <span className={`rounded-full px-2 py-1 text-xs font-semibold ring-1 ${statusClass[document.status]}`}>
              {document.status}
            </span>
            {document.requiresPasscode ? (
              <span className="rounded-full bg-red-100 px-2 py-1 text-xs font-semibold text-red-800 ring-1 ring-red-200">
                Protected
              </span>
            ) : null}
          </div>
          <h3 className="mt-2 break-words text-lg font-semibold text-ink">{document.title}</h3>
          <p className="mt-1 text-sm text-zinc-500">{document.category}</p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <button
            type="button"
            onClick={() => onEdit(document)}
            className="rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold text-ink"
          >
            Edit
          </button>
          <button
            type="button"
            onClick={() => void onDelete(document)}
            disabled={deletingId === document.id}
            className="rounded-md border border-red-200 bg-white px-3 py-2 text-sm font-semibold text-red-700 disabled:opacity-60"
          >
            {deletingId === document.id ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>

      {document.notes ? <p className="mt-3 break-words text-sm leading-6 text-zinc-600">{document.notes}</p> : null}

      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {document.statuses.map((status) => (
          <div key={status.travelerId} className="rounded-lg bg-zinc-50 p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-semibold text-ink">
                {travelerNameById.get(status.travelerId) ?? status.travelerId}
              </p>
              <span className={`rounded-full px-2 py-1 text-xs font-semibold ring-1 ${travelerStatusClass[status.status]}`}>
                {travelerStatusLabel[status.status]}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 rounded-lg bg-zinc-50 p-3">
        {folderUrl ? (
          <a
            href={folderUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex w-full max-w-full justify-center rounded-md bg-moss px-3 py-2 text-sm font-semibold text-white sm:w-auto"
          >
            Open folder
          </a>
        ) : document.requiresPasscode && document.hasExternalUrl ? (
          <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
            <input
              type="password"
              value={passcodeValue}
              onChange={(event) => onPasscodeChange(event.target.value)}
              placeholder="Access code"
              className="block box-border w-full max-w-full min-w-0 rounded-md border border-zinc-200 bg-white px-3 py-2 text-base text-zinc-700 sm:text-sm"
            />
            <button
              type="button"
              onClick={() => void onUnlock(document)}
              disabled={unlockingId === document.id}
              className="w-full max-w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold text-ink disabled:opacity-60 sm:w-auto"
            >
              {unlockingId === document.id ? "Unlocking..." : "Unlock folder"}
            </button>
          </div>
        ) : (
          <p className="text-sm text-zinc-600">No folder link added yet.</p>
        )}
      </div>
    </article>
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
  type?: "number" | "password" | "text" | "url";
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
        step={type === "number" ? "1" : undefined}
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

async function fetchDocumentsJson(
  url: string,
  options: RequestInit | undefined,
  fallbackMessage: string
): Promise<{ documents: SharedDocumentItem[]; travelers: Traveler[] }> {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), requestTimeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    const data = (await response.json()) as DocumentsApiResponse;

    if (!response.ok) {
      throw new Error(data.error ?? fallbackMessage);
    }

    return validateDocumentsResponse(data, fallbackMessage);
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error(`${fallbackMessage} Request timed out. Please retry.`);
    }

    throw error;
  } finally {
    window.clearTimeout(timeoutId);
  }
}

function validateDocumentsResponse(data: DocumentsApiResponse, fallbackMessage: string) {
  if (!Array.isArray(data.documents) || !Array.isArray(data.travelers)) {
    throw new Error(fallbackMessage);
  }

  return {
    documents: data.documents.filter(isSharedDocumentItem),
    travelers: data.travelers.filter(isTraveler)
  };
}

function isSharedDocumentItem(value: unknown): value is SharedDocumentItem {
  if (!value || typeof value !== "object") {
    return false;
  }

  const document = value as Partial<SharedDocumentItem>;
  return (
    typeof document.id === "string" &&
    typeof document.title === "string" &&
    typeof document.category === "string" &&
    typeof document.priority === "string" &&
    typeof document.status === "string" &&
    typeof document.hasExternalUrl === "boolean" &&
    typeof document.requiresPasscode === "boolean" &&
    Array.isArray(document.statuses)
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

function ensureFormTravelers(form: DocumentInput, travelers: Traveler[]) {
  const travelerIds = new Set(travelers.map((traveler) => traveler.id));
  const validStatuses = form.statuses.filter((status) => travelerIds.has(status.travelerId));

  if (validStatuses.length === travelers.length) {
    return {
      ...form,
      statuses: validStatuses
    };
  }

  return {
    ...form,
    statuses: defaultStatuses(travelers)
  };
}
