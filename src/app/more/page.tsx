"use client";

import Link from "next/link";
import { SectionHeader } from "@/components/SectionHeader";
import { useLanguage, type TranslationKey } from "@/lib/i18n";

const moreItems = [
  {
    href: "/settings",
    title: {
      en: "Trip Settings",
      zh: "Trip Settings"
    },
    description: {
      en: "Active trip basics, travelers, route stops, and display defaults.",
      zh: "管理当前 active trip 的基础信息、成员、路线城市和默认显示。"
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
              {"titleKey" in item ? t(item.titleKey as TranslationKey) : item.title[language]}
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
