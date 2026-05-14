import type { ReactElement } from "react";

export function LegalWarningCard(): ReactElement {
  return (
    <div
      className="rounded-2xl border border-[color:color-mix(in_srgb,var(--warning),transparent_55%)] bg-[color:color-mix(in_srgb,var(--warning),transparent_88%)] p-4 text-sm leading-relaxed text-[var(--text-primary)]"
      role="note"
    >
      <p className="font-semibold">Черновик</p>
      <p className="mt-1 text-[var(--text-secondary)]">
        Текст должен быть проверен юристом перед запуском.
      </p>
    </div>
  );
}
