-- Shared product catalog: products ↔ stores M:N via product_stores.
-- Prices stay keyed by product + supplier + month (no store dimension).

CREATE TABLE IF NOT EXISTS product_stores (
  id SERIAL PRIMARY KEY,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  store_id INTEGER NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (product_id, store_id)
);

CREATE INDEX IF NOT EXISTS idx_product_stores_store_id ON product_stores (store_id);
CREATE INDEX IF NOT EXISTS idx_product_stores_product_id ON product_stores (product_id);

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'products'
      AND column_name = 'store_id'
  ) THEN
    -- Backfill links from legacy products.store_id
    INSERT INTO product_stores (product_id, store_id, created_at, updated_at)
    SELECT p.id, p.store_id, COALESCE(p.created_at, NOW()), COALESCE(p.updated_at, NOW())
    FROM products p
    WHERE p.store_id IS NOT NULL
    ON CONFLICT (product_id, store_id) DO NOTHING;

    -- Merge duplicate product names into the lowest id (shared catalog)
    CREATE TEMP TABLE tmp_product_keep ON COMMIT DROP AS
    SELECT
      p.id AS product_id,
      MIN(p.id) OVER (PARTITION BY lower(trim(p.name))) AS keep_id
    FROM products p;

    -- Ensure keep product is linked to every store the duplicates used
    INSERT INTO product_stores (product_id, store_id, created_at, updated_at)
    SELECT DISTINCT k.keep_id, ps.store_id, NOW(), NOW()
    FROM product_stores ps
    JOIN tmp_product_keep k ON k.product_id = ps.product_id
    WHERE k.product_id <> k.keep_id
    ON CONFLICT (product_id, store_id) DO NOTHING;

    -- Drop conflicting price rows on duplicates, then remap
    DELETE FROM purchase_prices pp
    USING tmp_product_keep k
    WHERE pp.product_id = k.product_id
      AND k.product_id <> k.keep_id
      AND EXISTS (
        SELECT 1
        FROM purchase_prices keep_pp
        WHERE keep_pp.product_id = k.keep_id
          AND keep_pp.supplier_id = pp.supplier_id
          AND keep_pp.target_year_month = pp.target_year_month
      );

    UPDATE purchase_prices pp
    SET product_id = k.keep_id
    FROM tmp_product_keep k
    WHERE pp.product_id = k.product_id
      AND k.product_id <> k.keep_id;

    UPDATE purchase_price_logs pl
    SET product_id = k.keep_id
    FROM tmp_product_keep k
    WHERE pl.product_id = k.product_id
      AND k.product_id <> k.keep_id;

    -- Remap suppliers (drop duplicates that would conflict)
    DELETE FROM product_suppliers ps
    USING tmp_product_keep k
    WHERE ps.product_id = k.product_id
      AND k.product_id <> k.keep_id
      AND EXISTS (
        SELECT 1
        FROM product_suppliers keep_ps
        WHERE keep_ps.product_id = k.keep_id
          AND keep_ps.supplier_id = ps.supplier_id
      );

    UPDATE product_suppliers ps
    SET product_id = k.keep_id
    FROM tmp_product_keep k
    WHERE ps.product_id = k.product_id
      AND k.product_id <> k.keep_id;

    UPDATE quotation_lines ql
    SET product_id = k.keep_id
    FROM tmp_product_keep k
    WHERE ql.product_id = k.product_id
      AND k.product_id <> k.keep_id;

    -- Remove duplicate store links pointing at non-keep products
    DELETE FROM product_stores ps
    USING tmp_product_keep k
    WHERE ps.product_id = k.product_id
      AND k.product_id <> k.keep_id;

    -- Soft-delete merged duplicates
    UPDATE products p
    SET is_active = false,
        updated_at = NOW()
    FROM tmp_product_keep k
    WHERE p.id = k.product_id
      AND k.product_id <> k.keep_id;

    ALTER TABLE products DROP COLUMN store_id;
  END IF;
END $$;

-- One price per product × supplier × month
CREATE UNIQUE INDEX IF NOT EXISTS uq_purchase_prices_month_product_supplier
  ON purchase_prices (target_year_month, product_id, supplier_id);
