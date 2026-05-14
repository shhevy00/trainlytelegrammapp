import type { MockClient } from "@/lib/mock/data";

/** Клиенты с отрицательным балансом занятий (долг по пакету / «в долг»), mock. */
export function countClientsWithSessionDebt(clients: readonly MockClient[]): number {
  return clients.filter((c) => c.remainingSessions < 0).length;
}
