# Visual QA (375×812, Telegram WebView)

Ручной чеклист маршрутов для фазы D roadmap. Сохраняйте скрины в эту папку с именами `YYYY-MM-DD_<route>_<state>.png`.

## Маршруты

1. `/overview` — пустой день, день с слотами, черновик тренировки, paywall (expired demo).
2. `/schedule` — неделя, список слотов, пропуск/отмена с подтверждением, empty/all-done.
3. `/clients` — Все/Сегодня, карточка с долгом + CTA оплаты.
4. `/journal` — группы по дням, переход в запись.
5. `/workout` — лог, finish_confirm, summary; rest timer в footer.
6. `/billing/plans` — месяц/год, карточки тарифов.
7. `/start-workout` — resume черновика после refresh.

## Критерий

Соседние экраны используют `trainly-surface-card` / `trainly-cta-primary` без смеси устаревших `app-btn` на primary CTA.
