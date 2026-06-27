"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { EmergencyQuickAccess } from "@/components/EmergencyQuickAccess";
import { RemindersClient } from "@/components/RemindersClient";
import { SetupGenerationPanel } from "@/components/SetupGenerationPanel";
import { StatusBadge } from "@/components/StatusBadge";
import { TripRouteMap } from "@/components/TripRouteMap";
import { getDestinationVisualIdentity, type DestinationVisualIdentity } from "@/lib/destinationVisuals";
import { useLanguage, type Language } from "@/lib/i18n";
import { translateText } from "@/lib/localize";
import type { SharedBooking, SharedItineraryItem } from "@/lib/sharedDataTypes";
import { useTripSettingsView } from "@/lib/useTripSettings";

const attentionStatuses = ["Need Confirmation", "Not Booked", "Pending"] as const;
const requestTimeoutMs = 10000;

export default function DashboardPage() {
  const { language, t } = useLanguage();
  const { trip, loading: tripSettingsLoading } = useTripSettingsView();
  const [bookings, setBookings] = useState<SharedBooking[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState(true);
  const [bookingsError, setBookingsError] = useState<string | null>(null);
  const [itineraryItems, setItineraryItems] = useState<SharedItineraryItem[]>([]);
  const [itineraryLoading, setItineraryLoading] = useState(true);
  const [itineraryError, setItineraryError] = useState<string | null>(null);
  const [setupRefreshKey, setSetupRefreshKey] = useState(0);
  const nextItineraryItem = itineraryItems[0] ?? null;
  const setupRequired = !trip.setupCompletedAt;
  const pendingBookings = useMemo(
    () =>
      bookings.filter((booking) =>
        attentionStatuses.includes(booking.status as (typeof attentionStatuses)[number])
      ),
    [bookings]
  );
  const priorityBookings = useMemo(
    () =>
      pendingBookings
        .slice()
        .sort(
          (left, right) =>
            attentionScore(right.status) - attentionScore(left.status) ||
            left.date.localeCompare(right.date)
        )
        .slice(0, 3),
    [pendingBookings]
  );
  const destinationRoute = trip.destination
    ? `${trip.destination}: ${trip.routeLabel}`
    : trip.routeLabel;
  const destinationVisual = useMemo(
    () =>
      getDestinationVisualIdentity({
        destination: trip.destination,
        routeCities: trip.routeCities,
        routeLabel: trip.routeLabel,
        routeStops: trip.routeStops,
        tripName: trip.name
      }),
    [trip.destination, trip.name, trip.routeCities, trip.routeLabel, trip.routeStops]
  );

  useEffect(() => {
    if (tripSettingsLoading || setupRequired) {
      setBookings([]);
      setBookingsLoading(false);
      setBookingsError(null);
      return;
    }

    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), requestTimeoutMs);
    let isActive = true;

    async function loadBookings() {
      setBookingsLoading(true);
      setBookingsError(null);
      setBookings([]);

      try {
        const response = await fetch("/api/bookings", { signal: controller.signal });
        const data = (await response.json()) as { bookings?: unknown; error?: string };

        if (!response.ok) {
          throw new Error(data.error ?? t("bookings.errorLoad"));
        }

        if (!Array.isArray(data.bookings)) {
          throw new Error(t("bookings.errorLoad"));
        }

        if (!isActive) {
          return;
        }

        setBookings(data.bookings.filter(isSharedBooking));
      } catch (error) {
        if (!isActive) {
          return;
        }

        setBookings([]);

        if (error instanceof DOMException && error.name === "AbortError") {
          setBookingsError(`${t("bookings.errorLoad")} Request timed out. Please retry.`);
        } else {
          setBookingsError(error instanceof Error ? error.message : t("bookings.errorLoad"));
        }
      } finally {
        window.clearTimeout(timeoutId);
        if (isActive) {
          setBookingsLoading(false);
        }
      }
    }

    void loadBookings();

    return () => {
      isActive = false;
      controller.abort();
      window.clearTimeout(timeoutId);
    };
  }, [setupRefreshKey, setupRequired, t, tripSettingsLoading]);

  useEffect(() => {
    if (tripSettingsLoading || setupRequired) {
      setItineraryItems([]);
      setItineraryLoading(false);
      setItineraryError(null);
      return;
    }

    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), requestTimeoutMs);
    let isActive = true;

    async function loadItinerary() {
      setItineraryLoading(true);
      setItineraryError(null);
      setItineraryItems([]);

      try {
        const response = await fetch("/api/itinerary", { signal: controller.signal });
        const data = (await response.json()) as { itineraryItems?: unknown; error?: string };

        if (!response.ok) {
          throw new Error(data.error ?? t("itinerary.errorLoad"));
        }

        if (!Array.isArray(data.itineraryItems)) {
          throw new Error(t("itinerary.errorLoad"));
        }

        if (!isActive) {
          return;
        }

        setItineraryItems(data.itineraryItems.filter(isSharedItineraryItem));
      } catch (error) {
        if (!isActive) {
          return;
        }

        setItineraryItems([]);

        if (error instanceof DOMException && error.name === "AbortError") {
          setItineraryError(`${t("itinerary.errorLoad")} Request timed out. Please retry.`);
        } else {
          setItineraryError(error instanceof Error ? error.message : t("itinerary.errorLoad"));
        }
      } finally {
        window.clearTimeout(timeoutId);
        if (isActive) {
          setItineraryLoading(false);
        }
      }
    }

    void loadItinerary();

    return () => {
      isActive = false;
      controller.abort();
      window.clearTimeout(timeoutId);
    };
  }, [setupRefreshKey, setupRequired, t, tripSettingsLoading]);

  if (setupRequired) {
    return (
      <div className="mx-auto grid min-h-[70vh] max-w-4xl content-center py-6">
        <SetupGenerationPanel
          surface="gate"
          loadingBase={tripSettingsLoading}
          base={{
            tripName: trip.name,
            destination: trip.destination,
            startDate: trip.startDate,
            endDate: trip.endDate,
            timezone: trip.timezone,
            defaultCurrencies: trip.defaultCurrencies,
            travelerNames: trip.activeTravelers.map((traveler) => traveler.displayName ?? traveler.name),
            routeCities: trip.routeCities,
            routeStops: trip.routeStops
          }}
          onGenerated={() => setSetupRefreshKey((current) => current + 1)}
        />
      </div>
    );
  }

  return (
    <div className={`today-shell ${destinationVisual.toneClass}`}>
      <MobileTripMasthead
        dateRangeLabel={trip.dateRangeLabel}
        routeLabel={trip.routeLabel}
        title={trip.name}
        visual={destinationVisual}
      />

      <section className="today-cockpit-grid">
        <div className="today-cockpit-main">
          <PrimaryPlanCard
            error={itineraryError}
            item={nextItineraryItem}
            loading={itineraryLoading}
            routeLabel={trip.routeLabel}
            visual={destinationVisual}
          />
        </div>

        <aside className="today-summary-rail" aria-label="Today summary">
          <AttentionSummaryCard
            bookings={priorityBookings}
            totalCount={pendingBookings.length}
            loading={bookingsLoading}
            error={bookingsError}
          />
          <SummaryLinkCard
            href="/budget"
            icon="money"
            eyebrow={language === "zh" ? "费用" : "Money"}
            title={language === "zh" ? "费用概览" : "Money"}
            detail={language === "zh" ? "打开共同费用" : "Open shared costs"}
          />
          <SummaryLinkCard
            href="/documents"
            icon="prep"
            eyebrow={language === "zh" ? "准备" : "Prep checklist"}
            title={language === "zh" ? "行李和文件" : "Prep"}
            detail={language === "zh" ? "检查文件和行李清单" : "Documents and packing lists"}
          />
        </aside>
      </section>

      <SosSummaryStrip visual={destinationVisual} />

      <section className="today-reminders-section today-desktop-lower" aria-label={t("reminders.title")}>
        <RemindersClient participants={trip.travelerDisplayNames} />
      </section>
    </div>
  );
}

