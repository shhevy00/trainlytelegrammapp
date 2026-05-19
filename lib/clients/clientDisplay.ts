/** Укороченное обращение без полного ФИО (конфиденциальность). */
export function clientAliasFromName(fullName: string): string {
  const t = fullName.trim();
  if (!t) return "Клиент";
  return t.split(/\s+/)[0] ?? "Клиент";
}
