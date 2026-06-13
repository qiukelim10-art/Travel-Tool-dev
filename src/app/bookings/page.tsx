"use client";

import { BookingsClient } from "@/components/BookingsClient";
import { SectionHeader } from "@/components/SectionHeader";
import { useLanguage } from "@/lib/i18n";
import { useTripSettingsView } from "@/lib/useTripSettings";

export default function BookingsPage() {
  const { t } = useLanguage();
  const { trip } = useTripSettingsView();

  return (
    <div>
      <SectionHeader
        eyebrow={t("page.bookings.eyebrow")}
        title={t("page.bookings.title")}
        description={t("page.bookings.description")}
      />
      <BookingsClient participants={trip.travelerDisplayNames} />
    </div>
  );
}
