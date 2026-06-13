"use client";

import { useEffect, useMemo, useState } from "react";
import { tripInfo } from "@/data/tripData";
import type { TripSettingsResponse } from "@/lib/sharedDataTypes";

const requestTimeoutMs = 10000;

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
  travelerDisplayNames: tripInfo.participants
};

export function useTripSettingsView() {
  const [settings, setSettings] = useState<TripSettingsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), requestTimeoutMs);

    async function loadSettings() {
      try {
        const response = await fetch("/api/trip-settings", {
          cache: "no-store",
          signal: controller.signal
        });
        const data = (await response.json()) as Partial<TripSettingsResponse> & { error?: string };

        if (!response.ok || !isTripSettingsResponse(data)) {
          throw new Error(data.error ?? "Unable to load trip settings.");
        }

        setSettings(data);
        setError(null);
      } catch (loadError) {
        if (loadError instanceof DOMException && loadError.name === "AbortError") {
          setError("Trip settings request timed out.");
          return;
        }

        setError(loadError instanceof Error ? loadError.message : "Unable to load trip settings.");
      } finally {
        window.clearTimeout(timeoutId);
      }
    }

    void loadSettings();

    return () => {
      window.clearTimeout(timeoutId);
      controller.abort();
    };
  }, []);

  const trip = useMemo(
    () => (settings ? buildTripSettingsView(settings) : fallbackTripSettingsView),
    [settings]
  );

  return {
    trip,
    error
  };
}

function buildTripSettingsView(settings: TripSettingsResponse): TripSettingsView {
  const routeCities = settings.routeStops.map((stop) => stop.city).filter(Boolean);
  const activeTravelers = settings.travelers.filter((traveler) => traveler.isActive);
  const travelerDisplayNames = activeTravelers.map((traveler) => traveler.displayName);

  return {
    name: settings.trip.name,
    destination: settings.trip.destination,
    startDate: settings.trip.startDate,
    endDate: settings.trip.endDate,
    dateRangeLabel: formatDateRange(settings.trip.startDate, settings.trip.endDate),
    routeCities,
    routeLabel: routeCities.length > 0 ? routeCities.join(" -> ") : settings.trip.destination,
    travelerCount: activeTravelers.length,
    travelerDisplayNames
  };
}

function formatDateRange(startDate: string | null, endDate: string | null) {
  if (startDate && endDate) {
    return `${formatShortDate(startDate)} - ${formatShortDate(endDate)}`;
  }

  return formatShortDate(startDate ?? endDate ?? "");
}

function formatShortDate(value: string) {
  const [, month, day] = value.split("-");

  if (!month || !day) {
    return value;
  }

  return `${month}/${day}`;
}

function isTripSettingsResponse(value: unknown): value is TripSettingsResponse {
  if (!value || typeof value !== "object") {
    return false;
  }

  const response = value as Partial<TripSettingsResponse>;
  return Boolean(response.trip) && Array.isArray(response.travelers) && Array.isArray(response.routeStops);
}
