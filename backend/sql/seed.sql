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
  ('company_name', '有限会社かにわ', NOW(), NOW()),
  ('company_tel', '03-6433-3200', NOW(), NOW()),
  ('company_fax', '03-6433-3202', NOW(), NOW()),
  ('order_cutoff_time', '23:00', NOW(), NOW()),
  ('price_increase_alert_pct', '10', NOW(), NOW()),
  ('abnormal_value_alert_pct', '30', NOW(), NOW()),
  ('email_signature', E'有限会社かにわ\nTEL: 03-6433-3200', NOW(), NOW())
ON CONFLICT (setting_key) DO NOTHING;

-- Categories
INSERT INTO categories (category_code, name, sort_order, created_at, updated_at)
VALUES
  ('VEG', '野菜', 1, NOW(), NOW()),
  ('PROC', '加工', 2, NOW(), NOW()),
  ('MUSH', 'きのこ', 3, NOW(), NOW()),
  ('FRUIT', '果物', 4, NOW(), NOW())
ON CONFLICT (category_code) DO NOTHING;

-- Product units / specs (規格 = 数量+単位, e.g. 200g / 1 kg)
INSERT INTO lookup_options (kind, value, sort_order, is_active, created_at, updated_at)
VALUES
  ('unit', 'g', 0, true, NOW(), NOW()),
  ('unit', 'kg', 1, true, NOW(), NOW()),
  ('unit', 'PC', 2, true, NOW(), NOW()),
  ('unit', 'case', 3, true, NOW(), NOW()),
  ('unit', 'CS', 4, true, NOW(), NOW()),
  ('unit', 'hon', 5, true, NOW(), NOW()),
  ('unit', 'tama', 6, true, NOW(), NOW()),
  ('spec', '100g', 0, true, NOW(), NOW()),
  ('spec', '200g', 1, true, NOW(), NOW()),
  ('spec', '500g', 2, true, NOW(), NOW()),
  ('spec', '1 kg', 3, true, NOW(), NOW())
ON CONFLICT (kind, value) DO NOTHING;

-- Suppliers
INSERT INTO suppliers (name, is_active, created_at, updated_at)
SELECT v.name, true, NOW(), NOW()
FROM (VALUES
  ('壱永'), ('カネダイ'), ('丸仙'), ('三成'), ('神田'),
  ('東一'), ('荏原'), ('アスカ'), ('丸和'), ('大捨')
) AS v(name)
WHERE NOT EXISTS (SELECT 1 FROM suppliers s WHERE s.name = v.name);
