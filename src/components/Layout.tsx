"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { TripAccessToolbar } from "@/lib/access";
import { useLanguage, type TranslationKey } from "@/lib/i18n";
import { useTripSettingsView } from "@/lib/useTripSettings";

const navItems = [
  { href: "/", labelKey: "nav.dashboard", shortLabelKey: "nav.home" },
  { href: "/itinerary", labelKey: "nav.itinerary", shortLabelKey: "nav.plan" },
  { href: "/bookings", labelKey: "nav.bookings", shortLabelKey: "nav.book" },
  { href: "/budget", labelKey: "nav.budget", shortLabelKey: "nav.money" },
  { href: "/packing", labelKey: "nav.packing", shortLabelKey: "nav.pack" },
  { href: "/documents", labelKey: "nav.documents", shortLabelKey: "nav.docs" },
  { href: "/settings", label: { en: "Settings", zh: "设置" } }
];

const mobileNavItems = [
  { href: "/", labelKey: "nav.dashboard", shortLabelKey: "nav.home" },
  { href: "/itinerary", labelKey: "nav.itinerary", shortLabelKey: "nav.plan" },
  { href: "/bookings", labelKey: "nav.bookings", shortLabelKey: "nav.book" },
  { href: "/budget", labelKey: "nav.budget", shortLabelKey: "nav.money" },
  { href: "/more", labelKey: "nav.more", shortLabelKey: "nav.more" }
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
  const { language, t } = useLanguage();
  const { trip } = useTripSettingsView({ genericFallback: true });

  return (
    <>
      <nav className="hidden border-b border-zinc-200 bg-white/90 backdrop-blur md:block">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="rounded-md text-sm font-semibold text-ink">
            {trip.name}
          </Link>
          <div className="flex flex-wrap items-center justify-end gap-2">
            {navItems.map((item) => {
              const active = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                    active
                      ? "bg-moss text-white"
                      : "text-zinc-600 hover:bg-zinc-100 hover:text-ink"
                  }`}
                >
                  {getNavLabel(item, language, t)}
                </Link>
              );
            })}
            <LanguageToggle />
          </div>
        </div>
      </nav>
      <header className="border-b border-zinc-200 bg-white/90 px-4 py-3 backdrop-blur md:hidden">
        <div className="mx-auto flex max-w-lg items-center justify-between gap-3">
          <Link href="/" className="min-w-0 truncate rounded-md text-sm font-semibold text-ink">
            {trip.name}
          </Link>
          <LanguageToggle compact />
        </div>
      </header>
      <nav className="mobile-bottom-nav fixed inset-x-0 bottom-0 z-50 border-t border-zinc-200 bg-white/95 px-2 pt-1 backdrop-blur md:hidden">
        <div className="mx-auto grid max-w-lg grid-cols-5 gap-1">
          {mobileNavItems.map((item) => {
            const active =
              pathname === item.href ||
              (item.href === "/more" &&
                ["/packing", "/documents"].includes(pathname));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-md px-1 py-2 text-center text-xs font-semibold transition-colors ${
                  active ? "bg-moss text-white" : "text-zinc-600"
                }`}
              >
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
  language: ReturnType<typeof useLanguage>["language"],
  t: ReturnType<typeof useLanguage>["t"]
) {
  if ("label" in item && item.label) {
    return item.label[language];
  }

  return t((item as { labelKey: TranslationKey }).labelKey);
}

export function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-paper text-ink">
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <Navigation />
      <TripAccessToolbar />
      <main
        id="main-content"
        className="mobile-main-shell mx-auto max-w-6xl px-4 pt-6 sm:px-6 md:pb-12 md:pt-8"
      >
        {children}
      </main>
    </div>
  );
}
