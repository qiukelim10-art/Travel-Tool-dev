"use client";

import Link from "next/link";
import { DashboardCard } from "@/components/DashboardCard";
import { RemindersClient } from "@/components/RemindersClient";
import { SectionHeader } from "@/components/SectionHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { bookings, expenses, itinerary, tripInfo } from "@/data/tripData";
import { useLanguage } from "@/lib/i18n";
import { formatMoney, summarizeBudget } from "@/lib/budget";
import { localizeItem, translateText } from "@/lib/localize";

export default function DashboardPage() {
  const { language, t } = useLanguage();
  const nextDay = localizeItem(language, itinerary[0]);
  const budgetSummaries = summarizeBudget(expenses, tripInfo.participants);
  const pendingBookings = bookings.filter((booking) =>
    ["Not Booked", "Pending", "Need Confirmation"].includes(booking.status)
  );
  const statusRows = [
    [translateText(language, "Flights"), tripInfo.status.flights],
    [translateText(language, "Hotels"), tripInfo.status.hotels],
    [translateText(language, "Trains"), tripInfo.status.trains],
    [translateText(language, "Attractions"), tripInfo.status.attractions],
    [translateText(language, "Insurance"), tripInfo.status.insurance],
    [language === "zh" ? "入境" : "Entry", tripInfo.status.entryRequirement]
  ] as const;

  return (
    <div>
      <SectionHeader
        eyebrow={t("page.dashboard.eyebrow")}
        title={translateText(language, tripInfo.title) ?? tripInfo.title}
        description={translateText(language, tripInfo.privacyNote)}
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <DashboardCard
          label={t("page.dashboard.tripDates")}
          value={t("page.dashboard.tripDatesValue")}
          detail={`${translateText(language, tripInfo.month)}. ${tripInfo.participants.length} ${t("page.dashboard.travellers")}.`}
        />
        <DashboardCard
          label={t("page.dashboard.cities")}
          value={tripInfo.cities.map((city) => translateText(language, city)).join(" -> ")}
          detail={t("page.dashboard.routeDetail")}
        />
        <DashboardCard
          label={t("page.dashboard.nextDeadline")}
          value={tripInfo.nextDeadline.date}
          detail={`${translateText(language, tripInfo.nextDeadline.title)}. ${t("common.owner")}: ${translateText(language, tripInfo.nextDeadline.owner)}.`}
          tone="warm"
        />
        <DashboardCard
          label={t("nav.emergency")}
          value="112"
          detail={t("page.dashboard.emergencyDetail")}
          tone="urgent"
        />
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
        <section className="rounded-lg border border-zinc-200 bg-white p-4 shadow-soft">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-terracotta">
                {t("page.dashboard.nextItineraryDay")}
              </p>
              <h2 className="mt-1 text-2xl font-semibold text-ink">
                {language === "zh" ? `第 ${nextDay.day} 天` : `Day ${nextDay.day}`}: {nextDay.title}
              </h2>
              <p className="mt-2 text-sm leading-6 text-zinc-600">{nextDay.highlight}</p>
            </div>
            <Link href="/itinerary" className="rounded-md bg-moss px-3 py-2 text-sm font-semibold text-white">
              {t("common.view")}
            </Link>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <MiniBlock title={t("page.itinerary.morning")} items={nextDay.morning} />
            <MiniBlock title={t("page.itinerary.transport")} items={nextDay.transport} />
            <MiniBlock title={t("page.itinerary.tickets")} items={nextDay.tickets} />
          </div>
        </section>

        <section className="rounded-lg border border-zinc-200 bg-white p-4 shadow-soft">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-terracotta">
            {t("page.dashboard.bookingProgress")}
          </p>
          <div className="mt-4 space-y-3">
            {statusRows.map(([label, status]) => (
              <div key={label} className="flex items-center justify-between gap-3">
                <span className="text-sm font-medium text-ink">{label}</span>
                <StatusBadge status={status} />
              </div>
            ))}
          </div>
          <p className="mt-4 text-sm text-zinc-600">
            {pendingBookings.length} {t("page.dashboard.itemsNeedAction")}
          </p>
        </section>
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        <section className="rounded-lg border border-zinc-200 bg-white p-4 shadow-soft">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-terracotta">
            {t("page.dashboard.budgetOverview")}
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {budgetSummaries.map((summary) => (
              <div key={summary.currency} className="rounded-lg bg-zinc-50 p-3">
                <p className="text-sm font-semibold text-ink">{summary.currency}</p>
                <p className="mt-1 text-xl font-semibold text-ink">
                  {formatMoney(summary.total, summary.currency)}
                </p>
                <p className="mt-1 text-sm text-zinc-600">
                  {formatMoney(summary.costPerPerson, summary.currency)} {t("page.dashboard.perPerson")}
                </p>
              </div>
            ))}
          </div>
          <Link
            href="/budget"
            className="mt-4 inline-flex rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold text-ink"
          >
            {t("page.dashboard.openBudget")}
          </Link>
        </section>

        <RemindersClient participants={tripInfo.participants} />
      </div>
    </div>
  );
}

function MiniBlock({ title, items }: { title: string; items: string[] }) {
  return (
    <section className="rounded-lg bg-zinc-50 p-3">
      <h3 className="text-sm font-semibold text-ink">{title}</h3>
      <ul className="mt-2 space-y-1">
        {items.slice(0, 2).map((item) => (
          <li key={item} className="text-sm leading-6 text-zinc-600">
            {item}
          </li>
        ))}
      </ul>
    </section>
  );
}
