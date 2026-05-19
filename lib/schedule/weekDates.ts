import { addDaysLocal, parseLocalDay } from "@/lib/overview/dailyOperations";

const RU_WD_SHORT_MON = ["пн", "вт", "ср", "чт", "пт", "сб", "вс"] as const;

const RU_MONTH_SHORT = [
  "янв",
  "фев",
  "мар",
  "апр",
  "мая",
  "июн",
  "июл",
  "авг",
  "сен",
  "окт",
  "ноя",
  "дек",
] as const;

const RU_WD_TITLE = ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"] as const;

function toIsoDate(d: Date): string {
  const y = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${mo}-${day}`;
}

/** Понедельник ISO-недели, в которую попадает дата. */
export function startOfIsoWeekMonday(dateIso: string): string {
  const d = parseLocalDay(dateIso);
  const jsDay = d.getDay();
  const offsetFromMonday = jsDay === 0 ? -6 : 1 - jsDay;
  d.setDate(d.getDate() + offsetFromMonday);
  return toIsoDate(d);
}

/** 7 ISO-дат с понедельника по воскресенье. */
export function weekDayIsoList(weekStartMondayIso: string): readonly string[] {
  return [0, 1, 2, 3, 4, 5, 6].map((i) => addDaysLocal(weekStartMondayIso, i));
}

/** Короткий день недели (пн). */
export function formatWeekdayShort(dateIso: string): string {
  const d = parseLocalDay(dateIso);
  const idx = d.getDay() === 0 ? 6 : d.getDay() - 1;
  return RU_WD_SHORT_MON[idx] ?? "пн";
}

/** Число месяца для полоски дней. */
export function formatDayOfMonth(dateIso: string): number {
  return parseLocalDay(dateIso).getDate();
}

/** @deprecated Используйте formatWeekdayShort + formatDayOfMonth */
export function formatWeekStripCellLabel(dateIso: string): string {
  return `${formatWeekdayShort(dateIso)} ${formatDayOfMonth(dateIso)}`;
}

/** Диапазон недели для навигации: «12–18 мая». */
export function formatWeekRangeLabel(weekStartMondayIso: string): string {
  const start = parseLocalDay(weekStartMondayIso);
  const end = parseLocalDay(addDaysLocal(weekStartMondayIso, 6));
  const sm = RU_MONTH_SHORT[start.getMonth()] ?? "янв";
  const em = RU_MONTH_SHORT[end.getMonth()] ?? "янв";
  if (start.getMonth() === end.getMonth()) {
    return `${start.getDate()}–${end.getDate()} ${sm}`;
  }
  return `${start.getDate()} ${sm} – ${end.getDate()} ${em}`;
}

/** Заголовок выбранного дня для экрана графика. */
export function formatScheduleDayTitle(selectedIso: string, mockTodayIso: string): string {
  if (selectedIso === mockTodayIso) return "Сегодня";
  if (selectedIso === addDaysLocal(mockTodayIso, 1)) return "Завтра";
  const d = parseLocalDay(selectedIso);
  const wd = RU_WD_TITLE[d.getDay()] ?? "Пн";
  const mon = RU_MONTH_SHORT[d.getMonth()] ?? "янв";
  return `${wd} · ${d.getDate()} ${mon}`;
}
