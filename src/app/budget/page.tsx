"use client";

import { useMemo } from "react";
import { BudgetClient } from "@/components/BudgetClient";
import { getDestinationVisualIdentity } from "@/lib/destinationVisuals";
import { useTripSettingsView } from "@/lib/useTripSettings";

export default function BudgetPage() {
  const { trip } = useTripSettingsView();
  const destinationVisual = useMemo(
    () =>
      getDestinationVisualIdentity({
        destination: trip.destination,
        routeCities: trip.routeCities,
        routeLabel: trip.routeLabel,
        routeStops: trip.routeStops,
        tripName: trip.name
      }),
    [trip.destination, trip.name, trip.routeCities, trip.routeLabel, trip.routeStops]
  );

  return (
    <div className="budget-shell today-shell">
      <BudgetClient
        destinationVisual={destinationVisual}
        defaultCurrencies={trip.defaultCurrencies}
        tripDateRangeLabel={trip.dateRangeLabel}
        tripRouteLabel={trip.routeLabel}
        tripTravelerCount={trip.travelerCount}
      />
    </div>
  );
}
