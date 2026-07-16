-- Rank margins
INSERT INTO rank_margin_settings (rank, default_margin_rate, min_margin_rate, created_at, updated_at)
VALUES
  ('A', 15, 10, NOW(), NOW()),
  ('B', 20, 12, NOW(), NOW()),
  ('C', 25, 15, NOW(), NOW()),
  ('D', 30, 18, NOW(), NOW()),
  ('N', 35, 20, NOW(), NOW())
ON CONFLICT (rank) DO NOTHING;

-- System settings
INSERT INTO system_settings (setting_key, setting_value, created_at, updated_at)
VALUES
  ('company_name', '有限会社かにわでは', NOW(), NOW()),
  ('company_tel', '03-6433-3200', NOW(), NOW()),
  ('company_fax', '03-6433-3202', NOW(), NOW()),
  ('order_cutoff_time', '23:00', NOW(), NOW()),
  ('price_increase_alert_pct', '10', NOW(), NOW()),
  ('abnormal_value_alert_pct', '30', NOW(), NOW()),
  ('email_signature', E'有限会社かにわでは\nTEL: 03-6433-3200', NOW(), NOW())
ON CONFLICT (setting_key) DO NOTHING;

-- Categories
INSERT INTO categories (category_code, name, sort_order, created_at, updated_at)
VALUES
  ('VEG', '野菜', 1, NOW(), NOW()),
  ('PROC', '加工', 2, NOW(), NOW()),
  ('MUSH', 'きのこ', 3, NOW(), NOW()),
  ('FRUIT', '果物', 4, NOW(), NOW())
ON CONFLICT (category_code) DO NOTHING;

-- Suppliers
INSERT INTO suppliers (name, is_active, created_at, updated_at)
SELECT v.name, true, NOW(), NOW()
FROM (VALUES
  ('壱永'), ('カネダイ'), ('丸仙'), ('三成'), ('神田'),
  ('東一'), ('荏原'), ('アスカ'), ('丸和'), ('大捨')
) AS v(name)
WHERE NOT EXISTS (SELECT 1 FROM suppliers s WHERE s.name = v.name);
