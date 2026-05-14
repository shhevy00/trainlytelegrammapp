import type { ReactElement } from "react";
import { LegalDraftDocument } from "@/components/prod-shell/LegalDraftDocument";

export default function LegalPersonalDataConsentPage(): ReactElement {
  return (
    <LegalDraftDocument title="Согласие на обработку персональных данных">
      <p>Формулировки согласия и перечень обрабатываемых данных будут согласованы с юристом.</p>
    </LegalDraftDocument>
  );
}
