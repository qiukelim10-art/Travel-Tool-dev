"use client";

import { useMemo, useState } from "react";
import austriaMap from "@/assets/maps/austria.svg";
import chinaMap from "@/assets/maps/china.svg";
import czechiaMap from "@/assets/maps/czechia.svg";
import franceMap from "@/assets/maps/france.svg";
import hungaryMap from "@/assets/maps/hungary.svg";
import italyMap from "@/assets/maps/italy.svg";
import japanMap from "@/assets/maps/japan.svg";
import koreaMap from "@/assets/maps/korea.svg";
import spainMap from "@/assets/maps/spain.svg";
import switzerlandMap from "@/assets/maps/switzerland.svg";
import unitedKingdomMap from "@/assets/maps/united-kingdom.svg";
import { TripPostmark } from "@/components/TripPostmark";
import type { TripRouteDestination } from "@/lib/destinationVisuals";

type TripRouteMapProps = {
  countryCode: string;
  countryName: string;
  destinations: TripRouteDestination[];
  label?: string;
  compact?: boolean;
  className?: string;
  cityName?: string | null;
  date?: string | null;
};

type ImportedSvg = string | { src: string };

type MapPoint = {
  x: number;
  y: number;
};

const mapAssetRegistry: Record<string, ImportedSvg> = {
  AT: austriaMap,
  CH: switzerlandMap,
  CN: chinaMap,
  CZ: czechiaMap,
  ES: spainMap,
  FR: franceMap,
  GB: unitedKingdomMap,
  HU: hungaryMap,
  IT: italyMap,
  JP: japanMap,
  KR: koreaMap,
  UK: unitedKingdomMap
};

type MapCountry = {
  code: string;
  name: string;
  asset: ImportedSvg;
};

