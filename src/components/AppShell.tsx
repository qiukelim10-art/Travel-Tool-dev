"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { Layout } from "@/components/Layout";
import { SetupGenerationPanel, type SetupGenerationBase } from "@/components/SetupGenerationPanel";
import { TripAccessGate, TripAccessProvider } from "@/lib/access";
import { LanguageProvider, useLanguage, type Language } from "@/lib/i18n";
import { useTripSettingsView } from "@/lib/useTripSettings";

const publicRoutes = new Set(["/pilot"]);
const standaloneWorkspaceRoutes = new Set(["/", "/itinerary", "/bookings", "/budget", "/documents", "/more", "/settings", "/packing"]);

const starterGateCopy = {
  en: {
    workspace: "Trip Workspace",
    sanctuary: "Private Sanctuary",
    navLabel: "Starter workspace setup",
    activeItem: "Starter setup",
    languageLabel: "Switch to Chinese",
    languageButton: "中文",
    eyebrow: "Private setup",
    title: "Build the starter workspace",
    description:
      "Your private link is active. Answer the starter questions once, then the trip workspace opens with planning defaults, checklists, and a first itinerary shell.",
    loadingTitle: "Loading starter setup",
    loadingDescription: "Checking the current trip setup status...",
    errorTitle: "Starter setup could not load",
    errorDescription: "Refresh the page and try again. The private link remains the access boundary."
  },
  zh: {
    workspace: "行程工作区",
    sanctuary: "私人协作空间",
    navLabel: "Starter workspace 设置",
    activeItem: "Starter 设置",
    languageLabel: "切换到英文",
    languageButton: "EN",
    eyebrow: "私密设置",
    title: "生成 starter workspace",
    description:
      "你的私密链接已生效。先回答一次 starter 问题，之后系统会打开带有默认规划、清单和初始行程框架的工作区。",
    loadingTitle: "正在加载 starter 设置",
    loadingDescription: "正在检查当前行程的 setup 状态...",
    errorTitle: "无法加载 starter 设置",
    errorDescription: "请刷新页面重试。私密链接仍然是访问边界。"
  }
} as const satisfies Record<Language, Record<string, string>>;

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isPublicRoute = publicRoutes.has(pathname);
  const isStandaloneWorkspaceRoute = standaloneWorkspaceRoutes.has(pathname);

  return (
    <LanguageProvider>
      {isPublicRoute ? (
        children
      ) : (
        <TripAccessProvider>
          <TripAccessGate>
            <StarterWorkspaceGate>
              {isStandaloneWorkspaceRoute ? children : <Layout>{children}</Layout>}
            </StarterWorkspaceGate>
          </TripAccessGate>
        </TripAccessProvider>
      )}
    </LanguageProvider>
  );
}

function StarterWorkspaceGate({ children }: { children: ReactNode }) {
  const { language } = useLanguage();
  const { settings, trip, loading, error } = useTripSettingsView({ genericFallback: true });
  const labels = starterGateCopy[language];

  if (loading && !settings) {
    return (
      <StarterGateFrame labels={labels}>
        <section className="stitch-card stitch-starter-status-card" aria-labelledby="starter-loading-title">
          <div className="stitch-starter-icon" aria-hidden="true">
            <span className="material-symbols-outlined">pending</span>
          </div>
          <p className="cockpit-eyebrow">{labels.eyebrow}</p>
          <h1 id="starter-loading-title">{labels.loadingTitle}</h1>
          <p>{labels.loadingDescription}</p>
        </section>
      </StarterGateFrame>
    );
  }

  if (error && !settings) {
    return (
      <StarterGateFrame labels={labels}>
        <section className="stitch-card stitch-starter-status-card" aria-labelledby="starter-error-title">
          <div className="stitch-starter-icon stitch-starter-icon--error" aria-hidden="true">
            <span className="material-symbols-outlined">error</span>
          </div>
          <p className="cockpit-eyebrow">{labels.eyebrow}</p>
          <h1 id="starter-error-title">{labels.errorTitle}</h1>
          <p>{labels.errorDescription}</p>
          <p role="alert" className="setup-generation-status setup-generation-status--error">
            {error}
          </p>
        </section>
      </StarterGateFrame>
    );
  }

  if (!settings || settings.trip.setupCompletedAt) {
    return <>{children}</>;
  }

  return (
    <StarterGateFrame labels={labels}>
      <section className="stitch-starter-hero" aria-labelledby="starter-setup-title">
        <div className="stitch-starter-icon" aria-hidden="true">
          <span className="material-symbols-outlined">auto_awesome</span>
        </div>
        <div>
          <p className="cockpit-eyebrow">{labels.eyebrow}</p>
          <h1 id="starter-setup-title">{labels.title}</h1>
          <p>{labels.description}</p>
        </div>
      </section>
      <SetupGenerationPanel surface="gate" base={tripToSetupGenerationBase(trip)} />
    </StarterGateFrame>
  );
}

function StarterGateFrame({
  children,
  labels
}: {
  children: ReactNode;
  labels: (typeof starterGateCopy)[Language];
}) {
  const { toggleLanguage } = useLanguage();

  return (
    <div className="stitch-today-page stitch-starter-page">
      <header className="stitch-top-appbar stitch-budget-topbar stitch-starter-topbar">
        <div className="stitch-budget-top-title">
          <h1>{labels.workspace}</h1>
          <p>{labels.sanctuary}</p>
        </div>
        <button
          type="button"
          onClick={toggleLanguage}
          className="stitch-access-language-button"
          aria-label={labels.languageLabel}
        >
          <span className="material-symbols-outlined" aria-hidden="true">language</span>
          <span>{labels.languageButton}</span>
        </button>
      </header>

      <nav className="stitch-side-nav" aria-label={labels.navLabel}>
        <div className="stitch-side-brand">
          <strong>{labels.workspace}</strong>
          <span>{labels.sanctuary}</span>
        </div>
        <div className="stitch-side-links">
          <div className="stitch-side-link stitch-side-link--active">
            <span className="material-symbols-outlined" aria-hidden="true">auto_awesome</span>
            <span>{labels.activeItem}</span>
          </div>
        </div>
      </nav>

      <main className="stitch-main-canvas stitch-starter-main">
        <section className="stitch-trip-heading stitch-starter-heading" aria-label={labels.navLabel}>
          <div>
            <h1>{labels.workspace}</h1>
            <p>{labels.sanctuary}</p>
          </div>
          <div className="stitch-desktop-actions">
            <button
              type="button"
              onClick={toggleLanguage}
              className="stitch-access-language-button stitch-access-language-button--surface"
              aria-label={labels.languageLabel}
            >
              <span className="material-symbols-outlined" aria-hidden="true">language</span>
              <span>{labels.languageButton}</span>
            </button>
          </div>
        </section>
        {children}
      </main>
    </div>
  );
}

function tripToSetupGenerationBase(trip: ReturnType<typeof useTripSettingsView>["trip"]): SetupGenerationBase {
  return {
    tripName: trip.name,
    destination: trip.destination,
    startDate: trip.startDate,
    endDate: trip.endDate,
    timezone: trip.timezone,
    defaultCurrencies: trip.defaultCurrencies,
    travelerNames: trip.travelerDisplayNames,
    routeCities: trip.routeCities,
    routeStops: trip.routeStops
  };
}
