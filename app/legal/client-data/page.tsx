import type { ReactElement } from "react";
import { LegalDraftDocument } from "@/components/prod-shell/LegalDraftDocument";

export default function LegalClientDataPage(): ReactElement {
  return (
    <LegalDraftDocument title="Правила внесения данных клиентов">
      <p className="font-medium text-[var(--text-primary)]">Trainly — это тренерский дневник, а не медицинская карта.</p>
      <ul className="mt-3 list-disc space-y-2 pl-5 text-[var(--text-secondary)] marker:text-[var(--tg-muted)]">
        <li>Не вносите медицинские диагнозы, заключения врачей, данные анализов как «диагноз».</li>
        <li>Не храните паспортные данные, адреса, фотографии клиентов и избыточные чувствительные сведения.</li>
        <li>Для ограничений используйте формулировки уровня «ограничения для тренировки», а не клинический диагноз.</li>
        <li>Заметки и поля должны помогать вам вести тренировочный процесс, а не заменять медицинскую документацию.</li>
      </ul>
    </LegalDraftDocument>
  );
}
