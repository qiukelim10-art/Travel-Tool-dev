"use client";

import { useState, type ReactNode } from "react";
import { getEmergencyContacts } from "@/data/emergencyContacts";
import { useLanguage } from "@/lib/i18n";

type EmergencyQuickAccessProps = {
  countryCode?: string;
  countryName?: string;
  countries?: EmergencyCountry[];
  triggerAriaLabel?: string;
  triggerChildren?: ReactNode;
  triggerClassName?: string;
};

type EmergencyCountry = {
  code: string;
  name: string;
};

export function EmergencyQuickAccess({
  countries,
  countryCode,
  countryName,
  triggerAriaLabel,
  triggerChildren,
  triggerClassName
}: EmergencyQuickAccessProps) {
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
        className={
          triggerClassName ??
          "rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-bold text-red-700 shadow-soft hover:bg-red-100"
        }
        aria-expanded={open}
        aria-controls="emergency-quick-access-panel"
        aria-label={triggerAriaLabel ?? t("sos.ariaLabel")}
      >
        {triggerChildren ?? t("sos.button")}
      </button>

      {open ? (
        <div className="stitch-sos-backdrop">
          <section
            id="emergency-quick-access-panel"
            className="stitch-card stitch-sos-panel emergency-panel"
            aria-label={t("sos.ariaLabel")}
          >
            <div className="stitch-sos-heading">
              <div>
                <h2>{title}</h2>
                <p>
                  {t("sos.description")}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="stitch-sos-close"
                aria-label={t("sos.closeAria")}
              >
                {t("sos.close")}
              </button>
            </div>

            <div className="stitch-sos-list">
              {contactGroups.map(({ contacts, country }) => (
                <section key={country.code} className="emergency-country-group" aria-label={country.name}>
                  {isMultiCountry ? <h3>{country.name}</h3> : null}
                  <div className="stitch-sos-country-list">
                    {contacts.map((contact) => (
                      <div
                        key={`${country.code}-${contact.id}`}
                        className="stitch-sos-contact emergency-contact-card"
                      >
                        <div>
                          <div>
                            <p>{contact.label}</p>
                            <span>
                              {contact.description}
                            </span>
                          </div>
                          {contact.number ? (
                            <a
                              href={`tel:${contact.number}`}
                              className="stitch-sos-call emergency-call-link"
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
