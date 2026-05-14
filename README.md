# Trainly (Telegram Mini App)

Тренерский дневник: клиенты, расписание, лог тренировок, журнал, оплаты занятий.

Стек: **Next.js App Router**, React, TypeScript, Tailwind, **PostgreSQL**, **Drizzle ORM**.

## Источник данных / безопасность production

- **Mock** (данные в памяти) — только для **локальной разработки и демо** без `DATABASE_URL` (см. [`lib/config/dataSource.ts`](lib/config/dataSource.ts)).
- **Production** требует **`DATABASE_URL`**; тихий fallback в mock **запрещён** — при неверной конфигурации будет ошибка (например 503 от edge `proxy`).
- **`TRAINLY_USE_MOCK_DATA=true` в production runtime запрещён** (явная ошибка конфигурации).
- Персональные данные: для прод в РФ — PostgreSQL на площадке в РФ, см. **[`db/README.md`](db/README.md)**.

## Локальная разработка

```bash
npm install
npm run dev
```

Откройте [http://localhost:3000](http://localhost:3000).

## База данных

Без `DATABASE_URL` в dev по умолчанию используется **режим мок-данных** в памяти (см. [`lib/config/dataSource.ts`](lib/config/dataSource.ts)).

Чтобы работать с **PostgreSQL**:

1. Скопируйте [`.env.example`](.env.example) в `.env.local` и задайте `DATABASE_URL`, `JWT_SECRET` (не короче 16 символов).
2. Примените миграции: `npm run db:migrate:run`
3. Проверка подключения: `npm run db:smoke`

**PostgreSQL без cookie:** [`proxy.ts`](proxy.ts) (edge) редиректит защищённые маршруты (в т.ч. `/overview`) на `/welcome`. Кнопки welcome ведут на [`/auth`](app/auth/page.tsx); в development при заданном `TRAINLY_DEV_AUTH_SECRET` на экране входа есть кнопка **«Dev: войти (PostgreSQL + cookie)»** (тот же сценарий, что `POST /api/auth/dev`).

Подробности по таблицам, миграциям, прод-хостингу БД (в т.ч. РФ): **[`db/README.md`](db/README.md)**.

Дополнительно: [чеклист деплоя](docs/deployment-ru.md), [бета-готовность](docs/beta-readiness.md), [паритет live / postgres](docs/live-parity-checklist.md), [примечания к паритету](docs/live-parity-notes.md), [идемпотентность ЮKassa](docs/yookassa-idempotency.md), [шаблон фидбека беты](docs/beta-feedback-template.md).

## Поддержка пользователей

Задайте в `.env.local` публичную ссылку **`NEXT_PUBLIC_TRAINLY_SUPPORT_URL`** (например `https://t.me/your_username`). Тогда на [`/support`](app/support/page.tsx) отображается кликабельный контакт. Без переменной показывается подсказка из `.env.example`.

## Паритет PostgreSQL и автотесты

- Ручной чеклист: [`docs/live-parity-checklist.md`](docs/live-parity-checklist.md); трассировка к коду и журнал прогонов: [`docs/live-parity-notes.md`](docs/live-parity-notes.md).
- Автоматические проверки логики без БД: `npm run test:unit` (скрипт [`scripts/unit-tests.ts`](scripts/unit-tests.ts); тот же шаг в CI).

## Smoke после деплоя

1. Вход через Telegram Mini App → cookie-сессия.  
2. Обзор → клиент → старт тренировки → завершение с ≥1 заполненным сетом.  
3. Журнал отображает запись; при необходимости — оплата занятий и юр. согласие.

## Вход не из Telegram (ссылка в браузере)

**Текущее решение для production:** только **Telegram Mini App** — сервер принимает подписанный `initData` ([`/api/auth/telegram`](app/api/auth/telegram/route.ts)). Открытие сайта по обычной ссылке **не подставляет** данные Telegram; отдельный веб-логин (пароль, magic link и т.д.) **не входит в MVP** и потребует отдельного эпика. На экране [`/auth`](app/auth/page.tsx) это отражено в тексте; в dev с PostgreSQL доступен **Dev: войти** при `TRAINLY_DEV_AUTH_SECRET`.

## Мобильные устройства и известные ограничения MVP

Интерфейс рассчитан на **mobile-first** (нижняя навигация, safe-area). Перед бетой нужен **ручной прогон на реальных iPhone/Android** (Safari/Chrome) и отдельно внутри **Telegram WebView**: клавиатура vs поля ввода в логгере, прокрутка в sheet’ах, высота viewport.

Ограничения: возможны отличия веб-версии Telegram и внешнего браузера; часть API `Telegram.WebApp` доступна только внутри клиента Telegram. Список найденных ограничений ведите внутри команды (wiki) и при необходимости добавляйте в этот README.

## Платформенная «админка»

**Кабинет тренера** — это текущее приложение (при необходимости улучшается десктопный layout тех же экранов). **Админка платформы** (все тренеры, блокировки, аналитика) **вне скоупа MVP** до отдельного ТЗ: отдельные роли, аудит, изоляция данных.

## Удаление аккаунта

Экран [`/account/delete`](app/account/delete/page.tsx) в MVP **не удаляет** строки из PostgreSQL и только возвращает в профиль после подтверждения сценария. Реальное удаление данных — отдельная серверная задача (правовые сроки, каскады, бэкапы).

## Сборка и линт

```bash
npm run lint
npm run test:unit
npm run build
```

Если на Windows `npm run build` падает на TypeScript с сообщением про несовпадение путей `.next/cache/.tsbuildinfo` (`E:/` vs `E:\`), очистите кэш и повторите:

```bash
npm run clean
npm run build
```

## Авторизация (Telegram Mini App)

- **Production / staging:** `POST /api/auth/telegram` с телом `{ "initData": "<строка из Telegram.WebApp.initData>" }` — сервер проверяет подпись ([`lib/auth/telegram.ts`](lib/auth/telegram.ts)), создаёт/находит тренера, выставляет httpOnly cookie `trainly_session` ([`lib/auth/jwt.ts`](lib/auth/jwt.ts)).
- **Только development:** `POST /api/auth/dev` с заголовком `x-trainly-dev-secret: TRAINLY_DEV_AUTH_SECRET` — в `NODE_ENV === "production"` отключён ([`app/api/auth/dev/route.ts`](app/api/auth/dev/route.ts)). Тот же сценарий на UI: кнопка **«Dev: войти»** на [`/auth`](app/auth/page.tsx) вызывает [`enterDevTrainerSessionAction`](app/actions/trainly.ts).

## Скрипты

| Команда | Назначение |
|--------|------------|
| `npm run dev` | Dev-сервер Next.js |
| `npm run build` | Production-сборка |
| `npm run lint` | ESLint |
| `npm run test:unit` | Проверки без БД ([`scripts/unit-tests.ts`](scripts/unit-tests.ts)) |
| `npm run clean` | Удалить `.next` (кэш сборки; при ошибках путей на Windows) |
| `npm run db:migrate:run` | Применить SQL-миграции из `drizzle/` |
| `npm run db:smoke` | `SELECT 1` к Postgres |
| `npm run db:seed` | Демо-данные (см. [`db/README.md`](db/README.md)) |
| `npm run db:generate` | Сгенерировать миграцию из схемы (drizzle-kit) |
| `npm run db:studio` | Drizzle Studio |

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
