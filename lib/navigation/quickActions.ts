export type QuickActionId =
  | "new-client"
  | "start-with-client"
  | "start-quick"
  | "add-payment"
  | "quick-note";

export interface QuickActionDef {
  id: QuickActionId;
  href: string;
  label: string;
}

export const QUICK_ACTIONS: Record<QuickActionId, QuickActionDef> = {
  "new-client": { id: "new-client", href: "/clients/new", label: "Новый клиент" },
  "start-with-client": {
    id: "start-with-client",
    href: "/start-workout?mode=client",
    label: "С клиентом",
  },
  "start-quick": { id: "start-quick", href: "/start-workout?mode=quick", label: "Быстрый старт" },
  "add-payment": { id: "add-payment", href: "/add-payment", label: "Оплата" },
  "quick-note": { id: "quick-note", href: "/quick-note", label: "Заметка" },
};

/** Наборы действий по экранам (бывший «+»). */
export const QUICK_ACTIONS_FOR_SCREEN = {
  clients: ["new-client", "start-with-client", "start-quick", "add-payment", "quick-note"] as const,
  schedule: ["start-quick", "add-payment", "quick-note", "new-client"] as const,
  journal: ["start-quick", "quick-note", "add-payment"] as const,
  overviewBusy: ["start-quick", "add-payment", "quick-note", "new-client"] as const,
} satisfies Record<string, readonly QuickActionId[]>;
