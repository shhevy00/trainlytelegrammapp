import { MOCK_TODAY_ISO, mockClients } from "@/lib/mock/data";
import type { CoachPaymentRecord } from "@/lib/mock/coachLedger";

function clientName(clientId: string): string {
  return mockClients.find((c) => c.id === clientId)?.name ?? "Клиент";
}

function atToday(h: number, m: number): number {
  const hh = String(h).padStart(2, "0");
  const mm = String(m).padStart(2, "0");
  return new Date(`${MOCK_TODAY_ISO}T${hh}:${mm}:00`).getTime();
}

/** Демо: оплаты за MOCK_TODAY_ISO (mock, не персистится как прод). */
export function buildSeedCoachPaymentRecordsToday(): CoachPaymentRecord[] {
  return [
    {
      id: "seed-pay-overview-1",
      clientId: "c4",
      clientName: clientName("c4"),
      sessionsAdded: 0,
      amountRub: 4200,
      comment: null,
      createdAtMs: atToday(8, 10),
    },
    {
      id: "seed-pay-overview-2",
      clientId: "c2",
      clientName: clientName("c2"),
      sessionsAdded: 0,
      amountRub: 5500,
      comment: null,
      createdAtMs: atToday(14, 25),
    },
  ];
}
