"use client";

import Link from "next/link";
import { DashboardBudgetWidget } from "@/components/DashboardBudgetWidget";
import { EmergencyQuickAccess } from "@/components/EmergencyQuickAccess";
import { RemindersClient } from "@/components/RemindersClient";
import { StatusBadge } from "@/components/StatusBadge";
import { bookings, itinerary, tripInfo, type Booking } from "@/data/tripData";
import { useLanguage } from "@/lib/i18n";
import { localizeItem, translateText } from "@/lib/localize";

const attentionStatuses = ["Need Confirmation", "Not Booked", "Pending"] as const;

const quickActions = [
  { href: "/itinerary", label: "Plan", detail: "Daily route" },
  { href: "/bookings", label: "Bookings", detail: "Confirmations" },
  { href: "/budget", label: "Money", detail: "Shared costs" },
  { href: "/packing", label: "Packing", detail: "Checklist" },
  { href: "/documents", label: "Documents", detail: "Safe links" }
];

export default function DashboardPage() {
  const { language } = useLanguage();
  const nextDay = localizeItem(language, itinerary[0]);
  const pendingBookings = bookings.filter((booking) =>
    attentionStatuses.includes(booking.status as (typeof attentionStatuses)[number])
  );
  const priorityBookings = pendingBookings
    .slice()
    .sort(
      (left, right) =>
        attentionScore(right.status) - attentionScore(left.status) ||
        left.date.localeCompare(right.date)
    )
    .slice(0, 3);
  const cities = tripInfo.cities.map((city) => translateText(language, city) ?? city).join(" -> ");
  const tripTitle = translateText(language, tripInfo.title) ?? tripInfo.title;
  const tripDates = `${formatDate(tripInfo.startDate)} - ${formatDate(tripInfo.endDate)}`;

  return (
    <div className="space-y-5">
      <section className="rounded-lg border border-zinc-200 bg-white p-4 shadow-soft">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-terracotta">
              Private trip dashboard
            </p>
            <h1 className="mt-1 break-words text-2xl font-semibold text-ink sm:text-3xl">
              {tripTitle}
            </h1>
            <p className="mt-2 text-sm leading-6 text-zinc-600">
              {tripDates} - {tripInfo.participants.length} travellers
            </p>
            <p className="mt-1 break-words text-sm leading-6 text-zinc-600">{cities}</p>
          </div>
          <EmergencyQuickAccess />
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <NextPlanCard day={nextDay} />
        <NeedsAttentionCard bookings={priorityBookings} totalCount={pendingBookings.length} />
      </section>

      <QuickActions />

      <section className="grid gap-5 lg:grid-cols-[1fr_0.95fr]">
        <DashboardBudgetWidget />
        <RemindersClient participants={tripInfo.participants} />
      </section>
    </div>
  );
}

function NextPlanCard({ day }: { day: (typeof itinerary)[number] }) {
  return (
    <article className="rounded-lg border border-zinc-200 bg-white p-4 shadow-soft">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-terracotta">
            Next up
          </p>
          <h2 className="mt-1 break-words text-lg font-semibold text-ink">
            Day {day.day}: {day.title}
          </h2>
          <p className="mt-1 text-sm text-zinc-500">
            {formatDate(day.date)} - {day.city}
          </p>
          <p className="mt-2 line-clamp-2 text-sm leading-6 text-zinc-600">{day.highlight}</p>
        </div>
        <Link
          href="/itinerary"
          className="w-full rounded-md bg-moss px-3 py-2 text-center text-sm font-semibold text-white sm:w-auto"
        >
          View itinerary
        </Link>
      </div>
    </article>
  );
}

function NeedsAttentionCard({
  bookings,
  totalCount
}: {
  bookings: Booking[];
  totalCount: number;
}) {
  return (
    <article className="rounded-lg border border-zinc-200 bg-white p-4 shadow-soft">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-terracotta">
            Needs attention
          </p>
          <h2 className="mt-1 text-lg font-semibold text-ink">
            {totalCount} booking {totalCount === 1 ? "item" : "items"}
          </h2>
          <p className="mt-1 text-sm leading-6 text-zinc-600">
            Pending, not booked, or waiting for confirmation.
          </p>
        </div>
        <Link
          href="/bookings"
          className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-center text-sm font-semibold text-ink sm:w-auto"
        >
          Open bookings
        </Link>
      </div>

      <div className="mt-3 space-y-2">
        {bookings.length === 0 ? (
          <p className="rounded-md bg-zinc-50 px-3 py-3 text-sm text-zinc-600">
            No booking items need attention right now.
          </p>
        ) : null}
        {bookings.map((booking) => (
          <div
            key={booking.id}
            className="flex min-w-0 flex-col gap-2 rounded-md bg-zinc-50 px-3 py-2 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="min-w-0">
              <p className="break-words text-sm font-semibold text-ink">{booking.title}</p>
              <p className="mt-0.5 text-xs text-zinc-500">
                {booking.category} - {booking.date}
              </p>
            </div>
            <StatusBadge status={booking.status} />
          </div>
        ))}
      </div>
    </article>
  );
}

function QuickActions() {
  return (
    <section className="rounded-lg border border-zinc-200 bg-white p-3 shadow-soft">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.08em] text-terracotta">
          Quick actions
        </p>
        <p className="mt-1 text-sm text-zinc-600">Jump to the full tools when you need details.</p>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-5">
        {quickActions.map((action) => (
          <Link
            key={action.href}
            href={action.href}
            className="min-w-0 rounded-md border border-zinc-200 bg-zinc-50 px-3 py-3 hover:border-moss hover:bg-white"
          >
            <p className="truncate text-sm font-semibold text-ink">{action.label}</p>
            <p className="mt-1 truncate text-xs text-zinc-500">{action.detail}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}

function attentionScore(status: Booking["status"]) {
  if (status === "Need Confirmation") {
    return 3;
  }

  if (status === "Not Booked") {
    return 2;
  }

  if (status === "Pending") {
    return 1;
  }

  return 0;
}

function formatDate(value: string) {
  const [, month, day] = value.split("-");
  return `${month}/${day}`;
}