export function TripRouteMap({
  cityName,
  className = "",
  compact = false,
  countryCode,
  countryName,
  date,
  destinations,
  label
}: TripRouteMapProps) {
  const normalizedCountryCode = countryCode.toUpperCase();
  const mapAsset = mapAssetRegistry[normalizedCountryCode];
  const visibleDestinations = destinations.filter(hasVisualPosition).slice(0, 8);
  const routePoints = visibleDestinations.map((destination) => destination.visualPosition);
  const routeCountries = useMemo(
    () => buildRouteCountries(visibleDestinations, normalizedCountryCode, countryName),
    [countryName, normalizedCountryCode, visibleDestinations]
  );
  const isMultiCountryRoute = routeCountries.length > 1;
  const countryPages = useMemo(() => chunkItems(routeCountries, 3), [routeCountries]);
  const [pageIndex, setPageIndex] = useState(0);
  const currentPageIndex = Math.min(pageIndex, Math.max(0, countryPages.length - 1));
  const activeCountries = countryPages[currentPageIndex] ?? routeCountries;
  const multiRoutePoints = isMultiCountryRoute
    ? buildMultiRoutePoints(visibleDestinations, activeCountries)
    : [];
  const multiRoutePath = multiRoutePoints.length > 1 ? buildRoutePath(multiRoutePoints) : "";
  const title = label ?? `${countryName} route map`;
  const activeCityName = cityName || visibleDestinations[0]?.name || "";
  const routePath = routePoints.length > 1 ? buildRoutePath(routePoints) : "";
  const classes = [
    "trip-route-map",
    compact ? "trip-route-map--compact" : "",
    className
  ].filter(Boolean).join(" ");

  if (!mapAsset || routePoints.length === 0) {
    return (
      <div
        className={classes}
        aria-label={title}
      >
        <div className="trip-route-map__fallback">
          <p>{title}</p>
          <strong>Route map coming soon</strong>
        </div>
      </div>
    );
  }

  if (isMultiCountryRoute) {
    return (
      <div
        className={`${classes} trip-route-map--multi`}
        aria-label={title}
      >
        <div className="trip-route-map__canvas" role="img" aria-label={title}>
          <div
            className="trip-route-map__multi-stage"
            style={{ gridTemplateColumns: `repeat(${Math.max(1, activeCountries.length)}, minmax(0, 1fr))` }}
          >
            {activeCountries.map((country) => (
              <div key={country.code} className="trip-route-map__country-panel">
                <img
                  alt=""
                  aria-hidden="true"
                  className="trip-route-map__multi-asset"
                  src={assetSource(country.asset)}
                />
                <span>{formatCountryPanelLabel(country.name)}</span>
              </div>
            ))}
          </div>
          <svg
            className="trip-route-map__route-layer"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            aria-hidden="true"
            focusable="false"
          >
            {multiRoutePath ? <path className="trip-route-map__route" d={multiRoutePath} /> : null}
          </svg>
          <div className="trip-route-map__dot-layer" aria-hidden="true">
            {multiRoutePoints.map((point, index) => (
              <span
                key={`${point.name}-${index}`}
                className="trip-route-map__dot"
                style={{ left: `${point.x}%`, top: `${point.y}%` }}
                title={point.name}
              />
            ))}
          </div>
          <TripPostmark
            cityName={activeCityName}
            compact={compact}
            countryCode={activeCountries[0]?.code ?? normalizedCountryCode}
            countryName={activeCountries[0]?.name ?? countryName}
            date={date}
          />
        </div>
        {countryPages.length > 1 ? (
          <div className="trip-route-map__pager" aria-label="Route map pages">
            <button type="button" onClick={() => setPageIndex((current) => Math.max(0, current - 1))} disabled={currentPageIndex === 0}>
              Prev
            </button>
            <span>{currentPageIndex + 1} / {countryPages.length}</span>
            <button type="button" onClick={() => setPageIndex((current) => Math.min(countryPages.length - 1, current + 1))} disabled={currentPageIndex >= countryPages.length - 1}>
              Next
            </button>
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div
      className={classes}
      aria-label={title}
    >
      <div className="trip-route-map__canvas" role="img" aria-label={title}>
        <div className="trip-route-map__stage">
          <img
            alt=""
            aria-hidden="true"
            className="trip-route-map__asset-image"
            src={assetSource(mapAsset)}
          />
          <svg
            className="trip-route-map__route-layer"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            aria-hidden="true"
            focusable="false"
          >
            {routePath ? <path className="trip-route-map__route" d={routePath} /> : null}
          </svg>
          <div className="trip-route-map__dot-layer" aria-hidden="true">
            {routePoints.map((point, index) => (
              <span
                key={`${visibleDestinations[index].name}-${index}`}
                className="trip-route-map__dot"
                style={{ left: `${point.x}%`, top: `${point.y}%` }}
                title={visibleDestinations[index].name}
              />
            ))}
          </div>
        </div>
        <TripPostmark
          cityName={activeCityName}
          compact={compact}
          countryCode={normalizedCountryCode}
          countryName={countryName}
          date={date}
        />
      </div>
    </div>
  );
}

function buildRouteCountries(
  destinations: Array<TripRouteDestination & { visualPosition: MapPoint }>,
  fallbackCountryCode: string,
  fallbackCountryName: string
) {
  const seen = new Set<string>();
  const countries: MapCountry[] = [];

  destinations.forEach((destination) => {
    const code = (destination.countryCode ?? fallbackCountryCode).toUpperCase();
    const asset = mapAssetRegistry[code];
    if (!asset || seen.has(code)) {
      return;
    }

    seen.add(code);
    countries.push({
      code,
      name: destination.countryName ?? fallbackCountryName,
      asset
    });
  });

  if (countries.length === 0 && mapAssetRegistry[fallbackCountryCode]) {
    countries.push({
      code: fallbackCountryCode,
      name: fallbackCountryName,
      asset: mapAssetRegistry[fallbackCountryCode]
    });
  }

  return countries;
}

function buildMultiRoutePoints(
  destinations: Array<TripRouteDestination & { visualPosition: MapPoint }>,
  countries: MapCountry[]
) {
  const countryIndexByCode = new Map(countries.map((country, index) => [country.code, index]));
  const panelWidth = 100 / Math.max(1, countries.length);
  const panelContent = {
    left: 3,
    top: 5,
    width: 94,
    height: 88
  };

  return destinations
    .map((destination) => {
      const countryCode = destination.countryCode?.toUpperCase();
      const countryIndex = countryCode ? countryIndexByCode.get(countryCode) : undefined;
      if (countryIndex === undefined) {
        return null;
      }

      return {
        x:
          countryIndex * panelWidth +
          ((panelContent.left + (destination.visualPosition.x * panelContent.width) / 100) *
            panelWidth) /
            100,
        y: panelContent.top + (destination.visualPosition.y * panelContent.height) / 100,
        name: destination.name
      };
    })
    .filter((point): point is MapPoint & { name: string } => Boolean(point));
}

function chunkItems<T>(items: T[], size: number) {
  const chunks: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }
  return chunks;
}

function formatCountryPanelLabel(countryName: string) {
  if (countryName === "United Kingdom") {
    return "UK";
  }

  if (countryName === "South Korea") {
    return "Korea";
  }

  return countryName.split(/\s+/)[0] ?? countryName;
}

function hasVisualPosition(
  destination: TripRouteDestination
): destination is TripRouteDestination & { visualPosition: MapPoint } {
  return (
    Number.isFinite(destination.visualPosition?.x) &&
    Number.isFinite(destination.visualPosition?.y)
  );
}

function assetSource(asset: ImportedSvg) {
  return typeof asset === "string" ? asset : asset.src;
}

function buildRoutePath(points: MapPoint[]) {
  const [firstPoint, ...remainingPoints] = points;
  let path = `M ${firstPoint.x.toFixed(1)} ${firstPoint.y.toFixed(1)}`;

  remainingPoints.forEach((point, index) => {
    const previous = points[index];
    const midX = (previous.x + point.x) / 2;
    const midY = (previous.y + point.y) / 2;
    const dx = point.x - previous.x;
    const dy = point.y - previous.y;
    const length = Math.hypot(dx, dy) || 1;
    const curve = Math.min(10, Math.max(5, length * 0.16)) * (index % 2 === 0 ? -1 : 1);
    const controlX = midX + (-dy / length) * curve;
    const controlY = midY + (dx / length) * curve;
    path += ` Q ${controlX.toFixed(1)} ${controlY.toFixed(1)} ${point.x.toFixed(1)} ${point.y.toFixed(1)}`;
  });

  return path;
}
