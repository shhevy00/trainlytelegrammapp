import type { JournalEntry } from "@/lib/types";
import type { MockClient, MockScheduleItem } from "@/lib/mock/data";
import type { CoachPaymentRecord, CoachQuickNote } from "@/lib/mock/coachLedger";
import type { WorkoutTemplate } from "@/lib/workout/templates";
import type { MockLifecyclePersisted } from "@/lib/mock/lifecycleTypes";

export type TrainlyProductAccessStatus = "demo_unlimited" | "trial" | "active" | "expired" | "cancelled";

/** Снимок домена для клиентского провайдера (совместим с MockAppProvider). */
export interface TrainlySnapshot {
  /** Меняется при каждой загрузке снимка на сервере — для `key` у LiveTrainlyProvider без setState в effect. */
  serverSnapshotRevision: number;
  todayIso: string;
  clients: MockClient[];
  journalEntries: JournalEntry[];
  scheduleItems: MockScheduleItem[];
  coachPaymentRecords: CoachPaymentRecord[];
  coachQuickNotes: CoachQuickNote[];
  workoutTemplates: WorkoutTemplate[];
  mockLifecycle: MockLifecyclePersisted;
  /** Баланс ИИ из строки тренера (для tryConsumeAiCredit в live). */
  aiCreditsTotal: number;
  accessStatus: TrainlyProductAccessStatus;
}
