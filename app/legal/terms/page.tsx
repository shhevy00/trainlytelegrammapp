import type { ReactElement } from "react";
import { LegalDraftDocument } from "@/components/prod-shell/LegalDraftDocument";

export default function LegalTermsPage(): ReactElement {
  return (
    <LegalDraftDocument title="Пользовательское соглашение">
      <p>Разделы: предмет соглашения, учётная запись тренера, ограничение ответственности, изменение условий.</p>
      <p className="mt-2">Полный текст будет добавлен после юридической экспертизы.</p>
    </LegalDraftDocument>
  );
}
