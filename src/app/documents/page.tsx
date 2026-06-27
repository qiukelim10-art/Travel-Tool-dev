"use client";

import { useMemo } from "react";
import { DocumentsClient } from "@/components/DocumentsClient";
import { TripRouteMap } from "@/components/TripRouteMap";
import { getDestinationVisualIdentity } from "@/lib/destinationVisuals";
import { useLanguage } from "@/lib/i18n";
import { useTripSettingsView } from "@/lib/useTripSettings";

export default function DocumentsPage() {
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
    <div className={`documents-shell today-shell ${destinationVisual.toneClass}`}>
      <section className="documents-masthead" aria-labelledby="documents-page-title">
        <div className="documents-masthead__copy">
          <p className="cockpit-eyebrow">{t("page.documents.eyebrow")}</p>
          <h1 id="documents-page-title">{t("page.documents.title")}</h1>
          <p>{t("page.documents.description")}</p>
          <div className="documents-masthead__chips" aria-label={t("documents.mastheadOverview")}>
            <span>{trip.dateRangeLabel}</span>
            <span>{trip.routeLabel}</span>
            <span>
              {trip.travelerCount} {t("dashboard.travellers")}
            </span>
          </div>
        </div>
        <aside className="documents-visual-card" aria-label={t("documents.visualTitle")}>
          <div className="documents-visual-card__top">
            <span>{t("documents.visualTitle")}</span>
            <span>{t("documents.visualStamp")}</span>
          </div>
          <TripRouteMap
            cityName={destinationVisual.routeMarks[0] ?? destinationVisual.destinationLabel}
            className="trip-route-map--documents"
            countryCode={destinationVisual.countryCode}
            countryName={destinationVisual.countryName}
            date={trip.startDate}
            destinations={destinationVisual.destinations}
            label={`${destinationVisual.destinationLabel} document route map`}
          />
        </aside>
      </section>
      <DocumentsClient travelers={trip.travelers} />
    </div>
  );
}
