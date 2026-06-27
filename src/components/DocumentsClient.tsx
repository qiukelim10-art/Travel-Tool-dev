"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import type { Traveler } from "@/data/tripData";
import { useTripAccess } from "@/lib/access";
import { useLanguage } from "@/lib/i18n";
import { translateOption } from "@/lib/localize";
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
  return orderTravelers(travelers)
    .filter((traveler) => traveler.isActive !== false)
    .map((traveler) => ({
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
  const { language, t } = useLanguage();
  const { mode } = useTripAccess();
  const canEdit = mode === "editor";
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
  const activeTravelers = useMemo(
    () => orderedTravelers.filter((traveler) => traveler.isActive !== false),
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
      const data = await fetchDocumentsJson("/api/documents", undefined, t("documents.errorLoad"));
      setDocuments(data.documents);
      setTravelers(data.travelers);
      setForm((current) => ensureFormTravelers(current, data.travelers));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : t("documents.errorLoad"));
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
    if (!canEdit) {
      setError("Editor mode is required to add documents.");
      return;
    }

    setEditingId(null);
    setForm(emptyForm(travelers));
    setFormOpen(true);
    setError(null);
    setNotice(null);
  }

  function startEditing(document: SharedDocumentItem) {
    if (!canEdit) {
      setError("Editor mode is required to edit documents.");
      return;
    }

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

    if (!canEdit) {
      setError("Editor mode is required to save documents.");
      return;
    }

    if (!form.title.trim()) {
      setError(t("documents.validationTitle"));
      return;
    }

    if (form.requiresPasscode && !editingId && !String(form.passcode ?? "").trim()) {
      setError(t("documents.validationPasscode"));
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
        editingId ? t("documents.errorUpdate") : t("documents.errorCreate")
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
      setNotice(editingId ? t("documents.noticeUpdated") : t("documents.noticeAdded"));
      resetForm(data.travelers);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : t("documents.errorSave"));
    } finally {
      setSubmitting(false);
    }
  }

  async function removeDocument(document: SharedDocumentItem) {
    if (!canEdit) {
      setError("Editor mode is required to delete documents.");
      return;
    }

    if (!window.confirm(t("documents.confirmDelete"))) {
      return;
    }

    setDeletingId(document.id);
    setError(null);
    setNotice(null);

    try {
      const data = await fetchDocumentsJson(
        `/api/documents/${document.id}`,
        { method: "DELETE" },
        t("documents.errorDelete")
      );
      setDocuments(data.documents);
      setTravelers(data.travelers);
      setUnlockedUrls((current) => {
        const next = { ...current };
        delete next[document.id];
        return next;
      });
      setNotice(t("documents.noticeDeleted"));
      if (editingId === document.id) {
        resetForm(data.travelers);
      }
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : t("documents.errorDelete"));
    } finally {
      setDeletingId(null);
    }
  }

  async function unlockDocument(document: SharedDocumentItem) {
    const passcode = String(passcodeInputs[document.id] ?? "").trim();

    if (!passcode) {
      setError(t("documents.validationUnlockCode"));
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
        throw new Error(data.error ?? t("documents.errorUnlock"));
      }

      setUnlockedUrls((current) => ({ ...current, [document.id]: data.externalUrl as string }));
      setPasscodeInputs((current) => ({ ...current, [document.id]: "" }));
      setNotice(t("documents.noticeUnlocked"));
    } catch (unlockError) {
      setError(unlockError instanceof Error ? unlockError.message : t("documents.errorUnlock"));
    } finally {
      setUnlockingId(null);
    }
  }

  return (
    <div className="documents-workspace">
      <section className="documents-warning-card">
        <span aria-hidden="true">!</span>
        <div>
          <h2>{t("documents.warningTitle")}</h2>
          <p>{t("documents.warningDescription")}</p>
        </div>
      </section>

      <section className="documents-journal-grid">
        <div className="documents-main-stack">
          <section className="documents-control-card">
            <div className="documents-control-card__header">
              <div className="min-w-0">
                <p className="cockpit-eyebrow">{t("documents.checklist")}</p>
                <h2>
                  {t("documents.visibleSummary", { visible: visibleDocuments.length, total: documents.length })}
                </h2>
                <p>{t("documents.warningDescription")}</p>
              </div>
              <button
                type="button"
                onClick={formOpen ? () => resetForm() : openAddForm}
                disabled={loading || !canEdit}
                className="documents-action-button documents-action-button--primary disabled:opacity-60"
              >
                {formOpen ? t("documents.closeForm") : t("documents.addItem")}
              </button>
            </div>

            <div className="documents-stats-strip">
              <CompactStat label={t("documents.summary.total")} value={String(documents.length)} />
              <CompactStat label={t("documents.summary.highPriority")} value={String(highPriorityCount)} />
              <CompactStat label={t("documents.summary.readySaved")} value={String(readySavedCount)} />
              <CompactStat
                label={t("documents.summary.protectedLinks")}
                value={String(protectedCount)}
                warm={protectedCount > 0}
              />
            </div>

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
          </section>

          {formOpen ? (
            <DocumentForm
              form={form}
              travelers={activeTravelers}
              editingId={editingId}
              submitting={submitting}
              onSubmit={submitDocument}
              onCancel={() => resetForm()}
              onChange={setForm}
              onTravelerStatusChange={changeTravelerStatus}
            />
          ) : null}

          {error ? (
            <div
              role="alert"
              className="documents-inline-status documents-inline-status--error"
            >
              <p>{error}</p>
              <button
                type="button"
                onClick={() => void loadDocuments()}
                disabled={loading}
                className="documents-action-button documents-action-button--danger disabled:opacity-60"
              >
                {loading ? t("common.retrying") : t("common.retry")}
              </button>
            </div>
          ) : null}

          {notice ? (
            <p
              role="status"
              aria-live="polite"
              className="documents-inline-status documents-inline-status--success"
            >
              {notice}
            </p>
          ) : null}

          {loading ? (
            <p role="status" aria-live="polite" className="documents-loading-card">
              {t("documents.loading")}
            </p>
          ) : null}

          {!loading && documents.length === 0 ? (
            <p className="documents-empty-card">
              {t("documents.empty")}
            </p>
          ) : null}

          {!loading && documents.length > 0 && visibleDocuments.length === 0 ? (
            <p className="documents-empty-card">
              {t("documents.emptyFiltered")}
            </p>
          ) : null}

          <section className="documents-list">
            {visibleDocuments.map((document) => (
              <DocumentCard
                key={document.id}
                document={document}
                deletingId={deletingId}
                unlockingId={unlockingId}
                canEdit={canEdit}
                passcodeValue={passcodeInputs[document.id] ?? ""}
                unlockedUrl={unlockedUrls[document.id]}
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

        <aside className="documents-side-rail" aria-label={t("documents.mastheadOverview")}>
          <section className="documents-rail-card">
            <p className="cockpit-eyebrow">{t("documents.filters.linkAccess")}</p>
            <h3>{t("documents.protected")}</h3>
            <p>{t("documents.warningDescription")}</p>
          </section>
          <section className="documents-rail-card">
            <p className="cockpit-eyebrow">{t("documents.form.travelerStatuses")}</p>
            <h3>{t("documents.checklist")}</h3>
            <div className="documents-rail-statuses">
              {documentTravelerStatuses.map((status) => (
                <span key={status} className={travelerStatusClass[status]}>
                  {translateOption(language, status)}
                </span>
              ))}
            </div>
          </section>
        </aside>
      </section>
    </div>
  );
}

function CompactStat({
  label,
  value,
  warm = false
}: {
  label: string;
  value: string;
  warm?: boolean;
}) {
  return (
    <div className={`documents-stat ${warm ? "documents-stat--warm" : ""}`}>
      <p>
        {label}
      </p>
      <strong>{value}</strong>
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
  const { language, t } = useLanguage();

  return (
    <form
      onSubmit={onSubmit}
      className="documents-form mobile-safe-form"
    >
      <div className="documents-form__header">
        <div className="min-w-0">
          <p className="cockpit-eyebrow">
            {editingId ? t("documents.editItem") : t("documents.addItemEyebrow")}
          </p>
          <h2>
            {editingId ? t("documents.editTitle") : t("documents.addTitle")}
          </h2>
        </div>
        <button
          type="button"
          onClick={onCancel}
          disabled={submitting}
          className="documents-action-button documents-action-button--ghost disabled:opacity-60"
        >
          {t("common.cancel")}
        </button>
      </div>

      <div className="documents-form__grid">
        <TextField
          name="document-title"
          label={t("common.title")}
          value={form.title}
          onChange={(value) => onChange((current) => ({ ...current, title: value }))}
          placeholder="Hotel bookings folder"
        />
        <SelectField
          name="document-category"
          label={t("common.category")}
          value={form.category}
          options={documentCategories}
          formatOption={(option) => translateOption(language, option)}
          onChange={(value) => onChange((current) => ({ ...current, category: value as DocumentCategory }))}
        />
        <SelectField
          name="document-priority"
          label={t("common.priority")}
          value={form.priority}
          options={documentPriorities}
          formatOption={(option) => translateOption(language, option)}
          onChange={(value) => onChange((current) => ({ ...current, priority: value as DocumentPriority }))}
        />
        <SelectField
          name="document-status"
          label={t("common.status")}
          value={form.status}
          options={documentStatuses}
          formatOption={(option) => translateOption(language, option)}
          onChange={(value) => onChange((current) => ({ ...current, status: value as DocumentStatus }))}
        />
        <TextField
          name="document-external-folder"
          label={t("documents.form.externalFolder")}
          type="url"
          value={String(form.externalUrl ?? "")}
          onChange={(value) => onChange((current) => ({ ...current, externalUrl: value }))}
          placeholder="https://drive.google.com/..."
        />
        <TextField
          name="document-sort-order"
          label={t("common.sortOrder")}
          type="number"
          value={String(form.sortOrder ?? 0)}
          onChange={(value) => onChange((current) => ({ ...current, sortOrder: value ? Number(value) : 0 }))}
          placeholder="0"
        />
      </div>

      <label className="documents-form__checkbox">
        <input
          type="checkbox"
          name="document-requires-passcode"
          checked={form.requiresPasscode}
          onChange={(event) =>
            onChange((current) => ({ ...current, requiresPasscode: event.target.checked }))
          }
          className="mt-0.5 h-4 w-4 shrink-0 rounded border-zinc-300"
        />
        <span>
          {t("documents.form.requiresCode")}
        </span>
      </label>

      {form.requiresPasscode ? (
        <TextField
          name="document-passcode"
          label={editingId ? t("documents.form.accessCodeKeep") : t("documents.form.accessCode")}
          type="password"
          value={String(form.passcode ?? "")}
          onChange={(value) => onChange((current) => ({ ...current, passcode: value }))}
          placeholder={editingId ? t("documents.form.accessCodeKeepPlaceholder") : t("documents.form.accessCodePlaceholder")}
        />
      ) : null}

      <label className="documents-textarea-field">
        {t("common.notes")}
        <textarea
          name="document-notes"
          autoComplete="off"
          value={String(form.notes ?? "")}
          onChange={(event) => onChange((current) => ({ ...current, notes: event.target.value }))}
          className="mt-2 block box-border min-h-24 w-full max-w-full min-w-0 resize-y rounded-md border border-zinc-200 bg-white px-3 py-2 text-base text-zinc-700 sm:text-sm"
          placeholder={t("documents.form.notesPlaceholder")}
        />
      </label>

      <fieldset className="documents-traveler-fieldset">
        <legend>{t("documents.form.travelerStatuses")}</legend>
        <div>
          {travelers.map((traveler) => (
            <SelectField
              key={traveler.id}
              name={`document-traveler-${traveler.id}-status`}
              label={traveler.name}
              value={
                form.statuses.find((status) => status.travelerId === traveler.id)?.status ??
                "required"
              }
              options={documentTravelerStatuses}
              formatOption={(option) => translateOption(language, option)}
              onChange={(value) => onTravelerStatusChange(traveler.id, value as DocumentTravelerStatus)}
            />
          ))}
        </div>
      </fieldset>

      <div className="documents-form__actions">
        <button
          type="submit"
          disabled={submitting}
          className="documents-action-button documents-action-button--primary disabled:opacity-60"
        >
          {submitting ? t("common.saving") : editingId ? t("bookings.saveChanges") : t("documents.addButton")}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={submitting}
          className="documents-action-button documents-action-button--ghost disabled:opacity-60"
        >
          {t("common.cancel")}
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
  const { language, t } = useLanguage();

  return (
    <section className="documents-filter-card">
      <div className="documents-filter-card__header">
        <div className="min-w-0">
          <p className="documents-filter-card__label">{t("documents.filters.title")}</p>
          <p>
            {translateOption(language, categoryFilter)} / {translateOption(language, priorityFilter)} / {translateOption(language, statusFilter)} / {translateOption(language, protectedFilter)}
          </p>
        </div>
        <button
          type="button"
          onClick={onToggleFilters}
          className="documents-action-button documents-action-button--ghost"
        >
          {filtersOpen ? t("documents.filters.hide") : t("documents.filters.title")}
        </button>
      </div>

      {filtersOpen ? (
        <div className="documents-filter-card__fields">
          <SelectField
            name="documents-filter-category"
            label={t("common.category")}
            value={categoryFilter}
            options={["All", ...documentCategories]}
            formatOption={(option) => translateOption(language, option)}
            onChange={(value) => onCategoryChange(value as FilterValue | DocumentCategory)}
          />
          <SelectField
            name="documents-filter-priority"
            label={t("common.priority")}
            value={priorityFilter}
            options={["All", ...documentPriorities]}
            formatOption={(option) => translateOption(language, option)}
            onChange={(value) => onPriorityChange(value as FilterValue | DocumentPriority)}
          />
          <SelectField
            name="documents-filter-status"
            label={t("common.status")}
            value={statusFilter}
            options={["All", ...documentStatuses]}
            formatOption={(option) => translateOption(language, option)}
            onChange={(value) => onStatusChange(value as FilterValue | DocumentStatus)}
          />
          <SelectField
            name="documents-filter-link-access"
            label={t("documents.filters.linkAccess")}
            value={protectedFilter}
            options={["All", "Protected", "Open"]}
            formatOption={(option) => translateOption(language, option)}
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
  canEdit,
  passcodeValue,
  unlockedUrl,
  onPasscodeChange,
  onUnlock,
  onEdit,
  onDelete
}: {
  document: SharedDocumentItem;
  deletingId: string | null;
  unlockingId: string | null;
  canEdit: boolean;
  passcodeValue: string;
  unlockedUrl?: string;
  onPasscodeChange: (value: string) => void;
  onUnlock: (document: SharedDocumentItem) => Promise<void>;
  onEdit: (document: SharedDocumentItem) => void;
  onDelete: (document: SharedDocumentItem) => Promise<void>;
}) {
  const { language, t } = useLanguage();
  const folderUrl = document.externalUrl ?? unlockedUrl ?? null;

  return (
    <article className="documents-item-card">
      <div className="documents-item-card__header">
        <div className="documents-item-card__copy">
          <div className="documents-badge-row">
            <span className={`documents-badge ${priorityClass[document.priority]}`}>
              {translateOption(language, document.priority)}
            </span>
            <span className={`documents-badge ${statusClass[document.status]}`}>
              {translateOption(language, document.status)}
            </span>
            {document.requiresPasscode ? (
              <span className="documents-badge bg-red-100 text-red-800 ring-1 ring-red-200">
                {t("documents.protected")}
              </span>
            ) : null}
          </div>
          <h3>{document.title}</h3>
          <p>{translateOption(language, document.category)}</p>
        </div>
        {canEdit ? (
          <div className="documents-card-actions">
            <button
              type="button"
              onClick={() => onEdit(document)}
              className="documents-action-button documents-action-button--ghost"
            >
              {t("common.edit")}
            </button>
            <button
              type="button"
              onClick={() => void onDelete(document)}
              disabled={deletingId === document.id}
              className="documents-action-button documents-action-button--danger disabled:opacity-60"
            >
              {deletingId === document.id ? t("common.deleting") : t("common.delete")}
            </button>
          </div>
        ) : null}
      </div>

      {document.notes ? <p className="documents-item-card__notes">{document.notes}</p> : null}

      <div className="documents-folder-access">
        {folderUrl ? (
          <a
            href={folderUrl}
            target="_blank"
            rel="noreferrer"
            className="documents-action-button documents-action-button--primary"
          >
            {t("documents.openFolder")}
          </a>
        ) : document.requiresPasscode && document.hasExternalUrl ? (
          <div className="documents-unlock-grid">
            <input
              type="password"
              name={`document-${document.id}-unlock-code`}
              autoComplete="off"
              value={passcodeValue}
              onChange={(event) => onPasscodeChange(event.target.value)}
              placeholder={t("documents.form.accessCode")}
              className="documents-unlock-input"
            />
            <button
              type="button"
              onClick={() => void onUnlock(document)}
              disabled={unlockingId === document.id}
              className="documents-action-button documents-action-button--ghost disabled:opacity-60"
            >
              {unlockingId === document.id ? t("documents.unlocking") : t("documents.unlockFolder")}
            </button>
          </div>
        ) : (
          <p>{t("documents.noFolder")}</p>
        )}
      </div>
    </article>
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
  type?: "number" | "password" | "text" | "url";
}) {
  return (
    <label className="documents-field">
      {label}
      <input
        name={name}
        type={type}
        autoComplete={type === "url" ? "url" : "off"}
        inputMode={type === "number" ? "numeric" : undefined}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        min={type === "number" ? "0" : undefined}
        step={type === "number" ? "1" : undefined}
        className="documents-input"
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
    <label className="documents-field">
      {label}
      <select
        name={name}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="documents-input"
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
  const activeTravelers = travelers.filter((traveler) => traveler.isActive !== false);
  const travelerIds = new Set(activeTravelers.map((traveler) => traveler.id));
  const validStatuses = form.statuses.filter((status) => travelerIds.has(status.travelerId));

  if (validStatuses.length === activeTravelers.length) {
    return {
      ...form,
      statuses: validStatuses
    };
  }

  return {
    ...form,
    statuses: defaultStatuses(activeTravelers)
  };
}
