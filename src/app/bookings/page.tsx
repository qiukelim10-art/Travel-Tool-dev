"use client";

import { useMemo } from "react";
import { BookingsClient } from "@/components/BookingsClient";
import { TripRouteMap } from "@/components/TripRouteMap";
import { getDestinationVisualIdentity } from "@/lib/destinationVisuals";
import { useLanguage } from "@/lib/i18n";
import { useTripSettingsView } from "@/lib/useTripSettings";

export default function BookingsPage() {
  const { t } = useLanguage();
  const { trip } = useTripSettingsView();
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

  return (
    <div className={`bookings-shell today-shell ${destinationVisual.toneClass}`}>
      <section className="bookings-masthead" aria-labelledby="bookings-page-title">
        <div className="bookings-masthead__copy">
          <p className="cockpit-eyebrow">{t("page.bookings.eyebrow")}</p>
          <h1 id="bookings-page-title">{t("page.bookings.title")}</h1>
          <p>{t("page.bookings.description")}</p>
          <div className="bookings-masthead__chips" aria-label={t("itinerary.routeOverview")}>
            <span>{trip.dateRangeLabel}</span>
            <span>{trip.routeLabel}</span>
            <span>
              {trip.travelerCount} {t("dashboard.travellers")}
            </span>
          </div>
        </div>
        <TripRouteMap
          cityName={destinationVisual.routeMarks[0] ?? destinationVisual.destinationLabel}
          className="trip-route-map--bookings"
          countryCode={destinationVisual.countryCode}
          countryName={destinationVisual.countryName}
          date={trip.startDate}
          destinations={destinationVisual.destinations}
          label={`${destinationVisual.countryName} route map`}
        />
      </section>
      <BookingsClient participants={trip.travelerDisplayNames} defaultCurrencies={trip.defaultCurrencies} />
    </div>
  );
}
