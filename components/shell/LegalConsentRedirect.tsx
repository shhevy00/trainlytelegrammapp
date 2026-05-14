"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactElement } from "react";

const PUBLIC_PREFIXES = [
  "/welcome",
  "/auth",
  "/legal",
  "/legal-consent",
  "/privacy",
  "/support",
  "/billing/plans",
  "/billing/checkout",
  "/billing/success",
  "/billing/fail",
  "/billing/history",
  "/billing/manage",
  "/profile/setup",
];

function isPublicPath(pathname: string): boolean {
  for (const p of PUBLIC_PREFIXES) {
    if (pathname === p || pathname.startsWith(`${p}/`)) return true;
  }
  return false;
}

/**
 * В live-режиме PostgreSQL: если обязательные юридические документы не приняты, уводим на экран согласия.
 */
export function LegalConsentRedirect({ legalAccepted }: { legalAccepted: boolean }): ReactElement | null {
  const pathname = usePathname() ?? "/";
  const router = useRouter();

  useEffect(() => {
    if (legalAccepted) return;
    if (isPublicPath(pathname)) return;
    if (pathname.startsWith("/api/")) return;
    router.replace("/legal-consent");
  }, [legalAccepted, pathname, router]);

  return null;
}
