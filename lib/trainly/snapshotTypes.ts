import type { JournalEntry } from "@/lib/types";
import type { MockClient, MockScheduleItem } from "@/lib/mock/data";
import type { CoachPaymentRecord, CoachQuickNote } from "@/lib/mock/coachLedger";
import type { WorkoutTemplate } from "@/lib/workout/templates";
import type { MockLifecyclePersisted } from "@/lib/mock/lifecycleTypes";

export type TrainlyProductAccessStatus = "demo_unlimited" | "trial" | "active" | "expired" | "cancelled";

/** Снимок домена для клиентского провайдера (совместим с MockAppProvider). */
export interface ActiveWorkoutDraftPreview {
  workoutId: string;
  clientId: string;
  clientName: string;
  title: string;
  startedAtMs: number;
}

export interface TrainlySnapshot {
  /** Меняется при каждой загрузке снимка на сервере — для `key` у LiveTrainlyProvider без setState в effect. */
  serverSnapshotRevision: number;
  todayIso: string;
  clients: MockClient[];
  journalEntries: JournalEntry[];
  /** true, если в БД есть записи журнала старше лимита загрузки (200). */
  journalHasMore: boolean;
  /** Активные черновики тренировок (draft / in_progress) для обзора и resume. */
  activeWorkoutDrafts: ActiveWorkoutDraftPreview[];
  scheduleItems: MockScheduleItem[];
  coachPaymentRecords: CoachPaymentRecord[];
  coachQuickNotes: CoachQuickNote[];
  workoutTemplates: WorkoutTemplate[];
  mockLifecycle: MockLifecyclePersisted;
  accessStatus: TrainlyProductAccessStatus;
}
