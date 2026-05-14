/**
 * Единая логика «публичный vs защищённый» маршрут приложения для edge proxy и RSC-оболочки.
 *
 * Сверка с app routes: публичные корни — welcome, auth, legal, privacy, support, legal-consent;
 * billing/plans и billing/fail; profile/setup. Защищённые области — overview, clients, schedule,
 * journal, workout, workouts, add-payment, quick-note, start-workout, profile (кроме setup),
 * account, billing (кроме plans и fail). Корень "/" всегда защищён. Неизвестные пути не защищены
 * (Next отдаст 404).
 */
export const TRAINLY_PATHNAME_HEADER = "x-trainly-pathname";

export function isTrainlyProtectedAppRoute(pathname: string): boolean {
  if (pathname.startsWith("/api/")) return false;
  if (pathname.startsWith("/_next")) return false;
  if (pathname === "/favicon.ico") return false;

  if (pathname === "/") return true;

  const alwaysPublic = [
    "/welcome",
    "/auth",
    "/legal",
    "/privacy",
    "/support",
    "/legal-consent",
    "/billing/plans",
    "/billing/fail",
  ];
  for (const p of alwaysPublic) {
    if (pathname === p || pathname.startsWith(`${p}/`)) return false;
  }
  if (pathname.startsWith("/profile/setup")) return false;

  const appAreas = [
    "/overview",
    "/clients",
    "/schedule",
    "/journal",
    "/workout",
    "/workouts",
    "/add-payment",
    "/quick-note",
    "/start-workout",
    "/profile",
    "/account",
    "/billing",
  ];
  return appAreas.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}
