"use client";

import Link from "next/link";
import type { ReactElement } from "react";
import type { ClientProfileHeroModel } from "@/lib/clients/clientProfileHero";

interface ClientProfileHeroProps {
  model: ClientProfileHeroModel;
  onRepeat?: () => void;
}

export function ClientProfileHero({ model, onRepeat }: ClientProfileHeroProps): ReactElement {
  return (
    <section className="client-profile-hero" aria-label="Профиль клиента">
      <div className="client-profile-hero__top">
        <span className="client-profile-hero__avatar" aria-hidden>
          {model.initial}
        </span>
        <div className="client-profile-hero__identity">
          <h1 className="client-profile-hero__name">{model.name}</h1>
          {model.showGoalUnderName && model.goalLine ? (
            <p className="client-profile-hero__goal">{model.goalLine}</p>
          ) : null}
        </div>
        <span className={`client-profile-hero__balance client-profile-hero__balance--${model.balanceTone}`}>
          {model.balanceLabel}
        </span>
      </div>

      <p className="client-profile-hero__headline">{model.headline}</p>
      {model.subline ? <p className="client-profile-hero__subline">{model.subline}</p> : null}
      {model.limitationLine ? (
        <p className="client-profile-hero__limit">
          <span className="client-profile-hero__limit-label">Учесть</span> {model.limitationLine}
        </p>
      ) : null}

      <div className="client-profile-hero__actions">
        {model.primary.kind === "link" && model.primary.href ? (
          <Link href={model.primary.href} prefetch={false} className="app-btn client-profile-hero__btn-primary">
            {model.primary.label}
          </Link>
        ) : null}
        {model.secondary.length > 0 ? (
          <div className="client-profile-hero__secondary-row">
            {model.secondary.map((action) => {
              if (action.kind === "button") {
                return (
                  <button
                    key={action.label}
                    type="button"
                    className="app-btn client-profile-hero__btn-secondary"
                    onClick={onRepeat}
                  >
                    {action.label}
                  </button>
                );
              }
              if (!action.href) return null;
              return (
                <Link
                  key={action.label}
                  href={action.href}
                  prefetch={false}
                  className="app-btn client-profile-hero__btn-secondary"
                >
                  {action.label}
                </Link>
              );
            })}
          </div>
        ) : null}
      </div>

      {model.showRepeatHint ? (
        <p className="client-profile-hero__hint">Повтор прошлой тренировки появится после записи с упражнениями в журнале.</p>
      ) : null}
    </section>
  );
}
