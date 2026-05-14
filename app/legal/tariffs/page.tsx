import type { ReactElement } from "react";
import { LegalDraftDocument } from "@/components/prod-shell/LegalDraftDocument";
import { getLegalTariffDraftBlocks, LEGAL_TARIFF_DRAFT_NOTE } from "@/lib/billing/planDefinitions";

export default function LegalTariffsPage(): ReactElement {
  const blocks = getLegalTariffDraftBlocks();

  return (
    <LegalDraftDocument title="Условия тарифов">
      <div className="space-y-5">
        {blocks.map((b) => (
          <section key={b.title}>
            <h3 className="font-display text-base font-semibold text-[var(--text-primary)]">{b.title}</h3>
            <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-[var(--text-secondary)] marker:text-[var(--tg-muted)]">
              {b.lines.map((line) => (
                <li key={`${b.title}-${line}`}>{line}</li>
              ))}
            </ul>
          </section>
        ))}
        <p className="border-t border-[color:var(--border-soft)] pt-4 text-xs leading-relaxed text-[var(--tg-muted)]">
          {LEGAL_TARIFF_DRAFT_NOTE}
        </p>
      </div>
    </LegalDraftDocument>
  );
}
