import type { ReactElement } from "react";
import { LegalDraftDocument } from "@/components/prod-shell/LegalDraftDocument";

export default function LegalPrivacyPage(): ReactElement {
  return (
    <LegalDraftDocument title="Политика обработки персональных данных">
      <p>Разделы: цели обработки, категории данных, сроки хранения, меры защиты, права субъекта ПДн.</p>
      <p className="mt-2">Полный текст будет добавлен после юридической экспертизы.</p>
    </LegalDraftDocument>
  );
}
