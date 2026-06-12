"use client";

import type { ReactNode } from "react";
import { Layout } from "@/components/Layout";
import { LanguageProvider } from "@/lib/i18n";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <LanguageProvider>
      <Layout>{children}</Layout>
    </LanguageProvider>
  );
}
