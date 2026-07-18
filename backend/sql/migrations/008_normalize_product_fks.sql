-- Normalize products/lookups to ID-based FKs while preserving existing data.

-- ---------------------------------------------------------------------------
-- 1. Categories: ensure defaults, backfill category_id, drop category_label
-- ---------------------------------------------------------------------------
INSERT INTO categories (category_code, name, sort_order, created_at, updated_at)
VALUES
  ('VEG', '野菜', 1, NOW(), NOW()),
  ('PROC', '加工', 2, NOW(), NOW()),
  ('MUSH', 'きのこ', 3, NOW(), NOW()),
  ('FRUIT', '果物', 4, NOW(), NOW())
ON CONFLICT (category_code) DO NOTHING;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'category_label'
  ) THEN
    -- Match existing categories by name or code
    UPDATE products p
    SET category_id = c.id
    FROM categories c
    WHERE p.category_id IS NULL
      AND p.category_label IS NOT NULL
      AND trim(p.category_label) <> ''
      AND (
        lower(trim(p.category_label)) = lower(trim(c.name))
        OR lower(trim(p.category_label)) = lower(trim(c.category_code))
      );

    -- Create categories for orphan labels
    INSERT INTO categories (category_code, name, sort_order, created_at, updated_at)
    SELECT
      left('C' || substr(md5(lower(trim(p.category_label))), 1, 8), 20),
      left(trim(p.category_label), 50),
      100,
      NOW(),
      NOW()
    FROM products p
    WHERE p.category_id IS NULL
      AND p.category_label IS NOT NULL
      AND trim(p.category_label) <> ''
      AND NOT EXISTS (
        SELECT 1 FROM categories c
        WHERE lower(trim(c.name)) = lower(trim(p.category_label))
      )
    GROUP BY lower(trim(p.category_label)), trim(p.category_label);

    UPDATE products p
    SET category_id = c.id
    FROM categories c
    WHERE p.category_id IS NULL
      AND p.category_label IS NOT NULL
      AND trim(p.category_label) <> ''
      AND lower(trim(p.category_label)) = lower(trim(c.name));

    ALTER TABLE products DROP COLUMN category_label;
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 2. Lookup options: related_unit_id FK
-- ---------------------------------------------------------------------------
ALTER TABLE lookup_options
  ADD COLUMN IF NOT EXISTS related_unit_id INTEGER NULL
  REFERENCES lookup_options(id) ON DELETE SET NULL;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'lookup_options' AND column_name = 'related_value'
  ) THEN
    UPDATE lookup_options s
    SET related_unit_id = u.id
    FROM lookup_options u
    WHERE s.kind = 'spec'
      AND s.related_unit_id IS NULL
      AND s.related_value IS NOT NULL
      AND u.kind = 'unit'
      AND u.value = s.related_value;

    ALTER TABLE lookup_options DROP COLUMN related_value;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_lookup_options_related_unit_id
  ON lookup_options (related_unit_id);

-- ---------------------------------------------------------------------------
-- 3. Products: unit_option_id / spec_option_id
-- ---------------------------------------------------------------------------
ALTER TABLE products ADD COLUMN IF NOT EXISTS unit_option_id INTEGER NULL;
ALTER TABLE products ADD COLUMN IF NOT EXISTS spec_option_id INTEGER NULL;

-- Ensure default PC unit exists
INSERT INTO lookup_options (kind, value, sort_order, is_active, created_at, updated_at)
SELECT 'unit', 'PC', 0, true, NOW(), NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM lookup_options WHERE kind = 'unit' AND value = 'PC'
);

DO $$
BEGIN
  -- Backfill units from products.unit string
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'unit'
  ) THEN
    INSERT INTO lookup_options (kind, value, sort_order, is_active, created_at, updated_at)
    SELECT DISTINCT 'unit', left(trim(p.unit), 50), 50, true, NOW(), NOW()
    FROM products p
    WHERE p.unit IS NOT NULL
      AND trim(p.unit) <> ''
      AND NOT EXISTS (
        SELECT 1 FROM lookup_options u
        WHERE u.kind = 'unit' AND u.value = trim(p.unit)
      );

    UPDATE products p
    SET unit_option_id = u.id
    FROM lookup_options u
    WHERE p.unit_option_id IS NULL
      AND u.kind = 'unit'
      AND u.value = trim(p.unit);

    -- Fallback for any remaining
    UPDATE products
    SET unit_option_id = (SELECT id FROM lookup_options WHERE kind = 'unit' AND value = 'PC' LIMIT 1)
    WHERE unit_option_id IS NULL;

    ALTER TABLE products DROP COLUMN unit;
  END IF;

  -- Backfill specs from products.spec string
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'spec'
  ) THEN
    INSERT INTO lookup_options (kind, value, related_unit_id, sort_order, is_active, created_at, updated_at)
    SELECT DISTINCT
      'spec',
      left(trim(p.spec), 50),
      p.unit_option_id,
      50,
      true,
      NOW(),
      NOW()
    FROM products p
    WHERE p.spec IS NOT NULL
      AND trim(p.spec) <> ''
      AND NOT EXISTS (
        SELECT 1 FROM lookup_options s
        WHERE s.kind = 'spec' AND s.value = trim(p.spec)
      );

    UPDATE products p
    SET spec_option_id = s.id
    FROM lookup_options s
    WHERE p.spec_option_id IS NULL
      AND p.spec IS NOT NULL
      AND trim(p.spec) <> ''
      AND s.kind = 'spec'
      AND s.value = trim(p.spec);

    ALTER TABLE products DROP COLUMN spec;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'spec_unit'
  ) THEN
    ALTER TABLE products DROP COLUMN spec_unit;
  END IF;
END $$;

-- Enforce unit_option_id NOT NULL after backfill
UPDATE products
SET unit_option_id = (SELECT id FROM lookup_options WHERE kind = 'unit' AND value = 'PC' LIMIT 1)
WHERE unit_option_id IS NULL;

ALTER TABLE products
  ALTER COLUMN unit_option_id SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'products_unit_option_id_fkey'
  ) THEN
    ALTER TABLE products
      ADD CONSTRAINT products_unit_option_id_fkey
      FOREIGN KEY (unit_option_id) REFERENCES lookup_options(id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'products_spec_option_id_fkey'
  ) THEN
    ALTER TABLE products
      ADD CONSTRAINT products_spec_option_id_fkey
      FOREIGN KEY (spec_option_id) REFERENCES lookup_options(id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'products_category_id_fkey'
  ) THEN
    ALTER TABLE products
      ADD CONSTRAINT products_category_id_fkey
      FOREIGN KEY (category_id) REFERENCES categories(id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_products_unit_option_id ON products (unit_option_id);
CREATE INDEX IF NOT EXISTS idx_products_spec_option_id ON products (spec_option_id);
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products (category_id);

-- ---------------------------------------------------------------------------
-- 4. Junction uniques (dedupe first)
-- ---------------------------------------------------------------------------
DELETE FROM product_suppliers a
USING product_suppliers b
WHERE a.id > b.id
  AND a.product_id = b.product_id
  AND a.supplier_id = b.supplier_id;

CREATE UNIQUE INDEX IF NOT EXISTS uq_product_suppliers_product_supplier
  ON product_suppliers (product_id, supplier_id);

DELETE FROM customer_stores a
USING customer_stores b
WHERE a.id > b.id
  AND a.customer_id = b.customer_id
  AND a.store_id = b.store_id;

CREATE UNIQUE INDEX IF NOT EXISTS uq_customer_stores_customer_store
  ON customer_stores (customer_id, store_id);
