"use client";

import { useCallback, useState, type ReactElement } from "react";
import { Card } from "@/components/ui/card";
import type { AiGenerationKind } from "@/lib/ai/types";
import { mockAiGenerate, mockAiRewrite } from "@/lib/ai/mockGenerate";
import { useMockApp } from "@/lib/mock/MockAppProvider";

const btnPrimary =
  "app-btn rounded-2xl bg-[var(--tg-accent)] px-4 py-2 text-center text-xs text-white shadow-app-primary disabled:opacity-40 sm:text-sm";
const btnPrimaryCompact =
  "app-btn w-full max-w-xs rounded-xl border border-[color:var(--border-strong)] bg-[var(--tg-bg)] px-3 py-2 text-center text-sm font-medium text-[var(--text-primary)] shadow-none disabled:opacity-40";
const btnGhost =
  "app-btn rounded-2xl border border-[color:var(--border-strong)] bg-[var(--tg-bg)] px-4 py-2 text-center text-xs text-[var(--text-primary)] disabled:opacity-40 sm:text-sm";
const btnGhostCompact =
  "app-btn rounded-xl border border-[color:var(--border-strong)] bg-[var(--tg-bg)] px-3 py-1.5 text-center text-xs text-[var(--text-primary)] disabled:opacity-40";

export interface ContextualAiHelperProps {
  heading: string;
  facts: readonly string[];
  generateKind: AiGenerationKind;
  generateLabel: string;
  /** После генерации — «Короче» и «Мягче». */
  showShorterSofter?: boolean;
  /** Компактный вид: факты первыми, без крупной кнопки на всю ширину. */
  variant?: "default" | "compact" | "preWorkout";
}

const btnOutlinePreWorkout =
  "app-btn w-full rounded-xl border border-[color:var(--border-strong)] bg-[var(--tg-bg)] px-4 py-2.5 text-center text-sm font-semibold text-[var(--text-primary)] disabled:opacity-40";

