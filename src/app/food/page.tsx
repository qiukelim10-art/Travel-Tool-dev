"use client";

import { FoodClient } from "@/components/FoodClient";
import { GoogleMapsSearchPanel } from "@/components/GoogleMapsSearchPanel";
import { SectionHeader } from "@/components/SectionHeader";
import { restaurants } from "@/data/tripData";
import { useLanguage } from "@/lib/i18n";

export default function FoodPage() {
  const { t } = useLanguage();

  return (
    <div>
      <SectionHeader
        eyebrow={t("page.food.eyebrow")}
        title={t("page.food.title")}
        description={t("page.food.description")}
      />
      <div className="mb-6">
        <GoogleMapsSearchPanel
          title="What should we eat nearby?"
          description="Use this during the trip when you are already in a city and want Google Maps to show nearby food options with ratings, reviews, opening hours, and reservation clues."
          defaultQuery="restaurants"
          quickSearches={[
            "restaurants",
            "pasta",
            "gelato",
            "coffee",
            "cheap eats",
            "dinner",
            "reservation restaurants"
          ]}
        />
      </div>
      <FoodClient restaurants={restaurants} />
    </div>
  );
}
