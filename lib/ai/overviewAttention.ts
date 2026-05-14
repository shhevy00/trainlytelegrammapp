import type { AiGenerationKind } from "@/lib/ai/types";
import { buildInactiveClientFacts, buildPaymentReminderFacts } from "@/lib/ai/ruleFacts";
import type { OverviewAttentionItem } from "@/lib/overview/dailyOperations";
import type { MockClient } from "@/lib/mock/data";

export interface OverviewAttentionAiConfig {
  facts: string[];
  generateKind: AiGenerationKind;
  generateLabel: string;
}

/** Контекстный ИИ только для строк «Важное», где уместны оплата или возврат. */
export function resolveOverviewAttentionAi(
  item: OverviewAttentionItem,
  clients: MockClient[],
): OverviewAttentionAiConfig | null {
  if (!item.clientId) return null;
  const client = clients.find((c) => c.id === item.clientId);
  if (!client) return null;

  if (item.id.endsWith("-inactive")) {
    return {
      facts: buildInactiveClientFacts(client),
      generateKind: "inactive_client_outreach",
      generateLabel: "Сгенерировать сообщение",
    };
  }

  if (
    item.id.endsWith("-debt") ||
    item.id.endsWith("-zero") ||
    item.id.endsWith("-one-left") ||
    item.id.endsWith("-coach-payment-note")
  ) {
    return {
      facts: buildPaymentReminderFacts(client),
      generateKind: "payment_reminder",
      generateLabel: "Сгенерировать напоминание об оплате",
    };
  }

  return null;
}
