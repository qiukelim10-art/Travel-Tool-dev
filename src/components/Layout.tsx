"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { EmergencyQuickAccess } from "@/components/EmergencyQuickAccess";
import { TripAccessToolbar } from "@/lib/access";
import { getDestinationVisualIdentity, type DestinationVisualIdentity } from "@/lib/destinationVisuals";
import { useLanguage, type TranslationKey } from "@/lib/i18n";
import { useTripSettingsView } from "@/lib/useTripSettings";

const navItems = [
  { href: "/", icon: "home", symbol: "🏠", labelKey: "nav.dashboard", shortLabelKey: "nav.home" },
  { href: "/itinerary", icon: "plan", symbol: "🗺️", labelKey: "nav.itinerary", shortLabelKey: "nav.plan" },
  { href: "/bookings", icon: "book", symbol: "🎟️", labelKey: "nav.bookings", shortLabelKey: "nav.book" },
  { href: "/budget", icon: "money", symbol: "💶", labelKey: "nav.budget", shortLabelKey: "nav.money" },
  { href: "/more", icon: "more", symbol: "•••", labelKey: "nav.more", shortLabelKey: "nav.more" }
];

const mobileNavItems = [
  { href: "/", icon: "home", symbol: "🏠", labelKey: "nav.dashboard", shortLabelKey: "nav.home" },
  { href: "/itinerary", icon: "plan", symbol: "🗺️", labelKey: "nav.itinerary", shortLabelKey: "nav.plan" },
  { href: "/bookings", icon: "book", symbol: "🎟️", labelKey: "nav.bookings", shortLabelKey: "nav.book" },
  { href: "/budget", icon: "money", symbol: "💶", labelKey: "nav.budget", shortLabelKey: "nav.money" },
  { href: "/more", icon: "more", symbol: "•••", labelKey: "nav.more", shortLabelKey: "nav.more" }
];

function LanguageToggle({ compact = false }: { compact?: boolean }) {
  const { language, t, toggleLanguage } = useLanguage();

  return (
    <button
      type="button"
      onClick={toggleLanguage}
      className={`rounded-md border border-zinc-200 bg-white font-semibold text-ink shadow-sm transition-colors ${
        compact
          ? "px-3 py-2 text-xs ring-1 ring-moss/20"
          : "px-3 py-2 text-sm ring-1 ring-moss/20 hover:bg-zinc-50"
      }`}
      aria-label={`${t("language.label")}: ${language === "zh" ? "中文" : "English"}`}
    >
      {t("language.toggle")}
    </button>
  );
}

function Navigation() {
  const pathname = usePathname();
  const { t } = useLanguage();
  const { trip } = useTripSettingsView({ genericFallback: true });
  const destinationVisual = getDestinationVisualIdentity({
    destination: trip.destination,
    routeCities: trip.routeCities,
    routeLabel: trip.routeLabel,
    routeStops: trip.routeStops,
    tripName: trip.name
  });

  return (
    <>
      <nav className="journal-top-nav hidden md:block">
        <div className="journal-top-nav__inner">
          <Link href="/" className="journal-brand">
            <span className="journal-compass" aria-hidden="true">🧭</span>
            <span>
              <strong>{trip.name}</strong>
              <small>{trip.dateRangeLabel} · {trip.travelerCount} {t("dashboard.travellers")}</small>
            </span>
          </Link>
          <div className="journal-nav-cluster">
            {navItems.map((item) => {
              const active =
                pathname === item.href ||
                (item.href === "/more" &&
                  ["/packing", "/documents", "/settings"].includes(pathname));

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`journal-nav-link ${
                    active
                      ? "journal-nav-link--active"
                      : ""
                  }`}
                >
                  <span className={`journal-nav-icon journal-nav-icon--${item.icon}`} aria-hidden="true">
                    {item.symbol}
                  </span>
                  {getNavLabel(item, t)}
                </Link>
              );
            })}
          </div>
          <div className="journal-actions">
            <EmergencyQuickAccess
              countryCode={destinationVisual.countryCode}
              countryName={destinationVisual.countryName}
              countries={emergencyCountriesForVisual(destinationVisual)}
            />
            <LanguageToggle />
          </div>
        </div>
      </nav>
      <nav className="mobile-bottom-nav fixed inset-x-0 bottom-0 z-50 border-t px-2 pt-1 backdrop-blur md:hidden">
        <div className="mx-auto grid max-w-lg grid-cols-5 gap-1">
          {mobileNavItems.map((item) => {
            const active =
              pathname === item.href ||
              (item.href === "/more" &&
                ["/packing", "/documents", "/settings"].includes(pathname));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`mobile-bottom-nav__link px-1 py-2 text-center text-xs font-semibold transition-colors ${
                  active ? "mobile-bottom-nav__link--active" : "mobile-bottom-nav__link text-zinc-600"
                }`}
              >
                <span className={`mobile-nav-icon mobile-nav-icon--${item.icon}`} aria-hidden="true">
                  {item.symbol}
                </span>
                {t(item.shortLabelKey as TranslationKey)}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}

function getNavLabel(
  item: (typeof navItems)[number],
  t: ReturnType<typeof useLanguage>["t"]
) {
  return t((item as { labelKey: TranslationKey }).labelKey);
}

function MobileUtilityRow() {
  const { trip } = useTripSettingsView({ genericFallback: true });
  const destinationVisual = getDestinationVisualIdentity({
    destination: trip.destination,
    routeCities: trip.routeCities,
    routeLabel: trip.routeLabel,
    routeStops: trip.routeStops,
    tripName: trip.name
  });

  return (
    <div className="mobile-language-row md:hidden">
      <EmergencyQuickAccess
        countryCode={destinationVisual.countryCode}
        countryName={destinationVisual.countryName}
        countries={emergencyCountriesForVisual(destinationVisual)}
      />
      <LanguageToggle compact />
    </div>
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

export function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="journal-shell min-h-screen bg-paper text-ink">
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <Navigation />
      <TripAccessToolbar mobileActions={<MobileUtilityRow />} />
      <main
        id="main-content"
        className="mobile-main-shell mx-auto max-w-[92rem] px-4 pt-6 sm:px-6 md:pb-12 md:pt-8"
      >
        {children}
      </main>
    </div>
  );
}
