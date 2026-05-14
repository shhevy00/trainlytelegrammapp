/** Виды локальных подсказок (без вызова внешнего API). */

export type AiGenerationKind =
  | "pulse_summary"
  | "pre_workout_hint"
  | "post_workout_summary"
  | "telegram_session_followup"
  | "payment_reminder"
  | "inactive_client_outreach"
  | "rewrite_message";

/** Режим перефразирования после генерации (списывает одну AI-подготовку в демо). */
export type AiRewriteTone = "shorter" | "softer";

export interface AiMockGenerateResult {
  text: string;
  /** Факты, на которых основан текст (для блока «Использованные факты»). */
  factsUsed: string[];
}
