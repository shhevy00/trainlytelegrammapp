/** Mock: оплаты занятий и быстрые заметки тренера (не YooKassa / не доступ Trainly). */

export type CoachQuickNoteType = "general" | "limitation" | "payment" | "progress" | "complaint";

export interface CoachQuickNote {
  id: string;
  clientId: string;
  clientName: string;
  type: CoachQuickNoteType;
  text: string;
  createdAtMs: number;
}

export interface CoachPaymentRecord {
  id: string;
  clientId: string;
  clientName: string;
  sessionsAdded: number;
  amountRub: number | null;
  comment: string | null;
  createdAtMs: number;
}
