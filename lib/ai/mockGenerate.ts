import type { AiGenerationKind, AiMockGenerateResult, AiRewriteTone } from "@/lib/ai/types";

function clampFacts(facts: readonly string[], max = 8): string[] {
  return facts.slice(0, max);
}

/** Детерминированный черновик только из переданных фактов (RU). */
export function mockAiGenerate(kind: AiGenerationKind, facts: readonly string[]): AiMockGenerateResult {
  const used = clampFacts(facts);
  const joined = used.slice(0, 5).join(" ");

  let text: string;
  switch (kind) {
    case "pulse_summary":
      text = `Краткая сводка: ${joined} Сфокусируйтесь на следующем шаге и оплате занятий, если это видно из фактов.`;
      break;
    case "pre_workout_hint":
      text = `Перед стартом: держите в голове ключевые пункты из фактов. ${used[0] ?? ""} ${used[1] ?? ""} Не усугубляйте ограничения и фиксируйте ощущения клиента в конце.`.trim();
      break;
    case "post_workout_summary":
      text = `Итог тренировки: опирайтесь только на журнал. ${joined} Отметьте, что прошло по плану и что перенести на следующий раз — без обещаний результата.`;
      break;
    case "telegram_session_followup":
      text = `Черновик в Telegram (коротко): спасибо за сессию. По данным тренировки: ${used.slice(0, 3).join(" ")} Напишите, если что-то беспокоит — скорректируем план.`;
      break;
    case "payment_reminder":
      text = `Напоминание об оплате (деликатно): ${joined} Предложите удобный формат пополнения пакета занятий без давления.`;
      break;
    case "inactive_client_outreach":
      text = `Черновик сообщения неактивному клиенту: ${joined} Мягко предложите вернуться к расписанию и спросите, не мешает ли что-то снаружи тренировок.`;
      break;
    case "rewrite_message":
      text = joined.length > 0 ? `Вариант текста: ${joined}` : "Нет текста для перефразирования.";
      break;
    default: {
      const _exhaustive: never = kind;
      text = String(_exhaustive);
    }
  }

  return { text: text.replace(/\s+/g, " ").trim(), factsUsed: [...used] };
}

export function mockAiRewrite(currentText: string, tone: AiRewriteTone): string {
  const t = currentText.trim();
  if (!t) return "";
  if (tone === "shorter") {
    const half = t.slice(0, Math.max(40, Math.floor(t.length * 0.55)));
    const cut = half.lastIndexOf(" ");
    return `${cut > 20 ? half.slice(0, cut) : half}… (короче)`;
  }
  return `${t} Если нужно, можем сместить акценты на следующей сессии — без спешки. (мягче)`;
}