function MobileTripMasthead({
  dateRangeLabel,
  routeLabel,
  title,
  visual
}: {
  dateRangeLabel: string;
  routeLabel: string;
  title: string;
  visual: DestinationVisualIdentity;
}) {
  return (
    <section className="mobile-trip-masthead" aria-label="Trip overview">
      <div className="mobile-trip-masthead__copy">
        <h1>{title}</h1>
        <p>{routeLabel}</p>
        <span className="mobile-trip-date-pill">{dateRangeLabel}</span>
      </div>
      <TripRouteMap
        compact
        cityName={visual.routeMarks[0] ?? visual.destinationLabel}
        countryCode={visual.countryCode}
        countryName={visual.countryName}
        destinations={visual.destinations}
        label={formatRouteMapTitle(visual)}
      />
    </section>
  );
}

function PrimaryPlanCard({
  error,
  item,
  loading,
  routeLabel,
  visual
}: {
  error: string | null;
  item: SharedItineraryItem | null;
  loading: boolean;
  routeLabel: string;
  visual: DestinationVisualIdentity;
}) {
  const { language, t } = useLanguage();
  const title = item?.title ?? t("dashboard.noItineraryItems");
  const timeLabel = item?.startTime || (item?.travelDate ? formatDate(item.travelDate, language) : "");
  const locationLabel = item?.location || item?.city || routeLabel;
  const details = item?.details || item?.transport || "";

  return (
    <article className="primary-plan-card">
      <div className="primary-plan-card__copy">
        <div className="primary-plan-card__topline">
          <p className="cockpit-eyebrow">{t("dashboard.nextUp")}</p>
          <Link href="/itinerary" className="cockpit-primary-button">
            {t("dashboard.viewItinerary")}
            <span aria-hidden="true">›</span>
          </Link>
        </div>
        {loading ? <p className="cockpit-muted">{t("itinerary.loading")}</p> : null}
        {error && !loading ? <p className="cockpit-error">{error}</p> : null}
        {!loading && !error ? (
          <>
            <h2>{title}</h2>
            <div className="primary-plan-card__meta">
              <div className="plan-meta-row">
                <span className="plan-meta-icon plan-meta-icon--time" aria-hidden="true" />
                <strong>{timeLabel}</strong>
              </div>
              <div className="plan-meta-row">
                <span className="plan-meta-icon plan-meta-icon--pin" aria-hidden="true" />
                <span>
                  <strong>{locationLabel}</strong>
                  {details ? <small>{details}</small> : null}
                </span>
              </div>
            </div>
          </>
        ) : null}
      </div>
      <TravelTicketVisual item={item} routeLabel={routeLabel} visual={visual} />
    </article>
  );
}

