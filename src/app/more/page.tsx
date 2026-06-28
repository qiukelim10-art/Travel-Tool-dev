"use client";

import { useMemo } from "react";
import { EmergencyQuickAccess } from "@/components/EmergencyQuickAccess";
import { getDestinationVisualIdentity } from "@/lib/destinationVisuals";
import { useLanguage, type Language } from "@/lib/i18n";
import { useTripSettingsView } from "@/lib/useTripSettings";

type LocalizedText = Record<Language, string>;

const moreItems = [
  {
    href: "/settings",
    icon: "tune",
    eyebrow: {
      en: "Setup",
      zh: "设置"
    },
    title: {
      en: "Trip Settings",
      zh: "行程设置"
    },
    description: {
      en: "Trip basics, default currencies, travelers, and route stops for this private trip.",
      zh: "管理当前私人行程的基础信息、默认货币、成员和路线停靠点。"
    },
    detail: {
      en: "Basics · Travelers · Route",
      zh: "基础 · 成员 · 路线"
    }
  },
  {
    href: "/packing",
    icon: "luggage",
    eyebrow: {
      en: "Checklist",
      zh: "清单"
    },
    title: {
      en: "Packing List",
      zh: "行李清单"
    },
    description: {
      en: "Pack-by-traveler checks for required, shared, and optional items.",
      zh: "按成员检查必带、共享和可选物品的打包状态。"
    },
    detail: {
      en: "Required · Shared · Packed",
      zh: "必带 · 共享 · 已打包"
    }
  },
  {
    href: "/documents",
    icon: "folder_open",
    eyebrow: {
      en: "Safe links",
      zh: "安全链接"
    },
    title: {
      en: "Documents",
      zh: "文件清单"
    },
    description: {
      en: "Checklist and cloud-folder references without storing sensitive files in the app.",
      zh: "用于检查清单和云端文件夹引用，不在应用里存放敏感文件。"
    },
    detail: {
      en: "Folder links · Safety notes",
      zh: "文件夹链接 · 安全备注"
    }
  }
] satisfies Array<{
  href: string;
  icon: string;
  eyebrow: LocalizedText;
  title: LocalizedText;
  description: LocalizedText;
  detail: LocalizedText;
}>;

const moreCopy = {
  en: {
    workspace: "Trip Workspace",
    sanctuary: "Private Sanctuary",
    pageTitle: "More",
    pageDescription: "The practical prep desk for settings, packing, and safe document links.",
    toolsTitle: "Trip prep tools",
    shortcutsTitle: "Mobile prep shortcuts",
    shortcutsDescription: "Three private tools stay one tap away without adding new workspace logic.",
    open: "Open",
    toolsCount: "3 tools",
    privateAccess: "Private link access",
    sharedWorkspace: "Shared workspace",
    sosLabel: "Open SOS"
  },
  zh: {
    workspace: "Trip Workspace",
    sanctuary: "私人空间",
    pageTitle: "More",
    pageDescription: "集中放置行程设置、行李清单和安全文件链接的手机端准备台。",
    toolsTitle: "旅行准备工具",
    shortcutsTitle: "移动端准备入口",
    shortcutsDescription: "三个私人工具保持一键进入，不新增新的业务逻辑。",
    open: "打开",
    toolsCount: "3 个工具",
    privateAccess: "私人链接访问",
    sharedWorkspace: "共享工作区",
    sosLabel: "打开 SOS"
  }
} as const;

export default function MorePage() {
  const { language, t, toggleLanguage } = useLanguage();
  const { trip } = useTripSettingsView({ genericFallback: true });
  const copy = moreCopy[language];
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
  const sosCountries = emergencyCountriesForVisual(destinationVisual);
  const tripDetail = [trip.dateRangeLabel, trip.routeLabel].filter(Boolean).join(" · ");
  const desktopNavItems = getDesktopNavItems(t);
  const mobileNavItems = getMobileNavItems(t);

  return (
    <div className="stitch-today-page stitch-more-page">
      <header className="stitch-top-appbar stitch-more-topbar stitch-budget-topbar">
        <div className="stitch-budget-top-title">
          <h1>{trip.name}</h1>
          <p>{tripDetail}</p>
        </div>
        <div className="stitch-top-actions">
          <IconButton icon="language" label={t("language.label")} onClick={toggleLanguage} />
          <SosIconButton countries={sosCountries} label={copy.sosLabel} />
        </div>
      </header>

      <nav className="stitch-side-nav" aria-label={copy.workspace}>
        <div className="stitch-side-brand">
          <strong>{copy.workspace}</strong>
          <span>{copy.sanctuary}</span>
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

      <main className="stitch-main-canvas stitch-more-main">
        <div className="stitch-dashboard-grid stitch-more-grid">
          <div className="stitch-main-stack stitch-more-stack">
            <section className="stitch-card more-tools-panel" aria-labelledby="more-tools-title">
              <div className="more-tools-panel__header">
                <div>
                  <p className="cockpit-eyebrow">{copy.toolsCount}</p>
                  <h2 id="more-tools-title">{copy.toolsTitle}</h2>
                </div>
              </div>

              <div className="more-tool-grid">
                {moreItems.map((item) => (
                  <a key={item.href} href={item.href} className="more-tool-card">
                    <span className="more-tool-card__icon" aria-hidden="true">
                      <MaterialIcon icon={item.icon} />
                    </span>
                    <span className="more-tool-card__body">
                      <span className="cockpit-eyebrow">{item.eyebrow[language]}</span>
                      <strong>{item.title[language]}</strong>
                      <small className="more-tool-card__mobile-detail">{item.detail[language]}</small>
                      <span className="more-tool-card__description">{item.description[language]}</span>
                    </span>
                    <span className="more-tool-card__action">
                      {copy.open}
                      <MaterialIcon icon="chevron_right" />
                    </span>
                  </a>
                ))}
              </div>
            </section>

          </div>
        </div>
      </main>

      <nav className="stitch-bottom-nav" aria-label={copy.workspace}>
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

function getDesktopNavItems(t: ReturnType<typeof useLanguage>["t"]) {
  return [
    { href: "/", icon: "home", label: t("nav.dashboard"), active: false },
    { href: "/itinerary", icon: "event_note", label: t("nav.itinerary"), active: false },
    { href: "/bookings", icon: "confirmation_number", label: t("nav.bookings"), active: false },
    { href: "/budget", icon: "payments", label: t("nav.budget"), active: false },
    { href: "/more", icon: "more_horiz", label: t("nav.more"), active: true }
  ];
}

function getMobileNavItems(t: ReturnType<typeof useLanguage>["t"]) {
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
    <button type="button" onClick={onClick} className={`stitch-icon-button ${surface ? "stitch-icon-button--surface" : ""}`} aria-label={label}>
      <MaterialIcon icon={icon} />
    </button>
  );
}

function SosIconButton({ countries, label, surface = false }: { countries: { code: string; name: string }[]; label: string; surface?: boolean }) {
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

function emergencyCountriesForVisual(visual: ReturnType<typeof getDestinationVisualIdentity>) {
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
