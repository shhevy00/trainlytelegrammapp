# ЮKassa: идемпотентность вебхука

Обработчик: [`app/api/webhooks/yookassa/route.ts`](../app/api/webhooks/yookassa/route.ts) → [`processYookassaWebhook`](../lib/server/yookassaWebhook.ts).

## Ключ идемпотентности

Перед бизнес-логикой в таблицу `billing_webhook_events` вставляется строка с полем `idempotency_key` = `` `${event}:${paymentId}` ``.

Используется `onConflictDoNothing` по уникальному ключу. Повтор того же события для того же `payment.id`:

- вторая вставка не создаёт строку;
- обработчик возвращает **HTTP 200** и тело `duplicate`;
- доступ и заказ **не дублируются**.

## Ручная проверка на staging

1. Настроить `TRAINLY_YOOKASSA_WEBHOOK_SECRET` и `YOOKASSA_SHOP_ID` / `YOOKASSA_SECRET_KEY` (в production верификация платежа через API обязательна).
2. В production query-параметр `trainly_webhook_secret` **не принимается** — только заголовок `X-Trainly-Yookassa-Secret`.
3. В production в метаданных платежа обязателен `trainly_order_id`; заказ проверяется по сумме, тарифу и `yookassa_payment_id`.
4. Отправить одно и то же JSON-тело `payment.succeeded` дважды (например через `curl`).
5. Убедиться: второй ответ `duplicate`, в `trainer_product_access` одно обновление на период.