function TravelTicketVisual({
  item,
  routeLabel,
  visual
}: {
  item: SharedItineraryItem | null;
  routeLabel: string;
  visual: DestinationVisualIdentity;
}) {
  const { language } = useLanguage();
  const routeSummary = summarizeRouteMarks(visual.routeMarks, item?.city ?? routeLabel);

  return (
    <aside className="travel-ticket-visual" aria-label="Trip ticket visual">
      <div className="travel-ticket-visual__top">
        <span>{formatRouteMapTitle(visual)}</span>
      </div>
      <TripRouteMap
        cityName={item?.city ?? visual.routeMarks[0] ?? routeLabel}
        countryCode={visual.countryCode}
        countryName={visual.countryName}
        date={item?.travelDate}
        destinations={visual.destinations}
        label={formatRouteMapTitle(visual)}
      />
      <div className="travel-ticket-visual__footer">
        {item?.travelDate ? <span>{formatDate(item.travelDate, language)}</span> : null}
        {routeSummary ? <span>{routeSummary}</span> : null}
      </div>
    </aside>
  );
}

function AttentionSummaryCard({
  bookings,
  error,
  loading,
  totalCount
}: {
  bookings: SharedBooking[];
  error: string | null;
  loading: boolean;
  totalCount: number;
}) {
  const { language, t } = useLanguage();

  return (
    <article className="cockpit-card attention-summary-card">
      <div className="cockpit-card__heading">
        <div>
          <p className="cockpit-eyebrow">{t("dashboard.needsAttention")}</p>
          <h2>{t("dashboard.attentionCount", { count: totalCount })}</h2>
        </div>
        <Link href="/bookings" aria-label={t("dashboard.openBookings")} className="cockpit-arrow-link">
          ›
        </Link>
      </div>
      {loading ? <p className="cockpit-muted">{t("bookings.loading")}</p> : null}
      {error && !loading ? <p className="cockpit-error">{error}</p> : null}
      {!loading && !error && bookings.length === 0 ? (
        <p className="cockpit-muted">{t("dashboard.noBookingAttention")}</p>
      ) : null}
      {!loading && !error && bookings.length > 0 ? (
        <ul className="attention-list">
          {bookings.map((booking) => (
            <li key={booking.id}>
              <span className="summary-icon summary-icon--calendar" aria-hidden="true" />
              <span>
                <strong>{booking.description}</strong>
                <small>
                  {translateText(language, booking.category)} · {formatDate(booking.date, language)}
                </small>
              </span>
              <span className="attention-list__chevron" aria-hidden="true">›</span>
            </li>
          ))}
        </ul>
      ) : null}
    </article>
  );
}

