"use client";

import { useMemo } from "react";
import { EmergencyQuickAccess } from "@/components/EmergencyQuickAccess";
import { PackingClient } from "@/components/PackingClient";
import { getDestinationVisualIdentity, type DestinationVisualIdentity } from "@/lib/destinationVisuals";
import { useLanguage } from "@/lib/i18n";
import { useTripSettingsView } from "@/lib/useTripSettings";

type TFunction = ReturnType<typeof useLanguage>["t"];

export default function PackingPage() {
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
  const desktopNavItems = getPackingDesktopNavItems(t);
  const mobileNavItems = getPackingMobileNavItems(t);
  const tripDetailLabel = [trip.dateRangeLabel, trip.routeLabel].filter(Boolean).join(" - ");
  const travelerLabel = `${trip.travelerCount} ${t("dashboard.travellers")}`;
  const sosCountries = emergencyCountriesForVisual(destinationVisual);

  return (
    <div className="stitch-today-page stitch-packing-page">
      <header className="stitch-top-appbar stitch-budget-topbar">
        <div className="stitch-budget-top-title">
          <h1>{trip.name}</h1>
          <p>{tripDetailLabel}</p>
        </div>
        <div className="stitch-top-actions">
          <IconButton icon="language" label={t("language.label")} onClick={toggleLanguage} />
          <SosIconButton countries={sosCountries} label={t("sos.ariaLabel")} />
        </div>
      </header>

      <nav className="stitch-side-nav" aria-label={t("nav.packing")}>
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

      <main className="stitch-main-canvas stitch-packing-main">
        <section className="stitch-trip-heading stitch-packing-heading" aria-label={t("page.packing.eyebrow")}>
          <div>
            <h1>{trip.name}</h1>
            <p>{tripDetailLabel}</p>
          </div>
          <div className="stitch-desktop-actions">
            <IconButton icon="language" label={t("language.label")} onClick={toggleLanguage} surface />
            <SosIconButton countries={sosCountries} label={t("sos.ariaLabel")} surface />
          </div>
        </section>

        <div className="stitch-dashboard-grid stitch-packing-grid">
          <div className="stitch-main-stack stitch-packing-stack">
            <section className="packing-masthead stitch-card" aria-labelledby="packing-page-title">
              <div className="packing-masthead__copy">
                <p className="cockpit-eyebrow">{t("page.packing.eyebrow")}</p>
                <h2 id="packing-page-title">{t("page.packing.title")}</h2>
                <p>{t("page.packing.description")}</p>
                <div className="packing-masthead__chips" aria-label={t("itinerary.routeOverview")}>
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
            </section>

            <PackingClient travelers={trip.travelers} />
          </div>
        </div>
      </main>

      <nav className="stitch-bottom-nav" aria-label={t("nav.packing")}>
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

function getPackingDesktopNavItems(t: TFunction) {
  return [
    { href: "/", icon: "home", label: t("nav.home"), active: false },
    { href: "/itinerary", icon: "event_note", label: t("nav.plan"), active: false },
    { href: "/bookings", icon: "confirmation_number", label: t("nav.book"), active: false },
    { href: "/budget", icon: "payments", label: t("nav.money"), active: false },
    { href: "/documents", icon: "description", label: t("nav.documents"), active: false },
    { href: "/packing", icon: "luggage", label: t("nav.packing"), active: true },
    { href: "/settings", icon: "settings", label: t("nav.settings"), active: false }
  ];
}

function getPackingMobileNavItems(t: TFunction) {
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
