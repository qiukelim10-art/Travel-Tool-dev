"use client";

import { useMemo } from "react";
import { ItineraryClient } from "@/components/ItineraryClient";
import { TripRouteMap } from "@/components/TripRouteMap";
import { getDestinationVisualIdentity } from "@/lib/destinationVisuals";
import { useLanguage } from "@/lib/i18n";
import { useTripSettingsView } from "@/lib/useTripSettings";

export default function ItineraryPage() {
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
    <div className={`itinerary-shell today-shell ${destinationVisual.toneClass}`}>
      <section className="itinerary-masthead" aria-labelledby="itinerary-page-title">
        <div className="itinerary-masthead__copy">
          <p className="cockpit-eyebrow">{t("page.itinerary.eyebrow")}</p>
          <h1 id="itinerary-page-title">{t("page.itinerary.title")}</h1>
          <p>{t("page.itinerary.description")}</p>
          <div className="itinerary-masthead__chips" aria-label={t("itinerary.routeOverview")}>
            <span>{trip.dateRangeLabel}</span>
            <span>{trip.routeLabel}</span>
            <span>
              {trip.travelerCount} {t("dashboard.travellers")}
            </span>
          </div>
        </div>
        <TripRouteMap
          cityName={destinationVisual.routeMarks[0] ?? destinationVisual.destinationLabel}
          className="trip-route-map--itinerary"
          countryCode={destinationVisual.countryCode}
          countryName={destinationVisual.countryName}
          date={trip.startDate}
          destinations={destinationVisual.destinations}
          label={`${destinationVisual.countryName} route map`}
        />
      </section>
      <ItineraryClient defaultCurrencies={trip.defaultCurrencies} />
    </div>
  );
}
