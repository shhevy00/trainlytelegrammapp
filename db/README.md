# Слой данных Trainly (PostgreSQL + Drizzle)

## Сущности

| Таблица | Назначение |
|---------|------------|
| `trainers` | Учётная запись тренера; позже — `telegram_user_id`, профиль. |
| `trainer_product_access` | Доступ к продукту Trainly (отдельно от оплат клиентов). |
| `clients` | Клиенты; `remaining_sessions` ведётся приложением. |
| `client_session_payments` | Оплаты пакетов / занятий (деньги клиент ↔ тренер). |
| `coach_quick_notes` | Быстрые заметки с типом. |
| `workout_templates` / `workout_template_exercises` | Шаблоны по клиенту. |
| `schedule_items` | План; статус; опционально шаблон. |
| `workouts` | Черновик или факт в журнале; связь со слотом `schedule_item_id`. |
| `workout_exercises` / `workout_sets` | Структура тренировки и подходы. |
| `billing_webhook_events` | Входящие вебхуки провайдера; уникальный `idempotency_key` для идемпотентности. |
| `trainly_orders` | Заказы доступа Trainly (ЮKassa): сумма, тариф, статус, `yookassa_payment_id`. |
| `legal_documents` | Каталог версий юридических документов (код + версия). |
| `trainer_legal_acceptances` | Принятие конкретной версии документа тренером. |
| `trainer_consents` | Опциональные согласия (например маркетинг). |
| `trainer_access_events` | Аудит изменений доступа Trainly (append-only). |

Связь **план ↔ факт**: только `workouts.schedule_item_id` → `schedule_items` (без циклического FK). При завершении тренировки приложение обновляет статус слота.

## Ограничения и индексы

- **Черновик / in_progress**: не более одной строки на пару `(trainer_id, client_id)` со статусом `draft` или `in_progress` (частичный уникальный индекс); отдельный частичный индекс для поиска активных логгеров.
- **Журнал**: частичный индекс по `(trainer_id, completed_at)` только для завершённых тренировок.
- **Расписание**: частичный индекс по статусам `planned` / `upcoming`; длительность слота 1–1440 мин.
- **Оплаты клиенту**: `sessions_added > 0`, сумма в рублях ≥ 0 если задана.
- **Шаблоны**: `order_index >= 0`, `planned_sets` — `NULL` или 1–20 (как в `lib/workout/templates.ts`).
- **Тренировки**: для `draft` / `in_progress` / `cancelled` — `completed_at IS NULL`; для `completed` / `completed_as_note` — `completed_at NOT NULL`; неотрицательные `duration_minutes` и `filled_set_count` при наличии.

Если понадобятся **несколько черновиков на одного клиента**, частичный уникальный индекс на черновики нужно будет снять отдельной миграцией.

## Selectel и прод

- Создайте кластер **PostgreSQL** в панели Selectel, включите **SSL**. Строка подключения обычно вида  
  `postgresql://USER:PASSWORD@HOST:PORT/DBNAME?sslmode=require` — передайте её в `DATABASE_URL`.
- **Бэкапы**: включите автоматические бэкапы в панели Selectel для кластера.
- **Пул соединений**: если приложение Next.js крутится в **serverless** (Vercel и т.п.) к одному Postgres на Selectel, используйте **PgBouncer** (если доступен в тарифе) или ограничьте `max` пула в коде; при **одном Node-процессе** на VPS достаточно одного `pg.Pool` на процесс (см. [lib/db/server.ts](lib/db/server.ts)).
- Миграции перед деплоем: `npm run db:migrate:run` (или `npm run db:migrate` через drizzle-kit при совместимой конфигурации).

## Команды

```bash
# сгенерировать SQL-миграцию по изменению схемы
npm run db:generate

# применить миграции (drizzle-kit)
npm run db:migrate

# применить миграции программно (удобно в CI / Docker)
npm run db:migrate:run
```

Переменная окружения: `DATABASE_URL` (см. `.env.example` в корне репозитория).

### Итерация A (локальная проверка Postgres)

1. В `.env.local`: `DATABASE_URL`, при необходимости `JWT_SECRET` (≥16 символов) для сессии.
2. `npm run db:migrate:run` — применить миграции.
3. `npm run db:smoke` — быстрый `SELECT 1` (проверка подключения без Next.js).
4. `npm run dev` — ручной прогон: клиент → график → тренировка → журнал (при `DATABASE_URL` без `TRAINLY_USE_MOCK_DATA=true` режим postgres включается в dev).

### Seed (локально)

После миграций: `npm run db:seed` — демо-тренер с `telegram_user_id = 8888888888888`, клиенты, шаблон, слоты (строка тренера с этим id пересоздаётся). На **production** по умолчанию запрещён; только с `TRAINLY_ALLOW_SEED=true`.

Локальный Postgres: `docker-compose up -d` (образ `postgres:16`, БД `trainly`, пароль `postgres`, на **хосте порт 5433**, внутри контейнера 5432 — чтобы не конфликтовать с PostgreSQL в Windows на 5432).

## ЮKassa (webhook)

- Эндпоинт приложения: `POST /api/webhooks/yookassa`. Заголовок `X-Trainly-Yookassa-Secret` должен совпадать с `TRAINLY_YOOKASSA_WEBHOOK_SECRET` (настройте тот же секрет на прокси или в кастомном заголовке к URL уведомлений).
- ЮKassa не добавляет произвольные заголовки: для staging можно включить `TRAINLY_YOOKASSA_WEBHOOK_ALLOW_QUERY_SECRET=true` и задать URL уведомлений с query `trainly_webhook_secret=...` (в production предпочтительнее прокси, подставляющий заголовок).
- В метаданных платежа при создании checkout передавайте как минимум `trainly_trainer_id` (uuid тренера) и `plan_code` (`start` | `pro` | `max`); опционально `trainly_order_id` (uuid строки в `trainly_orders`).
- Каждое уведомление сохраняется в `billing_webhook_events` с ключом идемпотентности `${event}:${payment.id}`; повтор не меняет доступ повторно.
- В production при `YOOKASSA_REQUIRE_API_VERIFY=true` без `YOOKASSA_SHOP_ID` / `YOOKASSA_SECRET_KEY` обработчик вернёт 503 (не начисляет доступ «вслепую»).

## Профилирование и RLS

- Примеры `EXPLAIN` для типовых запросов: [scripts/explain-hot.sql](scripts/explain-hot.sql).
- Черновик политик **RLS**: [db/rls.example.sql](db/rls.example.sql) (не применяется автоматически).

## Следующие шаги (по желанию)

- Материализованные KPI по клиенту (если перестанем считать только из `workouts`).
