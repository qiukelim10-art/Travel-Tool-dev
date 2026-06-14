"use client";

import Link from "next/link";
import { DashboardBudgetWidget } from "@/components/DashboardBudgetWidget";
import { EmergencyQuickAccess } from "@/components/EmergencyQuickAccess";
import { RemindersClient } from "@/components/RemindersClient";
import { StatusBadge } from "@/components/StatusBadge";
import { bookings, itinerary, type Booking } from "@/data/tripData";
import { useLanguage } from "@/lib/i18n";
import { translateText } from "@/lib/localize";
import { useTripSettingsView } from "@/lib/useTripSettings";

const attentionStatuses = ["Need Confirmation", "Not Booked", "Pending"] as const;

export default function DashboardPage() {
  const { t } = useLanguage();
  const { trip } = useTripSettingsView();
  const nextDay = itinerary[0];
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
  const destinationRoute = trip.destination
    ? `${trip.destination}: ${trip.routeLabel}`
    : trip.routeLabel;

  return (
    <div className="space-y-5">
      <section className="travel-cover p-5 sm:p-6">
        <div className="relative grid gap-4 lg:grid-cols-[minmax(0,1fr)_18rem]">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="rounded-full bg-white/75 px-3 py-1 text-xs font-semibold uppercase tracking-[0.08em] text-stamp">
                {t("dashboard.eyebrow")}
              </p>
              <span className="rounded-full bg-sky/70 px-3 py-1 text-xs font-semibold text-signal">
                {trip.travelerCount} {t("dashboard.travellers")}
              </span>
            </div>
            <h1 className="mt-4 max-w-3xl break-words text-3xl font-semibold leading-tight text-ink sm:text-4xl lg:text-5xl">
              {trip.name}
            </h1>
            <p className="mt-3 max-w-3xl break-words text-sm leading-6 text-zinc-700 sm:text-base">
              {destinationRoute}
            </p>
            <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3">
              <TripSignal
                href="/settings"
                label={t("dashboard.dates")}
                value={trip.dateRangeLabel}
                actionLabel={t("common.edit")}
                className="order-1"
              />
              <TripSignal
                href="/itinerary"
                label={t("dashboard.route")}
                value={trip.routeLabel}
                actionLabel={t("dashboard.action.plan")}
                className="order-3 col-span-2 sm:order-2 sm:col-span-1"
                showFullValue
              />
              <TripSignal
                href="/settings"
                label={t("dashboard.crew")}
                value={`${trip.travelerCount} ${t("dashboard.travellers")}`}
                actionLabel={t("common.edit")}
                className="order-2 sm:order-3"
              />
            </div>
          </div>
          <div className="grid gap-3">
            <NextPlanMini day={nextDay} />
            <EmergencyQuickAccess />
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <NextPlanCard day={nextDay} />
        <NeedsAttentionCard bookings={priorityBookings} totalCount={pendingBookings.length} />
      </section>

      <section className="grid gap-5 lg:grid-cols-[1fr_0.95fr]">
        <DashboardBudgetWidget />
        <RemindersClient participants={trip.travelerDisplayNames} />
      </section>
    </div>
  );
}

function TripSignal({
  actionLabel,
  className = "",
  href,
  label,
  showFullValue = false,
  value
}: {
  actionLabel: string;
  className?: string;
  href: string;
  label: string;
  showFullValue?: boolean;
  value: string;
}) {
  return (
    <Link
      href={href}
      className={`group min-w-0 rounded-md border border-white/60 bg-white/74 px-2 py-2 transition hover:border-route/40 hover:bg-white focus-visible:bg-white sm:px-3 ${className}`}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="truncate text-[0.62rem] font-semibold uppercase tracking-[0.08em] text-zinc-500 sm:text-[0.68rem]">
          {label}
        </p>
        <span className="shrink-0 text-[0.62rem] font-semibold text-route opacity-80 group-hover:opacity-100">
          {actionLabel}
        </span>
      </div>
      <p
        className={`mt-1 min-w-0 text-xs font-semibold text-ink sm:text-sm ${
          showFullValue ? "break-words leading-5" : "truncate"
        }`}
      >
        {value}
      </p>
    </Link>
  );
}

function NextPlanMini({ day }: { day: (typeof itinerary)[number] }) {
  const { t } = useLanguage();

  return (
    <div className="rounded-lg border border-white/70 bg-white/78 p-3 shadow-soft backdrop-blur-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.08em] text-stamp">
        {t("dashboard.nextUp")}
      </p>
      <p className="mt-1 line-clamp-1 break-words text-base font-semibold text-ink">
        {t("dashboard.day", { day: day.day })}: {day.title}
      </p>
      <p className="mt-1 text-sm text-zinc-600">
        {formatDate(day.date)} - {day.city}
      </p>
      <Link
        href="/itinerary"
        className="mt-3 inline-flex min-h-10 w-full items-center justify-center rounded-md bg-moss px-3 py-2 text-sm font-semibold text-white shadow-sm sm:w-auto"
      >
        {t("dashboard.viewItinerary")}
      </Link>
    </div>
  );
}

function NextPlanCard({ day }: { day: (typeof itinerary)[number] }) {
  const { t } = useLanguage();

  return (
    <article className="travel-panel hidden p-4 sm:block">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="route-line min-w-0 space-y-3 pl-9">
          <div>
            <span className="route-dot absolute left-0 top-0" />
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-stamp">
              {t("dashboard.nextUp")}
            </p>
            <h2 className="mt-1 break-words text-lg font-semibold text-ink">
              {t("dashboard.day", { day: day.day })}: {day.title}
            </h2>
            <p className="mt-1 text-sm text-zinc-500">
              {formatDate(day.date)} - {day.city}
            </p>
            <p className="mt-2 line-clamp-2 text-sm leading-6 text-zinc-600">{day.highlight}</p>
          </div>
        </div>
        <Link
          href="/itinerary"
          className="w-full rounded-md bg-moss px-3 py-2 text-center text-sm font-semibold text-white sm:w-auto"
        >
          {t("dashboard.viewItinerary")}
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
  const { language, t } = useLanguage();

  return (
    <article className="status-strip p-4 shadow-soft">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-stamp">
            {t("dashboard.needsAttention")}
          </p>
          <h2 className="mt-1 text-lg font-semibold text-ink">
            {totalCount}{" "}
            {totalCount === 1 ? t("dashboard.bookingItem") : t("dashboard.bookingItems")}
          </h2>
          <p className="mt-1 text-sm leading-6 text-zinc-600">
            {t("dashboard.attentionHint")}
          </p>
        </div>
        <Link
          href="/bookings"
          className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-center text-sm font-semibold text-ink sm:w-auto"
        >
          {t("dashboard.openBookings")}
        </Link>
      </div>

      <div className="mt-3 space-y-2">
        {bookings.length === 0 ? (
          <p className="rounded-md bg-white/70 px-3 py-3 text-sm text-zinc-600">
            {t("dashboard.noBookingAttention")}
          </p>
        ) : null}
        {bookings.map((booking) => (
          <div
            key={booking.id}
            className="flex min-w-0 flex-col gap-2 rounded-md bg-white/72 px-3 py-2 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="min-w-0">
              <p className="break-words text-sm font-semibold text-ink">{booking.title}</p>
              <p className="mt-0.5 text-xs text-zinc-500">
                {translateText(language, booking.category)} - {booking.date}
              </p>
            </div>
            <StatusBadge status={booking.status} />
          </div>
        ))}
      </div>
    </article>
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
