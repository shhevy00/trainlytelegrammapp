-- Пример политик Row Level Security (НЕ применяется автоматически).
-- Включение: ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
-- Сессия должна выставлять, например: SET LOCAL app.trainer_id = '<uuid>';
-- Политика: USING (trainer_id = current_setting('app.trainer_id', true)::uuid);

-- ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY clients_isolation ON clients
--   FOR ALL
--   USING (trainer_id = current_setting('app.trainer_id', true)::uuid)
--   WITH CHECK (trainer_id = current_setting('app.trainer_id', true)::uuid);

-- Повторите по шаблону для workout_templates, schedule_items, workouts и т.д.
