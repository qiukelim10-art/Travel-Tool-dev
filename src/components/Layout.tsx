"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useLanguage, type TranslationKey } from "@/lib/i18n";

const navItems = [
  { href: "/", labelKey: "nav.dashboard", shortLabelKey: "nav.home" },
  { href: "/itinerary", labelKey: "nav.itinerary", shortLabelKey: "nav.plan" },
  { href: "/bookings", labelKey: "nav.bookings", shortLabelKey: "nav.book" },
  { href: "/budget", labelKey: "nav.budget", shortLabelKey: "nav.money" },
  { href: "/packing", labelKey: "nav.packing", shortLabelKey: "nav.pack" },
  { href: "/documents", labelKey: "nav.documents", shortLabelKey: "nav.docs" }
];

const mobileNavItems = [
  { href: "/", labelKey: "nav.dashboard", shortLabelKey: "nav.home" },
  { href: "/itinerary", labelKey: "nav.itinerary", shortLabelKey: "nav.plan" },
  { href: "/bookings", labelKey: "nav.bookings", shortLabelKey: "nav.book" },
  { href: "/budget", labelKey: "nav.budget", shortLabelKey: "nav.money" },
  { href: "/more", labelKey: "nav.more", shortLabelKey: "nav.more" }
];

function LanguageToggle({ compact = false }: { compact?: boolean }) {
  const { t, toggleLanguage } = useLanguage();

  return (
    <button
      type="button"
      onClick={toggleLanguage}
      className={`rounded-md border border-zinc-200 bg-white font-semibold text-ink ${
        compact
          ? "px-1 py-2 text-xs ring-1 ring-moss/20"
          : "px-3 py-2 text-sm ring-1 ring-moss/20 hover:bg-zinc-50"
      }`}
      aria-label={t("language.label")}
    >
      {compact ? t("language.switchShort") : t("language.switch")}
    </button>
  );
}

function Navigation() {
  const pathname = usePathname();
  const { t } = useLanguage();

  return (
    <>
      <nav className="hidden border-b border-zinc-200 bg-white/90 backdrop-blur md:block">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="text-sm font-semibold text-ink">
            Italy Trip 2026
          </Link>
          <div className="flex flex-wrap items-center justify-end gap-2">
            {navItems.map((item) => {
              const active = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-md px-3 py-2 text-sm font-medium ${
                    active
                      ? "bg-moss text-white"
                      : "text-zinc-600 hover:bg-zinc-100 hover:text-ink"
                  }`}
                >
                  {t(item.labelKey as TranslationKey)}
                </Link>
              );
            })}
          </div>
        </div>
      </nav>
      <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-zinc-200 bg-white/95 px-2 pb-2 pt-1 backdrop-blur md:hidden">
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
                className={`rounded-md px-1 py-2 text-center text-xs font-semibold ${
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

export function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-paper text-ink">
      <Navigation />
      <main className="mx-auto max-w-6xl px-4 pb-24 pt-6 sm:px-6 md:pb-12 md:pt-8">
        {children}
      </main>
    </div>
  );
}
