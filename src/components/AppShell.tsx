"use client";

import type { ReactNode } from "react";
import { Layout } from "@/components/Layout";
import { TripAccessGate, TripAccessProvider } from "@/lib/access";
import { LanguageProvider } from "@/lib/i18n";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <LanguageProvider>
      <TripAccessProvider>
        <TripAccessGate>
          <Layout>{children}</Layout>
        </TripAccessGate>
      </TripAccessProvider>
    </LanguageProvider>
  );
}
