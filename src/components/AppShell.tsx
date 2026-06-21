"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { Layout } from "@/components/Layout";
import { TripAccessGate, TripAccessProvider } from "@/lib/access";
import { LanguageProvider } from "@/lib/i18n";

const publicRoutes = new Set(["/pilot"]);

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isPublicRoute = publicRoutes.has(pathname);

  return (
    <LanguageProvider>
      {isPublicRoute ? (
        children
      ) : (
        <TripAccessProvider>
          <TripAccessGate>
            <Layout>{children}</Layout>
          </TripAccessGate>
        </TripAccessProvider>
      )}
    </LanguageProvider>
  );
}
