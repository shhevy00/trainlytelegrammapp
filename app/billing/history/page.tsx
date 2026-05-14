import { desc, eq } from "drizzle-orm";
import Link from "next/link";
import type { ReactElement } from "react";
import { PageHeader } from "@/components/prod-shell/PageHeader";
import { ShellMain } from "@/components/prod-shell/ShellMain";
import { trainlyOrders } from "@/db/schema";
import { getTrainerSession } from "@/lib/auth/session";
import { isTrainlyMockDataSource } from "@/lib/config/dataSource";
import { getDb } from "@/lib/db/server";

export default async function BillingHistoryPage(): Promise<ReactElement> {
  const session = await getTrainerSession();
  let rows: {
    id: string;
    planCode: string;
    amountRub: number;
    status: string;
    createdAt: Date;
  }[] = [];

  if (!isTrainlyMockDataSource() && session != null) {
    const db = getDb();
    rows = await db
      .select({
        id: trainlyOrders.id,
        planCode: trainlyOrders.planCode,
        amountRub: trainlyOrders.amountRub,
        status: trainlyOrders.status,
        createdAt: trainlyOrders.createdAt,
      })
      .from(trainlyOrders)
      .where(eq(trainlyOrders.trainerId, session.trainerId))
      .orderBy(desc(trainlyOrders.createdAt))
      .limit(50);
  }

  return (
    <ShellMain>
      <PageHeader title="История оплат" backHref="/billing/manage" backLabel="Подписка" />

      {rows.length === 0 ? (
        <div className="premium-surface min-w-0 p-6 text-center text-sm text-[var(--text-secondary)]">
          Платежей за подписку пока нет.
        </div>
      ) : (
        <ul className="premium-surface min-w-0 divide-y divide-[color:var(--border-soft)] p-0">
          {rows.map((r) => (
            <li key={r.id} className="flex flex-col gap-1 px-4 py-3 text-sm">
              <div className="flex justify-between gap-2 font-medium text-[var(--text-primary)]">
                <span>{r.planCode}</span>
                <span>{r.amountRub} ₽</span>
              </div>
              <div className="text-xs text-[var(--text-secondary)]">
                {r.status} · {r.createdAt.toLocaleString("ru-RU")}
              </div>
            </li>
          ))}
        </ul>
      )}

      <Link
        href="/billing/plans"
        prefetch={false}
        className="app-btn inline-flex min-h-[44px] w-full items-center justify-center rounded-2xl bg-[var(--tg-accent)] px-4 py-3.5 text-center text-[15px] font-semibold text-white shadow-app-primary"
      >
        Выбрать тариф
      </Link>
    </ShellMain>
  );
}
