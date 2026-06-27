"use client";

import Link from "next/link";
import { useLanguage, type Language } from "@/lib/i18n";

type LocalizedText = Record<Language, string>;

const moreItems = [
  {
    href: "/settings",
    icon: "settings",
    eyebrow: {
      en: "Setup",
      zh: "设置"
    },
    title: {
      en: "Trip Settings",
      zh: "行程设置"
    },
    description: {
      en: "Trip basics, defaults, travelers, and route stops for the active private trip.",
      zh: "管理当前私人行程的基础信息、默认值、成员和路线停靠点。"
    },
    detail: {
      en: "Basics · Travelers · Route",
      zh: "基础 · 成员 · 路线"
    }
  },
  {
    href: "/packing",
    icon: "packing",
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
    icon: "documents",
    eyebrow: {
      en: "Safe links",
      zh: "安全链接"
    },
    title: {
      en: "Documents",
      zh: "文件清单"
    },
    description: {
      en: "Safe checklist and cloud-folder link references; no sensitive files stored here.",
      zh: "用于安全检查和云端文件夹链接引用，不在这里存放敏感文件。"
    },
    detail: {
      en: "Folder links · Safety notes",
      zh: "文件夹链接 · 安全备注"
    }
  }
] satisfies Array<{
  href: string;
  icon: "settings" | "packing" | "documents";
  eyebrow: LocalizedText;
  title: LocalizedText;
  description: LocalizedText;
  detail: LocalizedText;
}>;

const moreCopy = {
  en: {
    prepDeskTitle: "Trip prep tools",
    prepDeskDescription:
      "Settings, packing, and document links stay easy to reach without changing app behavior.",
    readyTitle: "Mobile prep shortcuts",
    readyDescription:
      "Same links, same routes, same access behavior. This page only clarifies where each tool belongs."
  },
  zh: {
    prepDeskTitle: "旅行准备工具",
    prepDeskDescription:
      "设置、行李和文件链接保持容易找到，同时不改变现有应用行为。",
    readyTitle: "移动端准备入口",
    readyDescription:
      "链接、路由和访问行为保持不变。这里仅让每个工具的用途更清楚。"
  }
} as const;

export default function MorePage() {
  const { language, t } = useLanguage();
  const copy = moreCopy[language];

  return (
    <div className="more-shell today-shell">
      <section className="more-tools-panel" aria-labelledby="more-tools-title">
        <div className="more-tools-panel__header">
          <div>
            <h2 id="more-tools-title">{copy.prepDeskTitle}</h2>
            <p>{copy.prepDeskDescription}</p>
          </div>
        </div>

        <div className="more-tool-grid">
          {moreItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="more-tool-card"
            >
              <span className={`more-tool-card__icon more-tool-card__icon--${item.icon}`} aria-hidden="true" />
              <span className="more-tool-card__body">
                <span className="cockpit-eyebrow">{item.eyebrow[language]}</span>
                <strong>{item.title[language]}</strong>
                <small className="more-tool-card__mobile-detail">{item.detail[language]}</small>
                <span className="more-tool-card__description">{item.description[language]}</span>
              </span>
              <span className="more-tool-card__action">
                {t("page.more.open")}
                <span aria-hidden="true">→</span>
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="more-review-card" aria-labelledby="more-review-title">
        <div>
          <h2 id="more-review-title">{copy.readyTitle}</h2>
          <p>{copy.readyDescription}</p>
        </div>
        <div className="more-review-card__items" aria-label={copy.readyTitle}>
          {moreItems.map((item) => (
            <span key={item.href}>
              <span className={`more-review-card__icon more-review-card__icon--${item.icon}`} aria-hidden="true" />
              {item.title[language]}
            </span>
          ))}
        </div>
      </section>
    </div>
  );
}
