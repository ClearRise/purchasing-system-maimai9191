-- Replace incorrect demo 規格 (バラ/ケース/…) with pack-size style values.
-- Only removes the known wrong seed labels; does not touch other custom specs.

DELETE FROM lookup_options
WHERE kind = 'spec'
  AND value IN ('バラ', 'ケース', '袋', '箱');

INSERT INTO lookup_options (kind, value, sort_order, is_active, created_at, updated_at)
VALUES
  ('unit', 'g', 0, true, NOW(), NOW()),
  ('spec', '100g', 0, true, NOW(), NOW()),
  ('spec', '200g', 1, true, NOW(), NOW()),
  ('spec', '500g', 2, true, NOW(), NOW()),
  ('spec', '1 kg', 3, true, NOW(), NOW())
ON CONFLICT (kind, value) DO NOTHING;
