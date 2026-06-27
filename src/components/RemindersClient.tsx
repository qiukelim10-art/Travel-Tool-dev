"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useTripAccess } from "@/lib/access";
import {
  reminderPriorities,
  type ReminderInput,
  type ReminderPriority,
  type SharedReminder
} from "@/lib/sharedDataTypes";
import { useLanguage } from "@/lib/i18n";
import { translateOption } from "@/lib/localize";

type RemindersClientProps = {
  participants: string[];
};

type FormState = ReminderInput;

const emptyForm = (createdBy: string): FormState => ({
  text: "",
  priority: "Medium",
  createdBy
});

const priorityClass: Record<ReminderPriority, string> = {
  High: "bg-red-100 text-red-800",
  Medium: "bg-amber-100 text-amber-800",
  Low: "bg-zinc-100 text-zinc-700"
};

export function RemindersClient({ participants }: RemindersClientProps) {
  const { language, t } = useLanguage();
  const { mode } = useTripAccess();
  const canEdit = mode === "editor";
  const [reminders, setReminders] = useState<SharedReminder[]>([]);
  const [priorityFilter, setPriorityFilter] = useState<"All" | ReminderPriority>("All");
  const [form, setForm] = useState<FormState>(() => emptyForm(participants[0] ?? "Person A"));
  const [expanded, setExpanded] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const formParticipants = useMemo(
    () => (participants.includes(form.createdBy) ? participants : [form.createdBy, ...participants].filter(Boolean)),
    [form.createdBy, participants]
  );

  const visibleReminders = useMemo(
    () =>
      priorityFilter === "All"
        ? reminders
        : reminders.filter((reminder) => reminder.priority === priorityFilter),
    [priorityFilter, reminders]
  );
  const displayedReminders = expanded ? visibleReminders : reminders.slice(0, 3);

  async function loadReminders() {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/reminders");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? t("reminders.errorLoad"));
      }

      setReminders(data.reminders ?? []);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : t("reminders.errorLoad"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadReminders();
  }, []);

  function resetForm() {
    setEditingId(null);
    setForm(emptyForm(participants[0] ?? "Person A"));
  }

  function startAdding() {
    if (!canEdit) {
      setError("Private trip access is required to add reminders.");
      return;
    }

    resetForm();
    setExpanded(true);
  }

  function startEditing(reminder: SharedReminder) {
    if (!canEdit) {
      setError("Private trip access is required to edit reminders.");
      return;
    }

    setExpanded(true);
    setEditingId(reminder.id);
    setForm({
      text: reminder.text,
      priority: reminder.priority,
      createdBy: reminder.createdBy
    });
  }

  async function submitReminder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!canEdit) {
      setError("Private trip access is required to save reminders.");
      return;
    }

    if (!form.text.trim()) {
      setError(t("reminders.required"));
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch(editingId ? `/api/reminders/${editingId}` : "/api/reminders", {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? t("reminders.errorSave"));
      }

      setReminders(data.reminders ?? []);
      resetForm();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : t("reminders.errorSave"));
    } finally {
      setSubmitting(false);
    }
  }

  async function removeReminder(reminder: SharedReminder) {
    if (!canEdit) {
      setError("Private trip access is required to delete reminders.");
      return;
    }

    if (!window.confirm(t("reminders.confirmDelete"))) {
      return;
    }

    setDeletingId(reminder.id);
    setError(null);

    try {
      const response = await fetch(`/api/reminders/${reminder.id}`, { method: "DELETE" });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? t("reminders.errorDelete"));
      }

      setReminders(data.reminders ?? []);
      if (editingId === reminder.id) {
        resetForm();
      }
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : t("reminders.errorDelete"));
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <section className="reminders-card rounded-lg border border-zinc-200 bg-white p-4 shadow-soft">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="reminders-card__topline">
            <h2 className="text-lg font-semibold text-ink">{t("reminders.title")}</h2>
            <div className="grid w-full grid-cols-2 gap-2 sm:w-auto">
              <button
                type="button"
                onClick={startAdding}
                data-edit-required={!canEdit ? "true" : undefined}
                title={!canEdit ? "Private trip access is required to add reminders." : undefined}
                className="rounded-md bg-moss px-3 py-2 text-sm font-semibold text-white"
              >
                {t("reminders.add")}
              </button>
              <button
                type="button"
                onClick={() => setExpanded((current) => !current)}
                className="rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold text-ink"
              >
                {expanded ? t("reminders.showLess") : canEdit ? t("reminders.manage") : t("common.view")}
              </button>
            </div>
          </div>
          <p className="mt-1 text-sm leading-6 text-zinc-600">
            {t("reminders.description")}
          </p>
        </div>
      </div>

      {expanded ? (
        <>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <label className="text-sm font-semibold text-ink">
              {t("common.filter")}
              <select
                value={priorityFilter}
                onChange={(event) => setPriorityFilter(event.target.value as "All" | ReminderPriority)}
                className="ml-2 rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-700"
              >
                <option value="All">{t("reminders.filterAll")}</option>
                {reminderPriorities.map((priority) => (
                  <option key={priority} value={priority}>
                    {translateOption(language, priority)}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {canEdit ? (
            <form onSubmit={submitReminder} className="mt-3 grid gap-3 rounded-lg bg-zinc-50 p-3">
              <label className="text-sm font-semibold text-ink">
                {t("reminders.label")}
                <input
                  value={form.text}
                  onChange={(event) => setForm((current) => ({ ...current, text: event.target.value }))}
                  className="mt-2 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-700"
                  placeholder={t("reminders.placeholder")}
                />
              </label>
              <div className="grid gap-3 sm:grid-cols-3">
                <label className="text-sm font-semibold text-ink">
                  {t("common.priority")}
                  <select
                    value={form.priority}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, priority: event.target.value as ReminderPriority }))
                    }
                    className="mt-2 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-700"
                  >
                    {reminderPriorities.map((priority) => (
                      <option key={priority} value={priority}>
                        {translateOption(language, priority)}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-sm font-semibold text-ink">
                  {t("common.createdBy")}
                  <select
                    value={form.createdBy}
                    onChange={(event) => setForm((current) => ({ ...current, createdBy: event.target.value }))}
                    className="mt-2 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-700"
                  >
                    {formParticipants.map((participant) => (
                      <option key={participant} value={participant}>
                        {participant}
                      </option>
                    ))}
                  </select>
                </label>
                <div className="flex items-end gap-2">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="rounded-md bg-moss px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"
                  >
                    {submitting
                      ? t("reminders.saving")
                      : editingId
                        ? t("reminders.saveChanges")
                        : t("reminders.add")}
                  </button>
                  {editingId ? (
                    <button
                      type="button"
                      onClick={resetForm}
                      className="rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold text-ink"
                    >
                      {t("common.cancel")}
                    </button>
                  ) : null}
                </div>
              </div>
            </form>
          ) : (
            <p className="mt-3 rounded-lg bg-zinc-50 px-3 py-4 text-sm text-zinc-600">
              Private trip access is required to add, edit, or delete reminders.
            </p>
          )}
        </>
      ) : null}

      {error ? (
        <p
          role="alert"
          className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
        >
          {error}
        </p>
      ) : null}

      {loading ? (
        <p role="status" aria-live="polite" className="mt-4 text-sm text-zinc-600">
          {t("common.loading")}…
        </p>
      ) : null}

      {!loading && displayedReminders.length === 0 ? (
        <p className="mt-4 rounded-lg bg-zinc-50 px-3 py-4 text-sm text-zinc-600">
          {expanded ? t("reminders.emptyFiltered") : t("reminders.empty")}
        </p>
      ) : null}

      <ul className="reminders-card__list mt-4 space-y-2">
        {displayedReminders.map((reminder) => (
          <li key={reminder.id} className="reminders-card__item rounded-lg bg-zinc-50 px-3 py-2 text-sm text-zinc-700">
            <div className="reminders-card__item-body flex items-start justify-between gap-3">
              <div className="reminders-card__content min-w-0">
                <div className="reminders-card__meta flex flex-wrap items-center gap-2">
                  <span className={`rounded-full px-2 py-1 text-xs font-semibold ${priorityClass[reminder.priority]}`}>
                    {translateOption(language, reminder.priority)}
                  </span>
                  <span className="text-xs text-zinc-500">
                    {t("common.by")} {reminder.createdBy}
                  </span>
                </div>
                <p className="reminders-card__text mt-2 break-words leading-5 text-ink">{reminder.text}</p>
              </div>
              {canEdit && expanded ? (
                <div className="reminders-card__actions flex shrink-0 gap-1.5">
                  <button
                    type="button"
                    onClick={() => startEditing(reminder)}
                    className="rounded-md border border-zinc-200 bg-white px-2 py-1.5 text-xs font-semibold text-ink"
                  >
                    {t("common.edit")}
                  </button>
                  <button
                    type="button"
                    onClick={() => void removeReminder(reminder)}
                    disabled={deletingId === reminder.id}
                    className="rounded-md border border-red-200 bg-white px-2 py-1.5 text-xs font-semibold text-red-700 disabled:opacity-60"
                  >
                    {deletingId === reminder.id ? t("reminders.deleting") : t("common.delete")}
                  </button>
                </div>
              ) : null}
            </div>
          </li>
        ))}
      </ul>

      {!expanded && reminders.length > 3 ? (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="reminders-card__show-all mt-3 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold text-ink"
        >
          {t("reminders.showAll", { count: reminders.length })}
        </button>
      ) : null}
    </section>
  );
}
