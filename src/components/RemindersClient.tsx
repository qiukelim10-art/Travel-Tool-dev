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

  function startEditing(reminder: SharedReminder) {
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
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-terracotta">
            Important reminders
          </p>
          <p className="mt-1 text-sm text-zinc-600">
            Add shared reminders and keep the highest priority items at the top.
          </p>
        </div>
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

      <form onSubmit={submitReminder} className="mt-4 grid gap-3 rounded-lg bg-zinc-50 p-3">
        <label className="text-sm font-semibold text-ink">
          Reminder
          <input
            value={form.text}
            onChange={(event) => setForm((current) => ({ ...current, text: event.target.value }))}
            className="mt-2 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-700"
            placeholder="Example: Confirm Rome hotel address"
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

      {error ? (
        <p className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      {loading ? <p className="mt-4 text-sm text-zinc-600">Loading reminders...</p> : null}

      {!loading && visibleReminders.length === 0 ? (
        <p className="mt-4 rounded-lg bg-zinc-50 px-3 py-4 text-sm text-zinc-600">
          No reminders match this filter yet.
        </p>
      ) : null}

      <ul className="mt-4 space-y-3">
        {visibleReminders.map((reminder) => (
          <li key={reminder.id} className="rounded-lg bg-zinc-50 px-3 py-3 text-sm text-zinc-700">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`rounded-full px-2 py-1 text-xs font-semibold ${priorityClass[reminder.priority]}`}>
                    {reminder.priority}
                  </span>
                  <span className="text-xs text-zinc-500">By {reminder.createdBy}</span>
                </div>
                <p className="mt-2 leading-6 text-ink">{reminder.text}</p>
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
    </section>
  );
}
