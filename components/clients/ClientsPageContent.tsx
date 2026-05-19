"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, type ReactElement } from "react";
import { ClientsFilterBar } from "@/components/clients/ClientsFilterBar";
import { ClientListCard } from "@/components/clients/ClientListCard";
import {
  clientFilterQueryValue,
  clientMatchesTodayFilter,
  filterClients,
  type ClientListFilter,
} from "@/lib/clients/clientAttention";
import { buildClientCardMeta, clientsCountLabel } from "@/lib/clients/clientListUi";
import { useMockApp } from "@/lib/mock/MockAppProvider";

function emptyCopy(filter: ClientListFilter): { title: string; hint: string } {
  switch (filter) {
    case "today":
      return {
        title: "На сегодня никого нет",
        hint: "Запланируйте тренировку в графике или начните без записи.",
      };
    default:
      return { title: "Список пуст", hint: "" };
  }
}

export interface ClientsPageContentProps {
  initialFilter?: ClientListFilter;
}

export function ClientsPageContent({ initialFilter = "all" }: ClientsPageContentProps): ReactElement {
  const router = useRouter();
  const { todayIso, clients, scheduleItems, coachQuickNotes } = useMockApp();
  const filter = initialFilter;

  const applyFilter = (next: ClientListFilter): void => {
    const q = clientFilterQueryValue(next);
    router.replace(q == null ? "/clients" : `/clients?filter=${encodeURIComponent(q)}`, { scroll: false });
  };

  const filterCounts = useMemo(
    () => ({
      all: clients.length,
      today: clients.filter((c) => clientMatchesTodayFilter(c, scheduleItems, todayIso)).length,
    }),
    [clients, scheduleItems, todayIso],
  );

  const filtered = useMemo(
    () =>
      filterClients(clients, filter, {
        todayIso,
        scheduleItems,
        quickNotes: coachQuickNotes,
      }),
    [clients, filter, scheduleItems, coachQuickNotes, todayIso],
  );

  const cardMetas = useMemo(() => {
    const m = new Map<string, ReturnType<typeof buildClientCardMeta>>();
    for (const c of filtered) {
      m.set(c.id, buildClientCardMeta(c, scheduleItems, todayIso, coachQuickNotes));
    }
    return m;
  }, [filtered, scheduleItems, todayIso, coachQuickNotes]);

  return (
    <main className="clients-page flex w-full flex-col gap-3 px-4 py-5 pb-[calc(6rem+max(0.35rem,env(safe-area-inset-bottom,0px)))]">
      <header className="clients-header">
        <div className="clients-header__copy">
          <h1 className="clients-header__title">Клиенты</h1>
          <p className="clients-header__hint">{clientsCountLabel(clients.length)}</p>
        </div>
        <Link href="/clients/new" prefetch={false} className="app-btn clients-header__add">
          + Новый
        </Link>
      </header>

      {clients.length === 0 ? (
        <div className="clients-empty">
          <p className="clients-empty__title">Пока нет клиентов</p>
          <p className="clients-empty__text">Добавьте первого — заведите шаблон и сохраните тренировку в журнале.</p>
          <Link href="/clients/new" prefetch={false} className="app-btn clients-empty__btn">
            Добавить клиента
          </Link>
        </div>
      ) : (
        <>
          <ClientsFilterBar filter={filter} counts={filterCounts} onFilterChange={applyFilter} />

          <p className="clients-list-meta">
            {filter === "today" ? `${filtered.length} на сегодня` : clientsCountLabel(filtered.length)}
          </p>

          {filtered.length === 0 ? (
            <div className="clients-empty clients-empty--inline">
              {(() => {
                const { title, hint } = emptyCopy(filter);
                return (
                  <>
                    <p className="clients-empty__title">{title}</p>
                    {hint ? <p className="clients-empty__text">{hint}</p> : null}
                    {filter !== "all" ? (
                      <button type="button" className="app-btn clients-empty__ghost" onClick={() => applyFilter("all")}>
                        Показать всех
                      </button>
                    ) : null}
                  </>
                );
              })()}
            </div>
          ) : (
            <ul className="clients-list">
              {filtered.map((c) => {
                const meta = cardMetas.get(c.id);
                if (!meta) return null;
                return (
                  <li key={c.id}>
                    <ClientListCard client={c} meta={meta} />
                  </li>
                );
              })}
            </ul>
          )}
        </>
      )}
    </main>
  );
}
