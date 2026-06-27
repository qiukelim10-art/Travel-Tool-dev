"use client";

import { useMemo } from "react";
import { PackingClient } from "@/components/PackingClient";
import { TripRouteMap } from "@/components/TripRouteMap";
import { getDestinationVisualIdentity } from "@/lib/destinationVisuals";
import { useLanguage } from "@/lib/i18n";
import { useTripSettingsView } from "@/lib/useTripSettings";

export default function PackingPage() {
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
    <div className={`packing-shell today-shell ${destinationVisual.toneClass}`}>
      <section className="packing-masthead" aria-labelledby="packing-page-title">
        <div className="packing-masthead__copy">
          <p className="cockpit-eyebrow">{t("page.packing.eyebrow")}</p>
          <h1 id="packing-page-title">{t("page.packing.title")}</h1>
          <p>{t("page.packing.description")}</p>
          <div className="packing-masthead__chips" aria-label={t("itinerary.routeOverview")}>
            <span>{trip.dateRangeLabel}</span>
            <span>{trip.routeLabel}</span>
            <span>
              {trip.travelerCount} {t("dashboard.travellers")}
            </span>
          </div>
        </div>
        <TripRouteMap
          cityName={destinationVisual.routeMarks[0] ?? destinationVisual.destinationLabel}
          className="trip-route-map--packing"
          countryCode={destinationVisual.countryCode}
          countryName={destinationVisual.countryName}
          date={trip.startDate}
          destinations={destinationVisual.destinations}
          label={`${destinationVisual.countryName} packing route map`}
        />
      </section>
      <PackingClient travelers={trip.travelers} />
    </div>
  );
}
