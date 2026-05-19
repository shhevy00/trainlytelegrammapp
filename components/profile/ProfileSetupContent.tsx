"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent, type ReactElement } from "react";
import { PageHeader } from "@/components/prod-shell/PageHeader";
import { ShellMain } from "@/components/prod-shell/ShellMain";
import { mockTrainer } from "@/lib/mock/data";
import type { MockTrainerProfile } from "@/lib/mock/lifecycleTypes";
import { useMockApp } from "@/lib/mock/MockAppProvider";

const labelCls = "mb-1.5 block text-sm font-medium text-[var(--text-secondary)]";
const inputCls =
  "w-full min-w-0 rounded-xl border border-[color:var(--border-strong)] bg-[var(--tg-bg)] px-3 py-2.5 text-[var(--text-primary)] outline-none focus:border-[color:var(--border-strong)]";

interface ProfileSetupFormProps {
  profile: MockTrainerProfile | null;
  onComplete: (input: {
    displayName: string;
    specialization?: string;
    city?: string;
    timezone: string;
    currency: "₽";
  }) => void | Promise<void>;
}

function ProfileSetupForm({ profile, onComplete }: ProfileSetupFormProps): ReactElement {
  const router = useRouter();
  const [name, setName] = useState(() => profile?.displayName.trim() ?? mockTrainer.firstName.trim());
  const [spec, setSpec] = useState(() => profile?.specialization ?? "");
  const [city, setCity] = useState(() => profile?.city ?? "");
  const [tz, setTz] = useState(() => profile?.timezone ?? "Europe/Moscow");
  const currency = "₽" as const;

  const onSubmit = async (e: FormEvent): Promise<void> => {
    e.preventDefault();
    const displayName = name.trim() || mockTrainer.firstName.trim() || "Тренер";
    await Promise.resolve(
      onComplete({
        displayName,
        specialization: spec.trim() || undefined,
        city: city.trim() || undefined,
        timezone: tz,
        currency: "₽",
      }),
    );
    router.push("/welcome");
  };

  return (
    <form onSubmit={(e) => void onSubmit(e)} className="flex flex-col gap-4">
      <div className="premium-surface p-4">
        <label htmlFor="ps-name" className={labelCls}>
          Имя тренера
        </label>
        <input
          id="ps-name"
          className={inputCls}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Как к вам обращаться"
          autoComplete="name"
        />
      </div>
      <div className="premium-surface p-4">
        <label htmlFor="ps-spec" className={labelCls}>
          Специализация <span className="text-[var(--tg-muted)]">(необязательно)</span>
        </label>
        <input
          id="ps-spec"
          className={inputCls}
          value={spec}
          onChange={(e) => setSpec(e.target.value)}
          placeholder="Например: силовой тренинг"
        />
      </div>
      <div className="premium-surface p-4">
        <label htmlFor="ps-city" className={labelCls}>
          Город <span className="text-[var(--tg-muted)]">(необязательно)</span>
        </label>
        <input
          id="ps-city"
          className={inputCls}
          value={city}
          onChange={(e) => setCity(e.target.value)}
          placeholder="Москва"
        />
      </div>
      <div className="premium-surface p-4">
        <label htmlFor="ps-tz" className={labelCls}>
          Часовой пояс
        </label>
        <select id="ps-tz" className={inputCls} value={tz} onChange={(e) => setTz(e.target.value)}>
          <option value="Europe/Kaliningrad">Калининград (UTC+2)</option>
          <option value="Europe/Moscow">Москва (UTC+3)</option>
          <option value="Europe/Samara">Самара (UTC+4)</option>
          <option value="Asia/Yekaterinburg">Екатеринбург (UTC+5)</option>
          <option value="Asia/Omsk">Омск (UTC+6)</option>
          <option value="Asia/Krasnoyarsk">Красноярск (UTC+7)</option>
          <option value="Asia/Irkutsk">Иркутск (UTC+8)</option>
          <option value="Asia/Yakutsk">Якутск (UTC+9)</option>
          <option value="Asia/Vladivostok">Владивосток (UTC+10)</option>
          <option value="Asia/Magadan">Магадан (UTC+11)</option>
          <option value="Asia/Kamchatka">Камчатка (UTC+12)</option>
        </select>
      </div>
      <div className="premium-surface p-4">
        <p className={labelCls}>Валюта</p>
        <p className="text-lg font-semibold text-[var(--text-primary)]">{currency}</p>
        <p className="mt-1 text-xs text-[var(--tg-muted)]">Другие валюты — позже.</p>
      </div>

      <button
        type="submit"
        className="app-btn w-full rounded-2xl bg-[var(--tg-accent)] px-4 py-3.5 text-center text-[15px] font-semibold text-white shadow-app-primary"
      >
        Сохранить и войти в дневник
      </button>
      <Link
        href="/overview"
        prefetch={false}
        className="app-btn block w-full rounded-2xl border border-[color:var(--border-strong)] bg-[var(--tg-bg)] py-3 text-center text-sm font-semibold text-[var(--text-primary)]"
      >
        Пропустить и перейти в обзор
      </Link>
    </form>
  );
}

export function ProfileSetupContent(): ReactElement {
  const { mockLifecycle, completeProfileSetupMock } = useMockApp();
  const profile = mockLifecycle.trainerProfile;
  const formKey = profile ? `p:${profile.displayName}:${profile.timezone}` : "p:new";

  return (
    <ShellMain>
      <PageHeader
        title="Профиль тренера"
        subtitle="Несколько полей — можно изменить позже, когда появится сервер."
        backHref="/profile"
        backLabel="Назад"
      />
      <ProfileSetupForm key={formKey} profile={profile} onComplete={completeProfileSetupMock} />
    </ShellMain>
  );
}