function SosSummaryStrip({ visual }: { visual: DestinationVisualIdentity }) {
  const { t } = useLanguage();

  return (
    <section className="sos-summary-card today-sos-strip" aria-label={t("dashboard.sosStripTitle")}>
      <div className="min-w-0">
        <p className="cockpit-eyebrow">{t("dashboard.sosStripTitle")}</p>
        <p>{t("dashboard.sosStripDescription")}</p>
      </div>
      <EmergencyQuickAccess
        countryCode={visual.countryCode}
        countryName={visual.countryName}
        countries={emergencyCountriesForVisual(visual)}
      />
    </section>
  );
}

function emergencyCountriesForVisual(visual: DestinationVisualIdentity) {
  const codes = visual.countryCodes.length > 0 ? visual.countryCodes : [visual.countryCode];
  const names = visual.countryNames.length > 0 ? visual.countryNames : [visual.countryName];
  const seen = new Set<string>();

  return codes
    .map((code, index) => ({
      code: code.toUpperCase(),
      name: names[index] ?? code
    }))
    .filter((country) => {
      if (!country.code || seen.has(country.code)) {
        return false;
      }

      seen.add(country.code);
      return true;
    });
}

function SummaryLinkCard({
  detail,
  eyebrow,
  href,
  icon,
  title
}: {
  detail: string;
  eyebrow: string;
  href: string;
  icon: "money" | "prep";
  title: string;
}) {
  return (
    <Link href={href} className="cockpit-card summary-link-card">
      <span className={`summary-icon summary-icon--${icon}`} aria-hidden="true" />
      <span className="min-w-0">
        <span className="cockpit-eyebrow">{eyebrow}</span>
        <strong>{title}</strong>
        <small>{detail}</small>
      </span>
      <span className="summary-link-card__chevron" aria-hidden="true">›</span>
    </Link>
  );
}

function DestinationStampCard({
  date,
  visual
}: {
  date?: string | null;
  visual: DestinationVisualIdentity;
}) {
  const routeSummary = summarizeRouteMarks(visual.routeMarks, visual.destinationLabel);

  return (
    <article className="destination-stamp-card" aria-label={`${visual.destinationLabel} route postcard`}>
      <TripRouteMap
        className="trip-route-map--rail"
        cityName={visual.routeMarks[0] ?? visual.destinationLabel}
        countryCode={visual.countryCode}
        countryName={visual.countryName}
        date={date}
        destinations={visual.destinations}
        label={formatRouteMapTitle(visual)}
      />
      <p>{routeSummary}</p>
    </article>
  );
}

