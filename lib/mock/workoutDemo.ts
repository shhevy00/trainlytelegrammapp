export interface ExerciseHistoryDemo {
  previousSummary: string;
  bestSummary: string | null;
  lastThree: { date: string; text: string }[];
  lastComment: string | null;
  /** Explicit pairs for “Insert previous values”; never auto-applied. */
  insertTemplate: { weight: string; reps: string }[];
  /** Последняя запись журнала с этим упражнением (для ссылки «Открыть в журнале»). */
  lastJournalEntryId?: string;
}

export const demoExerciseHistory: Record<string, ExerciseHistoryDemo> = {
  "ex-leg-press": {
    previousSummary: "110 кг × 10 повт · 110 кг × 8 повт",
    bestSummary: "120 кг × 8 повт",
    lastThree: [
      { date: "11 мая", text: "110×10 / 110×8" },
      { date: "6 мая", text: "107.5×10 / 107.5×8" },
      { date: "1 мая", text: "105×12 / 100×10" },
    ],
    lastComment: "Колено ок, выпады не форсируем.",
    insertTemplate: [
      { weight: "110", reps: "10" },
      { weight: "110", reps: "8" },
    ],
  },
  "ex-leg-curl": {
    previousSummary: "45 кг × 12 повт · 45 кг × 10 повт",
    bestSummary: "45 кг × 12 повт",
    lastThree: [
      { date: "11 мая", text: "45×12 / 45×10" },
      { date: "4 мая", text: "42.5×12" },
      { date: "27 апр.", text: "40×15" },
    ],
    lastComment: null,
    insertTemplate: [
      { weight: "45", reps: "12" },
      { weight: "45", reps: "10" },
    ],
  },
};
