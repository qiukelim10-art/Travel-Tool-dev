"use client";

import { SectionHeader } from "@/components/SectionHeader";
import { documentLinks } from "@/data/tripData";
import { useLanguage } from "@/lib/i18n";
import { localizeList } from "@/lib/localize";

export default function DocumentsPage() {
  const { language, t } = useLanguage();
  const localizedDocuments = localizeList(language, documentLinks);
  const categories = Array.from(new Set(localizedDocuments.map((document) => document.category)));

  return (
    <div>
      <SectionHeader
        eyebrow={t("page.documents.eyebrow")}
        title={t("page.documents.title")}
        description={t("page.documents.description")}
      />

      <section className="mb-5 rounded-lg border border-red-200 bg-red-50 p-4 shadow-soft">
        <h2 className="text-lg font-semibold text-red-800">{t("page.documents.sensitiveRule")}</h2>
        <p className="mt-2 text-sm leading-6 text-red-800">
          {t("page.documents.sensitiveRuleBody")}
        </p>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        {categories.map((category) => (
          <section key={category} className="rounded-lg border border-zinc-200 bg-white p-4 shadow-soft">
            <h2 className="text-lg font-semibold text-ink">{category}</h2>
            <div className="mt-3 space-y-3">
              {localizedDocuments
                .filter((document) => document.category === category)
                .map((document) => (
                  <article key={document.title} className="rounded-lg border border-zinc-200 p-3">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h3 className="font-semibold text-ink">{document.title}</h3>
                        <p className="mt-1 text-sm text-zinc-600">
                          {t("common.owner")}: {document.owner}
                        </p>
                      </div>
                      <span
                        className={`rounded-full px-2 py-1 text-xs font-semibold ${
                          document.sensitive
                            ? "bg-red-100 text-red-800"
                            : "bg-zinc-100 text-zinc-700"
                        }`}
                      >
                        {document.sensitive ? t("page.documents.sensitive") : t("page.documents.standard")}
                      </span>
                    </div>
                    {document.notes ? (
                      <p className="mt-3 text-sm leading-6 text-zinc-600">{document.notes}</p>
                    ) : null}
                    <a
                      href={document.link}
                      className="mt-4 inline-flex rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold text-ink"
                    >
                      {t("common.privateLink")}
                    </a>
                  </article>
                ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