export function ContextualAiHelper({
  heading,
  facts,
  generateKind,
  generateLabel,
  showShorterSofter = true,
  variant = "default",
}: ContextualAiHelperProps): ReactElement {
  const { aiCreditsTotal, aiCreditsUsed, tryConsumeAiCredit } = useMockApp();
  const [generatedText, setGeneratedText] = useState<string | null>(null);
  const [factsUsed, setFactsUsed] = useState<string[]>([]);

  const exhausted = aiCreditsUsed >= aiCreditsTotal;

  const onGenerate = useCallback(async (): Promise<void> => {
    if (!(await Promise.resolve(tryConsumeAiCredit()))) return;
    const r = mockAiGenerate(generateKind, facts);
    setGeneratedText(r.text);
    setFactsUsed(r.factsUsed);
  }, [tryConsumeAiCredit, generateKind, facts]);

  const onShorter = useCallback(async (): Promise<void> => {
    if (!generatedText || !(await Promise.resolve(tryConsumeAiCredit()))) return;
    setGeneratedText(mockAiRewrite(generatedText, "shorter"));
  }, [generatedText, tryConsumeAiCredit]);

  const onSofter = useCallback(async (): Promise<void> => {
    if (!generatedText || !(await Promise.resolve(tryConsumeAiCredit()))) return;
    setGeneratedText(mockAiRewrite(generatedText, "softer"));
  }, [generatedText, tryConsumeAiCredit]);

  const onCopy = useCallback(async (): Promise<void> => {
    if (!generatedText) return;
    try {
      await navigator.clipboard.writeText(generatedText);
    } catch {
      /* clipboard unavailable */
    }
  }, [generatedText]);

  const exhaustedBlock = (
    <p className="text-xs leading-relaxed text-[var(--tg-muted)]">
      Лимит AI-подготовок в демо исчерпан. Остальной интерфейс работает как обычно.
    </p>
  );

  if (variant === "preWorkout") {
    return (
      <div className="flex max-h-[min(78dvh,32rem)] flex-col rounded-t-2xl border border-[color:var(--border-soft)] border-b-0 bg-[var(--bg-card)] p-4 shadow-[0_-8px_40px_rgba(0,0,0,0.45)] sm:rounded-2xl sm:border-b">
        <p className="text-base font-semibold leading-snug text-[var(--text-primary)]">{heading}</p>
        {facts.length > 0 ? (
          <ul className="app-scroll mt-3 max-h-[min(42dvh,16rem)] space-y-2 overflow-y-auto pr-1 text-sm leading-snug text-[var(--text-secondary)]">
            {facts.map((f, i) => (
              <li key={`${i}-${f.slice(0, 72)}`} className="break-words">
                {f}
              </li>
            ))}
          </ul>
        ) : null}

        {exhausted ? <div className="mt-3">{exhaustedBlock}</div> : null}

        <div className="mt-4 flex shrink-0 flex-col gap-2 border-t border-[color:var(--border-soft)] pt-4">
          <button type="button" className={btnOutlinePreWorkout} disabled={exhausted} onClick={() => void onGenerate()}>
            {generateLabel}
          </button>
        </div>

        {generatedText ? (
          <div className="app-scroll mt-3 max-h-[min(36dvh,14rem)] shrink-0 space-y-2 overflow-y-auto border-t border-[color:var(--border-soft)] pt-3">
            <p className="text-xs font-medium text-[var(--tg-muted)]">Подсказка</p>
            <p className="text-sm leading-relaxed text-[var(--tg-text)]">{generatedText}</p>
            <details className="rounded-lg border border-[color:var(--border-soft)] bg-[var(--tg-bg)]/50 px-2 py-1.5 text-[11px]">
              <summary className="cursor-pointer text-[var(--tg-muted)]">Использованные факты</summary>
              <ul className="mt-1 list-disc space-y-0.5 pl-4 text-[var(--tg-muted)]">
                {(factsUsed.length > 0 ? factsUsed : facts).map((f, idx) => (
                  <li key={`${idx}-${f.slice(0, 40)}`}>{f}</li>
                ))}
              </ul>
            </details>
            <div className="flex flex-wrap gap-2">
              <button type="button" className={btnGhostCompact} onClick={() => void onCopy()}>
                Копировать
              </button>
              {showShorterSofter ? (
                <>
                  <button type="button" className={btnGhostCompact} disabled={exhausted} onClick={() => void onShorter()}>
                    Короче
                  </button>
                  <button type="button" className={btnGhostCompact} disabled={exhausted} onClick={() => void onSofter()}>
                    Мягче
                  </button>
                </>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>
    );
  }

  if (variant === "compact") {
    return (
      <div className="rounded-xl border border-[color:var(--border-soft)] bg-[var(--bg-card)]/60 p-3">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--tg-muted)]">{heading}</p>
        {facts.length > 0 ? (
          <ul className="mt-2 list-disc space-y-1 pl-4 text-xs leading-relaxed text-[var(--tg-text)]">
            {facts.map((f, i) => (
              <li key={`${i}-${f.slice(0, 64)}`}>{f}</li>
            ))}
          </ul>
        ) : null}

        {exhausted ? <div className="mt-2">{exhaustedBlock}</div> : null}

        <div className="mt-3 flex flex-col items-start gap-2">
          <button type="button" className={btnPrimaryCompact} disabled={exhausted} onClick={() => void onGenerate()}>
            {generateLabel}
          </button>
        </div>

        {generatedText ? (
          <div className="mt-3 flex flex-col gap-2 border-t border-[color:var(--border-soft)] pt-3">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--tg-muted)]">Подсказка</p>
            <p className="text-sm leading-relaxed text-[var(--tg-text)]">{generatedText}</p>
            <details className="rounded-lg border border-[color:var(--border-soft)] bg-[var(--tg-bg)]/50 px-2 py-1.5 text-[11px]">
              <summary className="cursor-pointer text-[var(--tg-muted)]">Использованные факты</summary>
              <ul className="mt-1 list-disc space-y-0.5 pl-4 text-[var(--tg-muted)]">
                {(factsUsed.length > 0 ? factsUsed : facts).map((f, idx) => (
                  <li key={`${idx}-${f.slice(0, 40)}`}>{f}</li>
                ))}
              </ul>
            </details>
            <div className="flex flex-wrap gap-2">
              <button type="button" className={btnGhostCompact} onClick={() => void onCopy()}>
                Копировать
              </button>
              {showShorterSofter ? (
                <>
                  <button type="button" className={btnGhostCompact} disabled={exhausted} onClick={() => void onShorter()}>
                    Короче
                  </button>
                  <button type="button" className={btnGhostCompact} disabled={exhausted} onClick={() => void onSofter()}>
                    Мягче
                  </button>
                </>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <Card className="border border-[color:var(--border-soft)] bg-[color:color-mix(in_srgb,var(--bg-card-elevated),transparent_12%)]">
      <div className="flex flex-col gap-2">
        <p className="app-section-label text-[11px]">{heading}</p>

        {exhausted ? exhaustedBlock : null}

        <button type="button" className={btnPrimary} disabled={exhausted} onClick={() => void onGenerate()}>
          {generateLabel}
        </button>

        {generatedText ? (
          <>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--tg-muted)]">Подсказка</p>
            <p className="text-sm leading-relaxed text-[var(--tg-text)]">{generatedText}</p>

            <details className="rounded-xl border border-[color:var(--border-soft)] bg-[var(--bg-card)]/80 px-3 py-2 text-xs">
              <summary className="cursor-pointer font-medium text-[var(--tg-muted)]">Использованные факты</summary>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-[var(--tg-muted)]">
                {(factsUsed.length > 0 ? factsUsed : facts).map((f, idx) => (
                  <li key={`${idx}-${f.slice(0, 48)}`}>{f}</li>
                ))}
              </ul>
            </details>

            <div className="flex flex-wrap gap-2">
              <button type="button" className={btnGhost} onClick={() => void onCopy()}>
                Копировать
              </button>
              {showShorterSofter ? (
                <>
                  <button type="button" className={btnGhost} disabled={exhausted} onClick={() => void onShorter()}>
                    Короче
                  </button>
                  <button type="button" className={btnGhost} disabled={exhausted} onClick={() => void onSofter()}>
                    Мягче
                  </button>
                </>
              ) : null}
            </div>
          </>
        ) : null}
      </div>
    </Card>
  );
}
