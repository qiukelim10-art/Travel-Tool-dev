"use client";

import { useState } from "react";
import { getEmergencyContacts } from "@/data/emergencyContacts";
import { useLanguage } from "@/lib/i18n";

type EmergencyQuickAccessProps = {
  countryCode?: string;
  countryName?: string;
  countries?: EmergencyCountry[];
};

type EmergencyCountry = {
  code: string;
  name: string;
};

export function EmergencyQuickAccess({ countries, countryCode, countryName }: EmergencyQuickAccessProps) {
  const [open, setOpen] = useState(false);
  const { t } = useLanguage();
  const contactGroups = normalizeEmergencyCountries({ countries, countryCode, countryName }).map((country) => ({
    country,
    contacts: [...getEmergencyContacts(country.code)].sort((a, b) => a.priority - b.priority)
  }));
  const isMultiCountry = contactGroups.length > 1;
  const title = isMultiCountry
    ? `${t("sos.title")} · Multi-country`
    : contactGroups[0]?.country.name
      ? `${t("sos.title")} · ${contactGroups[0].country.name}`
      : t("sos.title");

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
        <div className="fixed inset-0 z-50 flex items-end bg-ink/35 p-3 backdrop-blur-sm sm:items-start sm:justify-end sm:p-6">
          <section
            id="emergency-quick-access-panel"
            className="emergency-panel w-full max-w-[22rem] rounded-lg border border-red-200 bg-white p-3 shadow-lg sm:mt-16"
            aria-label={t("sos.ariaLabel")}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold text-ink">{title}</h2>
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

            <div className="mt-3 space-y-3">
              {contactGroups.map(({ contacts, country }) => (
                <section key={country.code} className="emergency-country-group" aria-label={country.name}>
                  {isMultiCountry ? <h3>{country.name}</h3> : null}
                  <div className="space-y-2">
                    {contacts.map((contact) => (
                      <div
                        key={`${country.code}-${contact.id}`}
                        className="emergency-contact-card rounded-md border border-zinc-200 bg-zinc-50 p-3"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-ink">{contact.label}</p>
                            <p className="mt-1 text-xs leading-5 text-zinc-600">
                              {contact.description}
                            </p>
                          </div>
                          {contact.number ? (
                            <a
                              href={`tel:${contact.number}`}
                              className="emergency-call-link shrink-0 rounded-md bg-red-700 px-3 py-2 text-sm font-semibold text-white hover:bg-red-800"
                            >
                              {t("sos.callNumber", { number: contact.number })}
                            </a>
                          ) : null}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          </section>
        </div>
      ) : null}
    </div>
  );
}

function normalizeEmergencyCountries({
  countries = [],
  countryCode,
  countryName
}: EmergencyQuickAccessProps): EmergencyCountry[] {
  const fallbackCountries =
    countryCode
      ? [{ code: countryCode, name: countryName ?? countryCode }]
      : [{ code: "", name: countryName ?? "" }];
  const candidates = countries.length > 0 ? countries : fallbackCountries;
  const seen = new Set<string>();

  return candidates
    .map((country) => ({
      code: normalizeCountryCode(country.code),
      name: country.name || country.code
    }))
    .filter((country) => {
      if (seen.has(country.code)) {
        return false;
      }

      seen.add(country.code);
      return true;
    });
}

function normalizeCountryCode(code?: string) {
  const normalizedCode = code?.trim().toUpperCase() ?? "";
  return normalizedCode === "UK" ? "GB" : normalizedCode;
}
