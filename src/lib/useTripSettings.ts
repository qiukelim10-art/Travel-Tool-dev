"use client";

import { useEffect, useMemo, useState } from "react";
import { travelers as fallbackTravelers, tripInfo, type Traveler } from "@/data/tripData";
import type { SharedCurrency, TripSettingsResponse } from "@/lib/sharedDataTypes";

const requestTimeoutMs = 10000;
const tripSettingsCacheKey = "trip-dashboard-active-settings";
const tripSettingsUpdatedEvent = "trip-settings-updated";
const shareTokenStorageKey = "trip-dashboard-share-token";
const tripQueryParam = "trip";
const tripShareTokenHeader = "x-trip-share-token";

export type TripSettingsView = {
  name: string;
  destination: string;
  startDate: string | null;
  endDate: string | null;
  dateRangeLabel: string;
  routeCities: string[];
  routeLabel: string;
  travelerCount: number;
  travelerDisplayNames: string[];
  travelers: Traveler[];
  activeTravelers: Traveler[];
  defaultCurrencies: SharedCurrency[];
  timezone: string;
  setupCompletedAt: string | null;
};

const fallbackTripSettingsView: TripSettingsView = {
  name: tripInfo.title,
  destination: tripInfo.countries[0] ?? "",
  startDate: tripInfo.startDate,
  endDate: tripInfo.endDate,
  dateRangeLabel: `${formatShortDate(tripInfo.startDate)} - ${formatShortDate(tripInfo.endDate)}`,
  routeCities: tripInfo.cities,
  routeLabel: tripInfo.cities.join(" -> "),
  travelerCount: tripInfo.participants.length,
  travelerDisplayNames: tripInfo.participants,
  travelers: fallbackTravelers,
  activeTravelers: fallbackTravelers,
  defaultCurrencies: ["EUR", "SGD", "MYR"],
  timezone: "Europe/Rome",
  setupCompletedAt: null
};

const genericTripSettingsView: TripSettingsView = {
  ...fallbackTripSettingsView,
  name: "Private Trip Dashboard"
};

type TripSettingsViewOptions = {
  genericFallback?: boolean;
};

export function useTripSettingsView(options: TripSettingsViewOptions = {}) {
  const [settings, setSettings] = useState<TripSettingsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setSettings(readCachedTripSettings());

    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), requestTimeoutMs);

    async function loadSettings() {
      setLoading(true);
      try {
        const response = await fetch("/api/trip-settings", {
          cache: "no-store",
          headers: tripSettingsAccessHeaders(readTripShareTokenForRequest()),
          signal: controller.signal
        });
        const data = (await response.json()) as Partial<TripSettingsResponse> & { error?: string };

        if (!response.ok || !isTripSettingsResponse(data)) {
          throw new Error(data.error ?? "Unable to load trip settings.");
        }

        setSettings(data);
        writeCachedTripSettings(data);
        setError(null);
      } catch (loadError) {
        if (loadError instanceof DOMException && loadError.name === "AbortError") {
          setError("Trip settings request timed out.");
          return;
        }

        setError(loadError instanceof Error ? loadError.message : "Unable to load trip settings.");
      } finally {
        window.clearTimeout(timeoutId);
        setLoading(false);
      }
    }

    void loadSettings();

    return () => {
      window.clearTimeout(timeoutId);
      controller.abort();
    };
  }, []);

  useEffect(() => {
    function handleTripSettingsUpdated(event: Event) {
      const detail = (event as CustomEvent<TripSettingsResponse>).detail;
      if (isTripSettingsResponse(detail)) {
        setSettings(detail);
      }
    }

    function handleStorage(event: StorageEvent) {
      if (event.key === tripSettingsCacheKey) {
        setSettings(readCachedTripSettings());
      }
    }

    window.addEventListener(tripSettingsUpdatedEvent, handleTripSettingsUpdated);
    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener(tripSettingsUpdatedEvent, handleTripSettingsUpdated);
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  const trip = useMemo(
    () => (settings ? buildTripSettingsView(settings) : options.genericFallback ? genericTripSettingsView : fallbackTripSettingsView),
    [options.genericFallback, settings]
  );

  return {
    trip,
    settings,
    loading,
    error
  };
}

export function publishTripSettings(settings: TripSettingsResponse) {
  if (typeof window === "undefined") {
    return;
  }

  writeCachedTripSettings(settings);
  window.dispatchEvent(new CustomEvent(tripSettingsUpdatedEvent, { detail: settings }));
}

function buildTripSettingsView(settings: TripSettingsResponse): TripSettingsView {
  const routeCities = settings.routeStops.map((stop) => stop.city).filter(Boolean);
  const activeTravelers = settings.travelers.filter((traveler) => traveler.isActive);
  const travelerDisplayNames = activeTravelers.map((traveler) => traveler.displayName);
  const mappedTravelers = settings.travelers.map((traveler) => ({
    id: traveler.id,
    name: traveler.displayName,
    displayName: traveler.displayName,
    displayOrder: traveler.displayOrder,
    isActive: traveler.isActive
  }));

  return {
    name: settings.trip.name,
    destination: settings.trip.destination,
    startDate: settings.trip.startDate,
    endDate: settings.trip.endDate,
    dateRangeLabel: formatDateRange(settings.trip.startDate, settings.trip.endDate),
    routeCities,
    routeLabel: routeCities.length > 0 ? routeCities.join(" -> ") : settings.trip.destination,
    travelerCount: activeTravelers.length,
    travelerDisplayNames,
    travelers: mappedTravelers,
    activeTravelers: mappedTravelers.filter((traveler) => traveler.isActive),
    defaultCurrencies: settings.trip.defaultCurrencies,
    timezone: settings.trip.timezone,
    setupCompletedAt: settings.trip.setupCompletedAt ?? null
  };
}

function formatDateRange(startDate: string | null, endDate: string | null) {
  if (startDate && endDate) {
    return `${formatShortDate(startDate)} - ${formatShortDate(endDate)}`;
  }

  return formatShortDate(startDate ?? endDate ?? "");
}

function formatShortDate(value: string) {
  return value;
}

function readTripShareTokenForRequest() {
  if (typeof window === "undefined") {
    return "";
  }

  try {
    const url = new URL(window.location.href);
    return url.searchParams.get(tripQueryParam)?.trim() || window.localStorage.getItem(shareTokenStorageKey) || "";
  } catch {
    return window.localStorage.getItem(shareTokenStorageKey) || "";
  }
}

function tripSettingsAccessHeaders(shareToken: string): HeadersInit | undefined {
  return shareToken ? { [tripShareTokenHeader]: shareToken } : undefined;
}

function isTripSettingsResponse(value: unknown): value is TripSettingsResponse {
  if (!value || typeof value !== "object") {
    return false;
  }

  const response = value as Partial<TripSettingsResponse>;
  return Boolean(response.trip) && Array.isArray(response.travelers) && Array.isArray(response.routeStops);
}

function readCachedTripSettings() {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(tripSettingsCacheKey);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as unknown;
    return isTripSettingsResponse(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function writeCachedTripSettings(settings: TripSettingsResponse) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(tripSettingsCacheKey, JSON.stringify(settings));
  } catch {
    // Local storage is only an instant UI cache; API data remains the source of truth.
  }
}
