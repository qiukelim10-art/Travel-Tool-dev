"use client";

import { BookingsClient } from "@/components/BookingsClient";
import { SectionHeader } from "@/components/SectionHeader";
import { tripInfo } from "@/data/tripData";
import { useLanguage } from "@/lib/i18n";

export default function BookingsPage() {
  const { t } = useLanguage();

  return (
    <div>
      <SectionHeader
        eyebrow={t("page.bookings.eyebrow")}
        title={t("page.bookings.title")}
        description={t("page.bookings.description")}
      />
      <BookingsClient participants={tripInfo.participants} />
    </div>
  );
}
