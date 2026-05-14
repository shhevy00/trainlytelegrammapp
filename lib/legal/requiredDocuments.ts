/** Коды документов, обязательных для доступа к продукту (версия v1 в миграции `legal_documents`). */
export const TRAINLY_REQUIRED_LEGAL_DOC_CODES = ["trainly_terms", "trainly_privacy"] as const;

export const TRAINLY_REQUIRED_LEGAL_VERSION = 1;

export type TrainlyRequiredLegalDocCode = (typeof TRAINLY_REQUIRED_LEGAL_DOC_CODES)[number];

export interface TrainerLegalAcceptanceRow {
  documentCode: string;
  version: number;
}

/**
 * Тренер принял все обязательные документы актуальной версии (или остаётся legacy-флаг в `trainers.legal_accepted_at`).
 */
export function trainerHasRequiredLegalAcceptances(
  rows: readonly TrainerLegalAcceptanceRow[],
  legacyLegalAcceptedAt: Date | null,
): boolean {
  if (legacyLegalAcceptedAt != null) {
    return true;
  }
  const set = new Set(rows.map((r) => `${r.documentCode}:${r.version}`));
  return TRAINLY_REQUIRED_LEGAL_DOC_CODES.every((code) => set.has(`${code}:${TRAINLY_REQUIRED_LEGAL_VERSION}`));
}
