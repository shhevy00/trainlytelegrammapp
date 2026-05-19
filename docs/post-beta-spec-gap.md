# Post-beta — spec-gap (фаза G)

Не блокирует closed beta. Реализовать после стабильного live-parity (фазы A–F).

| Направление | Статус | Примечание |
|-------------|--------|------------|
| Superset / drop-set nesting | Отложено | MVP: плоский `lib/workout/drop.ts` |
| Add exercise sheet (поиск + недавние) | Отложено | Сейчас: структура + «+ Упр.» |
| Focus mode | Отложено | Вернуть только при продуктовом решении |
| Link workout ↔ schedule slot dialog | Отложено | Частично через `scheduleItemId` |
| AI / credits в UI | Не показывать | `trainers.ai_credits_balance` без фичи |
| Client-facing app | Вне scope | — |
| Archive clients UI | Schema есть, UI нет | `lifecycle` |
| Export данных | Отложено | Copy risk «unlimited» |
| Расширенная аналитика в логгере | После стабильного журнала | — |

См. также [`workout-design-audit.md`](./workout-design-audit.md) и `WORKOUT_FLOW_SPEC.md`.
