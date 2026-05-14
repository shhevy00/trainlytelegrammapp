export interface ExerciseHistoryDemo {
  previousSummary: string;
  bestSummary: string | null;
  lastThree: { date: string; text: string }[];
  lastComment: string | null;
  /** Explicit pairs for “Insert previous values”; never auto-applied. */
  insertTemplate: { weight: string; reps: string }[];
}

/** Static reference lines on exercise cards (mock client history). */
export const demoExerciseCardHints: Record<string, { previous: string; best: string | null }> = {
  "ex-leg-press": { previous: "110×10 · 110×8", best: "120×8" },
  "ex-leg-curl": { previous: "45×12 · 45×10", best: null },
};

export const demoExerciseHistory: Record<string, ExerciseHistoryDemo> = {
  "ex-leg-press": {
    previousSummary: "110×10, затем 110×8",
    bestSummary: "120×8",
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
    previousSummary: "45×12 · 45×10",
    bestSummary: "45×12",
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
