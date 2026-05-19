"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactElement } from "react";
import { isTrainlyLegalConsentPublicPath } from "@/lib/config/trainlyRouteAccess";

/**
 * В live-режиме PostgreSQL: если обязательные юридические документы не приняты, уводим на экран согласия.
 */
export function LegalConsentRedirect({ legalAccepted }: { legalAccepted: boolean }): ReactElement | null {
  const pathname = usePathname() ?? "/";
  const router = useRouter();

  useEffect(() => {
    if (legalAccepted) return;
    if (isTrainlyLegalConsentPublicPath(pathname)) return;
    if (pathname.startsWith("/api/")) return;
    router.replace("/legal-consent");
  }, [legalAccepted, pathname, router]);

  return null;
}
