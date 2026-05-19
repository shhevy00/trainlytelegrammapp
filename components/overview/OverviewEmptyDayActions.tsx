import Link from "next/link";
import type { ReactElement } from "react";
import { IconBolt, IconCalendar, IconCard, IconNote, IconUserPlus } from "@/components/overview/overviewIcons";

const QUICK_ACTIONS = [
  { href: "/clients/new", label: "Клиент", caption: "Новый профиль", Icon: IconUserPlus },
  { href: "/start-workout?mode=client", label: "С клиентом", caption: "Новая", Icon: IconBolt },
  { href: "/add-payment", label: "Оплата", caption: "Пакет", Icon: IconCard },
  { href: "/quick-note", label: "Заметка", caption: "К клиенту", Icon: IconNote },
] as const;

export function OverviewEmptyDayActions(): ReactElement {
  return (
    <section className="overview-card overview-actions-panel shrink-0 min-w-0" aria-label="Действия">
      <div className="overview-action-stack">
        <Link href="/schedule" prefetch={false} className="overview-action-primary">
          <IconCalendar className="overview-action-icon" aria-hidden />
          <span className="overview-action-primary-text">
            <span className="overview-action-title">Запланировать тренировку</span>
            <span className="overview-action-caption">Добавить слот в график</span>
          </span>
        </Link>
        <Link href="/start-workout?mode=quick" prefetch={false} className="overview-action-secondary">
          <IconBolt className="overview-action-icon" aria-hidden />
          <span className="overview-action-primary-text">
            <span className="overview-action-title">Быстрый старт</span>
            <span className="overview-action-caption">Без записи в расписании</span>
          </span>
        </Link>
      </div>

      <div className="overview-panel-divider" role="presentation" />

      <p className="overview-section-eyebrow overview-section-eyebrow--inset">Ещё</p>
      <div className="overview-quick-grid">
        {QUICK_ACTIONS.map(({ href, label, caption, Icon }) => (
          <Link key={href} href={href} prefetch={false} className="overview-quick-tile">
            <span className="overview-quick-tile-icon-wrap">
              <Icon className="overview-quick-tile-icon" aria-hidden />
            </span>
            <span className="overview-quick-tile-copy">
              <span className="overview-quick-tile-label">{label}</span>
              <span className="overview-quick-tile-caption">{caption}</span>
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