function summarizeRouteMarks(routeMarks: string[], fallback: string) {
  const seen = new Set<string>();
  const uniqueMarks = routeMarks
    .map((mark) => mark.trim())
    .filter(Boolean)
    .filter((mark) => {
      const key = mark.toLocaleLowerCase();
      if (seen.has(key)) {
        return false;
      }

      seen.add(key);
      return true;
    });

  return uniqueMarks.length > 0 ? uniqueMarks.join(" · ") : fallback;
}

function formatRouteMapTitle(visual: DestinationVisualIdentity) {
  return `${formatCountryMapLabel(visual)} route map`;
}

function formatCountryMapLabel(visual: DestinationVisualIdentity) {
  if (visual.countryNames.length > 1) {
    return "Multi-country";
  }

  if (visual.countryCode === "GB") {
    return "UK";
  }

  if (visual.countryCode === "KR") {
    return "Korea";
  }

  if (visual.countryCode === "GENERIC") {
    return visual.destinationLabel;
  }

  return visual.countryName.split(/\s+/)[0] || visual.destinationLabel;
}

function DestinationMapCard({
  language,
  visual
}: {
  language: Language;
  visual: DestinationVisualIdentity;
}) {
  const mapTitle =
    language === "zh"
      ? `${visual.destinationLabel} 路线地图`
      : `${visual.destinationLabel} route map`;
  const routeLabel = language === "zh" ? "当前路线" : "Current route";
  const stampHint = language === "zh" ? "根据当前 workspace" : "From this workspace";

  return (
    <aside className="destination-map-card" aria-label={mapTitle}>
      <div className="destination-map-card__top">
        <div>
          <p className="destination-map-card__eyebrow">{routeLabel}</p>
          <h2>{mapTitle}</h2>
        </div>
        <div className="destination-postmark" aria-label={language === "zh" ? "旅行邮戳" : "Trip postmark"}>
          <span>{visual.stampLabel}</span>
          <small>{visual.stampDetail}</small>
        </div>
      </div>
      <div className="destination-map-canvas" aria-hidden="true">
        <div className={`destination-map-shape ${visual.shapeClass}`} />
        <div className="destination-map-route">
          {visual.routeMarks.map((mark, index) => (
            <span key={`${mark}-${index}`} className="destination-map-pin">
              {index + 1}
            </span>
          ))}
        </div>
      </div>
      <div className="destination-route-pins">
        {visual.routeMarks.map((mark, index) => (
          <span key={mark} className="destination-route-pin">
            <span>{index + 1}</span>
            {mark}
          </span>
        ))}
      </div>
      <p className="destination-map-card__note">{stampHint}</p>
    </aside>
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

function NextPlanMini({
  error,
  item,
  loading
}: {
  error: string | null;
  item: SharedItineraryItem | null;
  loading: boolean;
}) {
  const { language, t } = useLanguage();

  return (
    <div className="rounded-lg border border-white/70 bg-white/78 p-3 shadow-soft backdrop-blur-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.08em] text-stamp">
        {t("dashboard.nextUp")}
      </p>
      {loading ? (
        <p className="mt-1 text-sm text-zinc-600">{t("itinerary.loading")}</p>
      ) : null}
      {error && !loading ? (
        <p className="mt-1 text-sm text-red-700">{error}</p>
      ) : null}
      {!loading && !error && item ? (
        <>
          <p className="mt-1 line-clamp-1 break-words text-base font-semibold text-ink">
            {item.title}
          </p>
          <p className="mt-1 text-sm text-zinc-600">
            {formatDate(item.travelDate, language)} - {item.city}
          </p>
        </>
      ) : null}
      {!loading && !error && !item ? (
        <p className="mt-1 text-sm text-zinc-600">{t("dashboard.noItineraryItems")}</p>
      ) : null}
      <Link
        href="/itinerary"
        className="mt-3 inline-flex min-h-10 w-full items-center justify-center rounded-md bg-moss px-3 py-2 text-sm font-semibold text-white shadow-sm sm:w-auto"
      >
        {t("dashboard.viewItinerary")}
      </Link>
    </div>
  );
}

function NextPlanCard({
  error,
  item,
  loading
}: {
  error: string | null;
  item: SharedItineraryItem | null;
  loading: boolean;
}) {
  const { language, t } = useLanguage();

  return (
    <article className="travel-panel hidden p-4 sm:block">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="route-line min-w-0 space-y-3 pl-9">
          <div>
            <span className="route-dot absolute left-0 top-0" />
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-stamp">
              {t("dashboard.nextUp")}
            </p>
            {loading ? (
              <p className="mt-1 text-sm text-zinc-600">{t("itinerary.loading")}</p>
            ) : null}
            {error && !loading ? (
              <p className="mt-1 text-sm text-red-700">{error}</p>
            ) : null}
            {!loading && !error && item ? (
              <>
                <h2 className="mt-1 break-words text-lg font-semibold text-ink">
                  {item.title}
                </h2>
                <p className="mt-1 text-sm text-zinc-500">
                  {formatDate(item.travelDate, language)} - {item.city}
                </p>
                {item.details ? (
                  <p className="mt-2 line-clamp-2 text-sm leading-6 text-zinc-600">{item.details}</p>
                ) : null}
              </>
            ) : null}
            {!loading && !error && !item ? (
              <p className="mt-1 text-sm leading-6 text-zinc-600">
                {t("dashboard.noItineraryItems")}
              </p>
            ) : null}
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
  error,
  loading,
  totalCount
}: {
  bookings: SharedBooking[];
  error: string | null;
  loading: boolean;
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
        {loading ? (
          <p className="rounded-md bg-white/70 px-3 py-3 text-sm text-zinc-600">
            {t("bookings.loading")}
          </p>
        ) : null}
        {error && !loading ? (
          <p className="rounded-md bg-red-50 px-3 py-3 text-sm text-red-700">
            {error}
          </p>
        ) : null}
        {!loading && !error && bookings.length === 0 ? (
          <p className="rounded-md bg-white/70 px-3 py-3 text-sm text-zinc-600">
            {t("dashboard.noBookingAttention")}
          </p>
        ) : null}
        {!loading && !error ? bookings.map((booking) => (
          <div
            key={booking.id}
            className="flex min-w-0 flex-col gap-2 rounded-md bg-white/72 px-3 py-2 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="min-w-0">
              <p className="break-words text-sm font-semibold text-ink">{booking.description}</p>
              <p className="mt-0.5 text-xs text-zinc-500">
                {translateText(language, booking.category)} - {formatDate(booking.date, language)}
              </p>
            </div>
            <StatusBadge status={booking.status} />
          </div>
        )) : null}
      </div>
    </article>
  );
}

function attentionScore(status: SharedBooking["status"]) {
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

function isSharedBooking(value: unknown): value is SharedBooking {
  if (!value || typeof value !== "object") {
    return false;
  }

  const booking = value as Partial<SharedBooking>;
  return (
    typeof booking.id === "string" &&
    typeof booking.category === "string" &&
    typeof booking.description === "string" &&
    typeof booking.date === "string" &&
    typeof booking.bookedBy === "string" &&
    typeof booking.status === "string"
  );
}

function isSharedItineraryItem(value: unknown): value is SharedItineraryItem {
  if (!value || typeof value !== "object") {
    return false;
  }

  const item = value as Partial<SharedItineraryItem>;
  return (
    typeof item.id === "string" &&
    typeof item.travelDate === "string" &&
    typeof item.city === "string" &&
    typeof item.title === "string"
  );
}

function formatDate(value: string, language: Language = "en") {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) {
    return value;
  }

  const [, year, month, day] = match;
  const date = new Date(Number(year), Number(month) - 1, Number(day));
  return new Intl.DateTimeFormat(language === "zh" ? "zh-CN" : "en", {
    day: "numeric",
    month: "short",
    year: "numeric"
  }).format(date);
}
