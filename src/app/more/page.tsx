"use client";

import Link from "next/link";
import { SectionHeader } from "@/components/SectionHeader";
import { useLanguage, type TranslationKey } from "@/lib/i18n";

const moreItems = [
  {
    href: "/map",
    titleKey: "page.map.title",
    description: {
      en: "Maps, important places, stations, and location links.",
      zh: "地图、重要地点、车站和位置链接。"
    }
  },
  {
    href: "/food",
    titleKey: "page.food.title",
    description: {
      en: "Restaurant shortlist and reservation status.",
      zh: "餐厅候选清单和订位状态。"
    }
  },
  {
    href: "/attractions",
    titleKey: "page.attractions.title",
    description: {
      en: "Sightseeing priorities, ticket requirements, and booking status.",
      zh: "观光优先级、门票需求和预订状态。"
    }
  },
  {
    href: "/packing",
    titleKey: "page.packing.title",
    description: {
      en: "Required items, shared responsibilities, and travel essentials.",
      zh: "必备物品、共同责任和旅行必需品。"
    }
  },
  {
    href: "/documents",
    titleKey: "page.documents.title",
    description: {
      en: "Private link placeholders and sensitive document safety rules.",
      zh: "私人链接占位和敏感文件安全规则。"
    }
  }
] as const;

export default function MorePage() {
  const { language, t } = useLanguage();

  return (
    <div>
      <SectionHeader
        eyebrow={t("page.more.eyebrow")}
        title={t("page.more.title")}
        description={t("page.more.description")}
      />

      <div className="grid gap-3 md:grid-cols-2">
        {moreItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="rounded-lg border border-zinc-200 bg-white p-4 shadow-soft hover:border-moss"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-terracotta">
              {t("page.more.open")}
            </p>
            <h2 className="mt-1 text-xl font-semibold text-ink">
              {t(item.titleKey as TranslationKey)}
            </h2>
            <p className="mt-2 text-sm leading-6 text-zinc-600">
              {item.description[language]}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
