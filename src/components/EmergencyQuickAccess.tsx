"use client";

import { useState } from "react";
import { emergencyContacts } from "@/data/emergencyContacts";
import { useLanguage } from "@/lib/i18n";

export function EmergencyQuickAccess() {
  const [open, setOpen] = useState(false);
  const { t } = useLanguage();
  const contacts = [...emergencyContacts].sort((a, b) => a.priority - b.priority);

  return (
    <div className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-bold text-red-700 shadow-soft hover:bg-red-100"
        aria-expanded={open}
        aria-controls="emergency-quick-access-panel"
        aria-label={t("sos.ariaLabel")}
      >
        {t("sos.button")}
      </button>

      {open ? (
        <section
          id="emergency-quick-access-panel"
          className="absolute right-0 top-full z-40 mt-2 w-[19rem] max-w-[calc(100vw-2rem)] rounded-lg border border-red-200 bg-white p-3 shadow-lg"
          aria-label={t("sos.ariaLabel")}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-ink">{t("sos.title")}</h2>
              <p className="mt-1 text-xs leading-5 text-zinc-600">
                {t("sos.description")}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-md px-2 py-1 text-xs font-semibold text-zinc-600 hover:bg-zinc-100"
              aria-label={t("sos.closeAria")}
            >
              {t("sos.close")}
            </button>
          </div>

          <div className="mt-3 space-y-2">
            {contacts.map((contact) => (
              <div
                key={contact.id}
                className="rounded-md border border-zinc-200 bg-zinc-50 p-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-ink">{contact.label}</p>
                    <p className="mt-1 text-xs leading-5 text-zinc-600">
                      {contact.description}
                    </p>
                  </div>
                  <a
                    href={`tel:${contact.number}`}
                    className="shrink-0 rounded-md bg-red-700 px-3 py-2 text-sm font-semibold text-white hover:bg-red-800"
                  >
                    {t("sos.callNumber", { number: contact.number })}
                  </a>
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
