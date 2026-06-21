import type { Metadata } from "next";
import { PilotOfferClient } from "./PilotOfferClient";

export const metadata: Metadata = {
  title: "Group Trip Command Center Pilot",
  description: "A public manual pilot offer for a mobile-first group trip workspace."
};

export default function PilotPage() {
  return <PilotOfferClient />;
}
