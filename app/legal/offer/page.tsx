import type { ReactElement } from "react";
import { LegalDraftDocument } from "@/components/prod-shell/LegalDraftDocument";

export default function LegalOfferPage(): ReactElement {
  return (
    <LegalDraftDocument title="Публичная оферта">
      <p>Условия оказания платных услуг доступа к сервису Trainly: предмет, цена, порядок оплаты и акцепт.</p>
    </LegalDraftDocument>
  );
}
