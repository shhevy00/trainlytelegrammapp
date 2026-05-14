import type { ReactElement } from "react";
import { LegalDraftDocument } from "@/components/prod-shell/LegalDraftDocument";

export default function LegalRefundPage(): ReactElement {
  return (
    <LegalDraftDocument title="Правила оплаты, отмены и возврата">
      <p>Порядок оплаты подписки, отмена автопродления, возвраты — по согласованию с эквайрингом и юристом.</p>
    </LegalDraftDocument>
  );
}
