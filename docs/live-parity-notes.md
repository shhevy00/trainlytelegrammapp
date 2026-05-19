# Live (PostgreSQL) — примечания к паритету

Базовый чеклист: [live-parity-checklist.md](./live-parity-checklist.md).

Используйте `.env.local` с `DATABASE_URL`, без `TRAINLY_USE_MOCK_DATA=true`, вход через `TRAINLY_DEV_AUTH_SECRET` на `/auth` или через Telegram на staging.

## Трассировка сценариев к коду

| № | Сценарий | Server actions / БД |
|---|----------|---------------------|
| 1 | Создать клиента | [`trainlyAddClientAction`](../app/actions/trainly.ts) → [`dbAddClient`](../lib/server/trainlyMutations.ts) |
| 2 | Шаблон тренировки | [`trainlyCreateWorkoutTemplateAction`](../app/actions/trainly.ts) → `dbCreateWorkoutTemplate` |
| 3 | Слот расписания | [`trainlyAddScheduleSlotAction`](../app/actions/trainly.ts) → `dbAddScheduleSlot` |
| 4–5 | Завершить тренировку, списание занятий | [`trainlyAddCompletedWorkoutAction`](../app/actions/trainly.ts) → [`dbAddCompletedWorkout`](../lib/server/trainlyMutations.ts) (`spendOneClientSessionBalance`) |
| 6 | Заметка без списания | [`trainlyAddNoteEntryAction`](../app/actions/trainly.ts) → [`dbAddNoteEntry`](../lib/server/trainlyMutations.ts) (без обновления `remaining_sessions`) |
| 7 | Оплата занятий | [`trainlyRecordCoachPaymentAction`](../app/actions/trainly.ts) → `dbRecordCoachPayment` |
| 8 | Quick note | [`trainlyAddCoachQuickNoteAction`](../app/actions/trainly.ts) → `dbAddCoachQuickNote` |
| 9 | Юр. согласие | [`trainlyAcceptLegalAction`](../app/actions/trainly.ts), редиректы в [`lib/config/trainlyRouteAccess.ts`](../lib/config/trainlyRouteAccess.ts) / layout |
| 10 | Истёкший доступ | [`assertCoreProductWriteAllowed`](../app/actions/trainly.ts) + [`canTrainerWriteCoreProduct`](../lib/billing/accessGate.ts); биллинг — отдельные маршруты |

## Автоматические проверки

Часть бизнес-логики покрыта скриптом без БД:

```bash
npm run test:unit
npm run test:integration
```

(см. [`scripts/unit-tests.ts`](../scripts/unit-tests.ts), [`scripts/integration/`](../scripts/integration/).)

## Реализовано в коде (2026-05)

- Черновики тренировки: `draft` / `in_progress` в PostgreSQL, autosave из `WorkoutLogger`, resume на `/start-workout`.
- Биллинг: self-service `active` только через webhook; в production обязательна верификация платежа API ЮKassa и `trainly_order_id`.
- Лимиты клиентов по тарифу (Start 10 / Pro 30 / Max 80, free 2) в `lib/billing/planLimits.ts` и `dbAddClient`.
- Удаление аккаунта: `trainlyDeleteAccountAction` + каскад `trainers`.

## Журнал ручного прогона

Заполняется при каждом полном прогоне чеклиста (дата, окружение, отметки по пунктам 1–10, замечания).

| Дата | Окружение | 1–10 OK | Замечания |
|------|-------------|---------|-----------|
|      |             |         |           |
