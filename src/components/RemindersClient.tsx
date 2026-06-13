"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  reminderPriorities,
  type ReminderInput,
  type ReminderPriority,
  type SharedReminder
} from "@/lib/sharedDataTypes";

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
  const [reminders, setReminders] = useState<SharedReminder[]>([]);
  const [priorityFilter, setPriorityFilter] = useState<"All" | ReminderPriority>("All");
  const [form, setForm] = useState<FormState>(() => emptyForm(participants[0] ?? "Person A"));
  const [expanded, setExpanded] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

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
        throw new Error(data.error ?? "Unable to load reminders.");
      }

      setReminders(data.reminders ?? []);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load reminders.");
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
    resetForm();
    setExpanded(true);
  }

  function startEditing(reminder: SharedReminder) {
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

    if (!form.text.trim()) {
      setError("Reminder text is required.");
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
        throw new Error(data.error ?? "Unable to save reminder.");
      }

      setReminders(data.reminders ?? []);
      resetForm();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to save reminder.");
    } finally {
      setSubmitting(false);
    }
  }

  async function removeReminder(reminder: SharedReminder) {
    if (!window.confirm(`Delete "${reminder.text}" from reminders?`)) {
      return;
    }

    setDeletingId(reminder.id);
    setError(null);

    try {
      const response = await fetch(`/api/reminders/${reminder.id}`, { method: "DELETE" });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Unable to delete reminder.");
      }

      setReminders(data.reminders ?? []);
      if (editingId === reminder.id) {
        resetForm();
      }
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Unable to delete reminder.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <section className="rounded-lg border border-zinc-200 bg-white p-4 shadow-soft">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-terracotta">
            Important reminders
          </p>
          <h2 className="mt-1 text-lg font-semibold text-ink">Top shared notes</h2>
          <p className="mt-1 text-sm leading-6 text-zinc-600">
            Showing the highest priority reminders first.
          </p>
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
          <button
            type="button"
            onClick={startAdding}
            className="w-full rounded-md bg-moss px-3 py-2 text-sm font-semibold text-white sm:w-auto"
          >
            Add reminder
          </button>
          <button
            type="button"
            onClick={() => setExpanded((current) => !current)}
            className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold text-ink sm:w-auto"
          >
            {expanded ? "Show less" : "Manage"}
          </button>
        </div>
      </div>

      {expanded ? (
        <>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <label className="text-sm font-semibold text-ink">
              Filter
              <select
                value={priorityFilter}
                onChange={(event) => setPriorityFilter(event.target.value as "All" | ReminderPriority)}
                className="ml-2 rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-700"
              >
                <option value="All">All priorities</option>
                {reminderPriorities.map((priority) => (
                  <option key={priority} value={priority}>
                    {priority}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <form onSubmit={submitReminder} className="mt-3 grid gap-3 rounded-lg bg-zinc-50 p-3">
            <label className="text-sm font-semibold text-ink">
              Reminder
              <input
                value={form.text}
                onChange={(event) => setForm((current) => ({ ...current, text: event.target.value }))}
                className="mt-2 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-700"
                placeholder="Example: Confirm hotel address"
              />
            </label>
            <div className="grid gap-3 sm:grid-cols-3">
              <label className="text-sm font-semibold text-ink">
                Priority
                <select
                  value={form.priority}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, priority: event.target.value as ReminderPriority }))
                  }
                  className="mt-2 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-700"
                >
                  {reminderPriorities.map((priority) => (
                    <option key={priority} value={priority}>
                      {priority}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-sm font-semibold text-ink">
                Created by
                <select
                  value={form.createdBy}
                  onChange={(event) => setForm((current) => ({ ...current, createdBy: event.target.value }))}
                  className="mt-2 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-700"
                >
                  {participants.map((participant) => (
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
                  {submitting ? "Saving..." : editingId ? "Save changes" : "Add reminder"}
                </button>
                {editingId ? (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold text-ink"
                  >
                    Cancel
                  </button>
                ) : null}
              </div>
            </div>
          </form>
        </>
      ) : null}

      {error ? (
        <p className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      {loading ? <p className="mt-4 text-sm text-zinc-600">Loading reminders...</p> : null}

      {!loading && displayedReminders.length === 0 ? (
        <p className="mt-4 rounded-lg bg-zinc-50 px-3 py-4 text-sm text-zinc-600">
          {expanded ? "No reminders match this filter yet." : "No reminders yet."}
        </p>
      ) : null}

      <ul className="mt-4 space-y-2">
        {displayedReminders.map((reminder) => (
          <li key={reminder.id} className="rounded-lg bg-zinc-50 px-3 py-3 text-sm text-zinc-700">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`rounded-full px-2 py-1 text-xs font-semibold ${priorityClass[reminder.priority]}`}>
                    {reminder.priority}
                  </span>
                  <span className="text-xs text-zinc-500">By {reminder.createdBy}</span>
                </div>
                <p className="mt-2 break-words leading-6 text-ink">{reminder.text}</p>
              </div>
              <div className="flex shrink-0 gap-2">
                <button
                  type="button"
                  onClick={() => startEditing(reminder)}
                  className="rounded-md border border-zinc-200 bg-white px-2 py-1 text-xs font-semibold text-ink"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => void removeReminder(reminder)}
                  disabled={deletingId === reminder.id}
                  className="rounded-md border border-red-200 bg-white px-2 py-1 text-xs font-semibold text-red-700 disabled:opacity-60"
                >
                  {deletingId === reminder.id ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>

      {!expanded && reminders.length > 3 ? (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="mt-3 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold text-ink"
        >
          Show all {reminders.length} reminders
        </button>
      ) : null}
    </section>
  );
}
