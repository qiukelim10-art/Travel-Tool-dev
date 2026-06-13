"use client";

import Link from "next/link";
import { DashboardBudgetWidget } from "@/components/DashboardBudgetWidget";
import { EmergencyQuickAccess } from "@/components/EmergencyQuickAccess";
import { RemindersClient } from "@/components/RemindersClient";
import { StatusBadge } from "@/components/StatusBadge";
import { bookings, itinerary, tripInfo, type Booking } from "@/data/tripData";
import { useLanguage } from "@/lib/i18n";
import { translateText } from "@/lib/localize";

const attentionStatuses = ["Need Confirmation", "Not Booked", "Pending"] as const;

const quickActions = [
  { href: "/itinerary", labelKey: "dashboard.action.plan", detailKey: "dashboard.action.planDetail" },
  {
    href: "/bookings",
    labelKey: "dashboard.action.bookings",
    detailKey: "dashboard.action.bookingsDetail"
  },
  { href: "/budget", labelKey: "dashboard.action.money", detailKey: "dashboard.action.moneyDetail" },
  { href: "/packing", labelKey: "dashboard.action.packing", detailKey: "dashboard.action.packingDetail" },
  {
    href: "/documents",
    labelKey: "dashboard.action.documents",
    detailKey: "dashboard.action.documentsDetail"
  }
] as const;

export default function DashboardPage() {
  const { t } = useLanguage();
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
  const cities = tripInfo.cities.join(" -> ");
  const tripDates = `${formatDate(tripInfo.startDate)} - ${formatDate(tripInfo.endDate)}`;

  return (
    <div className="space-y-5">
      <section className="rounded-lg border border-zinc-200 bg-white p-4 shadow-soft">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-terracotta">
              {t("dashboard.eyebrow")}
            </p>
            <h1 className="mt-1 break-words text-2xl font-semibold text-ink sm:text-3xl">
              {tripInfo.title}
            </h1>
            <p className="mt-2 text-sm leading-6 text-zinc-600">
              {tripDates} - {tripInfo.participants.length} {t("dashboard.travellers")}
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
  const { t } = useLanguage();

  return (
    <article className="rounded-lg border border-zinc-200 bg-white p-4 shadow-soft">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-terracotta">
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
    <article className="rounded-lg border border-zinc-200 bg-white p-4 shadow-soft">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-terracotta">
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
          <p className="rounded-md bg-zinc-50 px-3 py-3 text-sm text-zinc-600">
            {t("dashboard.noBookingAttention")}
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

function QuickActions() {
  const { t } = useLanguage();

  return (
    <section className="rounded-lg border border-zinc-200 bg-white p-3 shadow-soft">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.08em] text-terracotta">
          {t("dashboard.quickActions")}
        </p>
        <p className="mt-1 text-sm text-zinc-600">{t("dashboard.quickActionsHint")}</p>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-5">
        {quickActions.map((action) => (
          <Link
            key={action.href}
            href={action.href}
            className="min-w-0 rounded-md border border-zinc-200 bg-zinc-50 px-3 py-3 hover:border-moss hover:bg-white"
          >
            <p className="truncate text-sm font-semibold text-ink">{t(action.labelKey)}</p>
            <p className="mt-1 truncate text-xs text-zinc-500">{t(action.detailKey)}</p>
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
