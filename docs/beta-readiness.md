# Бета-готовность Trainly

Чеклист перед приглашением 3–5 реальных тренеров.

## Артефакты в репозитории (техника)

- Паритет сценариев с кодом и журнал ручного прогона: [`docs/live-parity-notes.md`](live-parity-notes.md), чеклист [`docs/live-parity-checklist.md`](live-parity-checklist.md).
- Юнит-проверки без БД: `npm run test:unit` ([`scripts/unit-tests.ts`](../scripts/unit-tests.ts)), шаг в [CI](../.github/workflows/ci.yml).
- Идемпотентность вебхука ЮKassa: [`docs/yookassa-idempotency.md`](yookassa-idempotency.md).
- Шаблон сбора фидбека: [`docs/beta-feedback-template.md`](beta-feedback-template.md).

## Юридическое

- [ ] Тексты `/legal/*` и согласия прошли **ревью юриста** (сейчас — черновики).
- [ ] Версии документов в БД (`legal_documents`) совпадают с тем, что показывается в UI.
- [ ] Маркетинговое согласие отделено от обязательных (таблица `trainer_consents`).

## Продукт и поддержка

- [ ] Канал поддержки: задайте `NEXT_PUBLIC_TRAINLY_SUPPORT_URL` (см. `.env.example`); экран [`/support`](../app/support/page.tsx).
- [ ] Известные ограничения MVP перечислены в README или внутренней wiki.
- [ ] Удаление аккаунта: на [`/account/delete`](../app/account/delete/page.tsx) явно помечено как MVP-заглушка без удаления из БД; README — раздел «Удаление аккаунта».

## Техника

- [ ] `npm run lint`, `npm run test:unit` и `npm run build` зелёные; CI проходит.
- [ ] Smoke после деплоя: вход Telegram → обзор → клиент → тренировка → журнал.
- [ ] ЮKassa: тестовый платёж на staging, повтор вебхука не дублирует доступ (см. [`docs/yookassa-idempotency.md`](yookassa-idempotency.md)).

## Обратная связь

- [ ] Шаблон сбора фидбека: [`docs/beta-feedback-template.md`](beta-feedback-template.md).
- [ ] Регулярный разбор ошибок за первую неделю беты.
