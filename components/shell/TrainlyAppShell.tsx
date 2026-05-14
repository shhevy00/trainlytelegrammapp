import type { ReactElement, ReactNode } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/shell/AppShell";
import { isTrainlyMockDataSource } from "@/lib/config/dataSource";
import { isTrainlyProtectedAppRoute, TRAINLY_PATHNAME_HEADER } from "@/lib/config/trainlyRouteAccess";
import { getTrainerSession } from "@/lib/auth/session";
import { getDb } from "@/lib/db/server";
import { loadTrainlySnapshot } from "@/lib/server/trainlySnapshot";
import { LiveTrainlyProvider } from "@/lib/live/LiveTrainlyProvider";
import { MockAppProvider } from "@/lib/mock/MockAppProvider";

/**
 * Оболочка данных: мок в памяти или снимок PostgreSQL после JWT-сессии.
 * В production на защищённых путях без сессии mock не используется (дубль к middleware + redirect).
 * На публичных путях без сессии остаётся MockAppProvider (welcome/auth используют useMockApp).
 */
export async function TrainlyAppShell({ children }: { children: ReactNode }): Promise<ReactElement> {
  if (isTrainlyMockDataSource()) {
    return (
      <MockAppProvider>
        <AppShell>{children}</AppShell>
      </MockAppProvider>
    );
  }

  const session = await getTrainerSession();
  if (session == null) {
    if (process.env.NODE_ENV === "production") {
      const pathname = (await headers()).get(TRAINLY_PATHNAME_HEADER) ?? "";
      if (pathname.length > 0 && isTrainlyProtectedAppRoute(pathname)) {
        redirect("/welcome");
      }
    }
    return (
      <MockAppProvider>
        <AppShell>{children}</AppShell>
      </MockAppProvider>
    );
  }

  const db = getDb();
  const initial = await loadTrainlySnapshot(db, session.trainerId);

  return (
    <LiveTrainlyProvider key={initial.serverSnapshotRevision} initial={initial}>
      <AppShell>{children}</AppShell>
    </LiveTrainlyProvider>
  );
}
