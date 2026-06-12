"use client";

import { type MouseEvent, useState } from "react";

type SearchStatus = "idle" | "locating" | "fallback";

type GoogleMapsSearchPanelProps = {
  title: string;
  description: string;
  defaultQuery: string;
  quickSearches: string[];
  cityOptions?: string[];
};

const defaultCities = ["Rome", "Florence", "Venice", "Milan"];

function searchUrl(query: string, city?: string) {
  const normalizedQuery = query.trim() || "places";
  const searchText = city ? `${normalizedQuery} in ${city}` : `${normalizedQuery} near me`;
  return `https://www.google.com/maps/search/${encodeURIComponent(searchText)}`;
}

function locationSearchUrl(query: string, latitude: number, longitude: number) {
  const normalizedQuery = query.trim() || "places";
  return `https://www.google.com/maps/search/${encodeURIComponent(
    normalizedQuery
  )}/@${latitude},${longitude},15z`;
}

function redirectOpenedWindow(openedWindow: Window | null, url: string) {
  if (openedWindow) {
    openedWindow.opener = null;
    openedWindow.location.href = url;
  }
}

export function GoogleMapsSearchPanel({
  title,
  description,
  defaultQuery,
  quickSearches,
  cityOptions = defaultCities
}: GoogleMapsSearchPanelProps) {
  const [query, setQuery] = useState(defaultQuery);
  const [city, setCity] = useState(cityOptions[0] ?? "Rome");
  const [status, setStatus] = useState<SearchStatus>("idle");

  const openNearCurrentLocation = (
    event: MouseEvent<HTMLAnchorElement>,
    nextQuery = query
  ) => {
    if (!window.isSecureContext || !navigator.geolocation) {
      setStatus("fallback");
      return;
    }

    const openedWindow = window.open("", "_blank", "noopener,noreferrer");

    if (!openedWindow) {
      setStatus("fallback");
      return;
    }

    event.preventDefault();
    setStatus("locating");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setStatus("idle");
        redirectOpenedWindow(
          openedWindow,
          locationSearchUrl(
            nextQuery,
            position.coords.latitude,
            position.coords.longitude
          )
        );
      },
      () => {
        setStatus("fallback");
        redirectOpenedWindow(openedWindow, searchUrl(nextQuery, city));
      },
      {
        enableHighAccuracy: false,
        maximumAge: 1000 * 60 * 10,
        timeout: 8000
      }
    );
  };

  return (
    <section className="rounded-lg border border-zinc-200 bg-white p-4 shadow-soft">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-terracotta">
            Google Maps search
          </p>
          <h2 className="mt-1 text-xl font-semibold text-ink">{title}</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-600">
            {description}
          </p>
        </div>
        <p className="rounded-md bg-zinc-50 px-3 py-2 text-xs font-medium leading-5 text-zinc-600 md:max-w-64">
          Ratings, reviews, opening hours, and reservation info open in Google Maps.
        </p>
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_220px_auto_auto]">
        <label className="text-sm font-semibold text-ink">
          Search term
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="mt-2 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-700"
            placeholder="pasta, gelato, museum..."
          />
        </label>
        <label className="text-sm font-semibold text-ink">
          City fallback
          <select
            value={city}
            onChange={(event) => setCity(event.target.value)}
            className="mt-2 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-700"
          >
            {cityOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
        <a
          href={searchUrl(query, city)}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(event) => openNearCurrentLocation(event)}
          className="self-end rounded-md bg-moss px-4 py-2 text-sm font-semibold text-white"
        >
          {status === "locating" ? "Locating..." : "Search nearby"}
        </a>
        <a
          href={searchUrl(query, city)}
          target="_blank"
          rel="noopener noreferrer"
          className="self-end rounded-md border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-ink"
        >
          Search city
        </a>
      </div>

      {status === "fallback" ? (
        <p className="mt-3 rounded-md bg-amber-50 px-3 py-2 text-sm leading-6 text-amber-800">
          Location was unavailable or denied, so Google Maps opened the selected city fallback instead.
        </p>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-2">
        {quickSearches.map((quickSearch) => (
          <a
            key={quickSearch}
            href={searchUrl(quickSearch)}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm font-semibold text-zinc-700"
          >
            {quickSearch}
          </a>
        ))}
      </div>
    </section>
  );
}
