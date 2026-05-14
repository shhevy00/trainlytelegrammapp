-- Примеры EXPLAIN для типовых запросов после интеграции БД.
-- Подставьте реальный trainer_id (uuid).

-- EXPLAIN ANALYZE
-- SELECT * FROM clients WHERE trainer_id = '...' AND lifecycle = 'active';

-- EXPLAIN ANALYZE
-- SELECT * FROM workouts
-- WHERE trainer_id = '...' AND status::text IN ('completed', 'completed_as_note')
-- ORDER BY completed_at DESC NULLS LAST LIMIT 50;

-- EXPLAIN ANALYZE
-- SELECT * FROM schedule_items
-- WHERE trainer_id = '...' AND scheduled_date BETWEEN '2026-01-01' AND '2026-01-07';
