"use client";

import { useMemo } from "react";
import { DocumentsClient } from "@/components/DocumentsClient";
import { EmergencyQuickAccess } from "@/components/EmergencyQuickAccess";
import { TripRouteMap } from "@/components/TripRouteMap";
import { getDestinationVisualIdentity, type DestinationVisualIdentity } from "@/lib/destinationVisuals";
import { useLanguage } from "@/lib/i18n";
import { useTripSettingsView } from "@/lib/useTripSettings";

type TFunction = ReturnType<typeof useLanguage>["t"];

export default function DocumentsPage() {
  const { t, toggleLanguage } = useLanguage();
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
  const desktopNavItems = getDocumentsDesktopNavItems(t);
  const mobileNavItems = getDocumentsMobileNavItems(t);
  const tripDetailLabel = [trip.dateRangeLabel, trip.routeLabel].filter(Boolean).join(" - ");
  const travelerLabel = `${trip.travelerCount} ${t("dashboard.travellers")}`;
  const sosCountries = emergencyCountriesForVisual(destinationVisual);

  return (
    <div className={`documents-shell today-shell stitch-today-page stitch-documents-page ${destinationVisual.toneClass}`}>
      <header className="stitch-top-appbar stitch-budget-topbar stitch-documents-topbar">
        <div className="stitch-budget-top-title">
          <h1>{trip.name}</h1>
          <p>{tripDetailLabel}</p>
        </div>
        <div className="stitch-top-actions">
          <IconButton icon="language" label={t("language.label")} onClick={toggleLanguage} />
          <SosIconButton countries={sosCountries} label={t("sos.ariaLabel")} />
        </div>
      </header>

      <nav className="stitch-side-nav" aria-label="Workspace navigation">
        <div className="stitch-side-brand">
          <strong>Trip Workspace</strong>
          <span>Private Sanctuary</span>
        </div>
        <div className="stitch-side-links">
          {desktopNavItems.map((item) => (
            <a
              key={item.href}
              className={`stitch-side-link ${item.active ? "stitch-side-link--active" : ""}`}
              href={item.href}
            >
              <MaterialIcon icon={item.icon} fill={item.active} />
              <span>{item.label}</span>
            </a>
          ))}
        </div>
      </nav>

      <main className="stitch-main-canvas stitch-documents-main">
        <section className="stitch-trip-heading stitch-documents-heading" aria-label={t("documents.mastheadOverview")}>
          <div>
            <h1>{trip.name}</h1>
            <p>{tripDetailLabel}</p>
          </div>
          <div className="stitch-desktop-actions">
            <IconButton icon="language" label={t("language.label")} onClick={toggleLanguage} surface />
            <SosIconButton countries={sosCountries} label={t("sos.ariaLabel")} surface />
          </div>
        </section>

        <div className="stitch-dashboard-grid stitch-documents-grid">
          <div className="stitch-main-stack stitch-documents-stack">
            <section className="documents-masthead stitch-card" aria-labelledby="documents-page-title">
              <div className="documents-masthead__copy">
                <p className="cockpit-eyebrow">{t("page.documents.eyebrow")}</p>
                <h2 id="documents-page-title">{t("page.documents.title")}</h2>
                <p>{t("page.documents.description")}</p>
                <div className="documents-masthead__chips" aria-label={t("documents.mastheadOverview")}>
                  <span>
                    <MaterialIcon icon="calendar_today" />
                    <span>{trip.dateRangeLabel}</span>
                  </span>
                  <span>
                    <MaterialIcon icon="route" />
                    <span>{trip.routeLabel}</span>
                  </span>
                  <span>
                    <MaterialIcon icon="group" />
                    <span>{travelerLabel}</span>
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
        </div>
      </main>

      <nav className="stitch-bottom-nav" aria-label="Mobile navigation">
        {mobileNavItems.map((item) => (
          <a
            key={item.href}
            className={`stitch-bottom-link ${item.active ? "stitch-bottom-link--active" : ""}`}
            href={item.href}
          >
            <MaterialIcon icon={item.icon} fill={item.active} />
            <span>{item.label}</span>
          </a>
        ))}
      </nav>
    </div>
  );
}

function getDocumentsDesktopNavItems(t: TFunction) {
  return [
    { href: "/", icon: "home", label: t("nav.home"), active: false },
    { href: "/itinerary", icon: "event_note", label: t("nav.plan"), active: false },
    { href: "/bookings", icon: "confirmation_number", label: t("nav.book"), active: false },
    { href: "/budget", icon: "payments", label: t("nav.money"), active: false },
    { href: "/documents", icon: "description", label: t("nav.documents"), active: true },
    { href: "/packing", icon: "inventory_2", label: t("nav.packing"), active: false },
    { href: "/settings", icon: "settings", label: t("nav.settings"), active: false }
  ];
}

function getDocumentsMobileNavItems(t: TFunction) {
  return [
    { href: "/", icon: "today", label: t("nav.home"), active: false },
    { href: "/itinerary", icon: "event_note", label: t("nav.plan"), active: false },
    { href: "/bookings", icon: "confirmation_number", label: t("nav.book"), active: false },
    { href: "/budget", icon: "payments", label: t("nav.money"), active: false },
    { href: "/more", icon: "more_horiz", label: t("nav.more"), active: true }
  ];
}

function IconButton({
  icon,
  label,
  onClick,
  surface = false
}: {
  icon: string;
  label: string;
  onClick?: () => void;
  surface?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`stitch-icon-button ${surface ? "stitch-icon-button--surface" : ""}`}
      aria-label={label}
    >
      <MaterialIcon icon={icon} />
    </button>
  );
}

function SosIconButton({
  countries,
  label,
  surface = false
}: {
  countries: { code: string; name: string }[];
  label: string;
  surface?: boolean;
}) {
  return (
    <EmergencyQuickAccess
      countries={countries}
      triggerAriaLabel={label}
      triggerClassName={`stitch-icon-button ${surface ? "stitch-icon-button--surface" : ""} stitch-icon-button--error`}
      triggerChildren={<MaterialIcon icon="emergency_home" />}
    />
  );
}

function MaterialIcon({ icon, fill = false }: { icon: string; fill?: boolean }) {
  return (
    <span className={`material-symbols-outlined ${fill ? "stitch-icon-fill" : ""}`} aria-hidden="true">
      {icon}
    </span>
  );
}

function emergencyCountriesForVisual(visual: DestinationVisualIdentity) {
  const codes = visual.countryCodes.length > 0 ? visual.countryCodes : [visual.countryCode];
  const names = visual.countryNames.length > 0 ? visual.countryNames : [visual.countryName];
  const seen = new Set<string>();
  const countries = codes
    .map((code, index) => ({
      code: code.toUpperCase() === "UK" ? "GB" : code.toUpperCase(),
      name: names[index] ?? code
    }))
    .filter((country) => {
      if (!country.code || country.code === "GENERIC" || seen.has(country.code)) {
        return false;
      }

      seen.add(country.code);
      return true;
    });

  return countries.length > 0 ? countries : [{ code: "IT", name: "Italy" }];
}
