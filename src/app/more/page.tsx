"use client";

import Link from "next/link";
import { useLanguage, type Language } from "@/lib/i18n";

type LocalizedText = Record<Language, string>;

const moreItems = [
  {
    href: "/settings",
    icon: "settings",
    symbol: "⚙️",
    eyebrow: {
      en: "Setup",
      zh: "设置"
    },
    title: {
      en: "Trip Settings",
      zh: "行程设置"
    },
    description: {
      en: "Active trip basics, travelers, route stops, and display defaults.",
      zh: "管理当前 active trip 的基础信息、成员、路线城市和默认显示。"
    },
    detail: {
      en: "Route · Travelers · Defaults",
      zh: "路线 · 成员 · 默认值"
    }
  },
  {
    href: "/packing",
    icon: "packing",
    symbol: "🧳",
    eyebrow: {
      en: "Checklist",
      zh: "清单"
    },
    title: {
      en: "Packing List",
      zh: "行李清单"
    },
    description: {
      en: "Required items, shared responsibilities, and travel essentials.",
      zh: "必备物品、共同责任和旅行必需品。"
    },
    detail: {
      en: "Required · Shared · Packed",
      zh: "必备 · 共享 · 已打包"
    }
  },
  {
    href: "/documents",
    icon: "documents",
    symbol: "📁",
    eyebrow: {
      en: "Private links",
      zh: "私人链接"
    },
    title: {
      en: "Documents",
      zh: "文件"
    },
    description: {
      en: "Private link placeholders and sensitive document safety rules.",
      zh: "私人链接占位和敏感文件安全规则。"
    },
    detail: {
      en: "Cloud folders · Safe notes",
      zh: "云端文件夹 · 安全备注"
    }
  }
] satisfies Array<{
  href: string;
  icon: "settings" | "packing" | "documents";
  symbol: string;
  eyebrow: LocalizedText;
  title: LocalizedText;
  description: LocalizedText;
  detail: LocalizedText;
}>;

const moreCopy = {
  en: {
    prepDeskTitle: "Trip prep desk",
    prepDeskDescription:
      "Keep settings, packing, and documents easy to reach without changing app behavior.",
    readyTitle: "Ready for mobile review",
    readyDescription:
      "Same links, same routes, same access behavior. Only the More surface changes."
  },
  zh: {
    prepDeskTitle: "旅行准备台",
    prepDeskDescription:
      "让设置、行李和文件入口更容易找到，同时不改变现有应用行为。",
    readyTitle: "手机端审核准备",
    readyDescription:
      "相同链接、相同路由、相同访问行为。只更新 More 页面表层。"
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
              <span className={`more-tool-card__icon more-tool-card__icon--${item.icon}`} aria-hidden="true">
                {item.symbol}
              </span>
              <span className="more-tool-card__body">
                <span className="cockpit-eyebrow">{item.eyebrow[language]}</span>
                <strong>{item.title[language]}</strong>
                <small className="more-tool-card__mobile-detail">{item.detail[language]}</small>
                <span className="more-tool-card__description">{item.description[language]}</span>
              </span>
              <span className="more-tool-card__action">
                {t("page.more.open")}
                <span aria-hidden="true">›</span>
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
              <span className={`more-review-card__icon more-review-card__icon--${item.icon}`} aria-hidden="true">
                {item.symbol}
              </span>
              {item.title[language]}
            </span>
          ))}
        </div>
      </section>
    </div>
  );
}
