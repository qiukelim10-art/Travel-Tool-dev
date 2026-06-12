"use client";

import { AttractionsClient } from "@/components/AttractionsClient";
import { GoogleMapsSearchPanel } from "@/components/GoogleMapsSearchPanel";
import { SectionHeader } from "@/components/SectionHeader";
import { attractions } from "@/data/tripData";
import { useLanguage } from "@/lib/i18n";

export default function AttractionsPage() {
  const { t } = useLanguage();

  return (
    <div>
      <SectionHeader
        eyebrow={t("page.attractions.eyebrow")}
        title={t("page.attractions.title")}
        description={t("page.attractions.description")}
      />
      <div className="mb-6">
        <GoogleMapsSearchPanel
          title="What can we visit nearby?"
          description="Open live Google Maps results for nearby sights. Google Maps will show ratings, reviews, opening hours, photos, and practical details."
          defaultQuery="attractions"
          quickSearches={[
            "attractions",
            "museums",
            "viewpoints",
            "churches",
            "free attractions",
            "things to do"
          ]}
        />
      </div>
      <AttractionsClient attractions={attractions} />
    </div>
  );
}
