-- Unify 得意先 (customers) into stores: store IS the customer.
-- Products stay a global catalog; assortment links remain in product_stores.

-- ---------------------------------------------------------------------------
-- 1. Add commercial (former customer) columns to stores
-- ---------------------------------------------------------------------------
ALTER TABLE stores ADD COLUMN IF NOT EXISTS rank VARCHAR(1) NOT NULL DEFAULT 'C';
ALTER TABLE stores ADD COLUMN IF NOT EXISTS name_kana VARCHAR(100);
ALTER TABLE stores ADD COLUMN IF NOT EXISTS name_abbr VARCHAR(10);
ALTER TABLE stores ADD COLUMN IF NOT EXISTS email VARCHAR(255);
ALTER TABLE stores ADD COLUMN IF NOT EXISTS cc_email VARCHAR(255);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'stores_rank_check'
  ) THEN
    ALTER TABLE stores
      ADD CONSTRAINT stores_rank_check
      CHECK (rank IN ('A', 'B', 'C', 'D', 'N'));
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 2. Backfill store commercial fields from linked customers
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'customer_stores'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'customers'
  ) THEN
    UPDATE stores s
    SET
      rank = COALESCE(c.rank::text, s.rank, 'C'),
      name_kana = COALESCE(s.name_kana, c.name_kana),
      name_abbr = COALESCE(s.name_abbr, c.name_abbr),
      email = COALESCE(s.email, c.email),
      cc_email = COALESCE(s.cc_email, c.cc_email),
      sales_user_id = COALESCE(s.sales_user_id, c.sales_user_id),
      note = COALESCE(NULLIF(trim(s.note), ''), c.note)
    FROM customer_stores cs
    JOIN customers c ON c.id = cs.customer_id
    WHERE cs.store_id = s.id;
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 3. Create stores for orphan customers (no customer_stores link)
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'customers'
  ) THEN
    INSERT INTO stores (
      name, group_name, location, sales_user_id, note, is_active,
      rank, name_kana, name_abbr, email, cc_email,
      created_at, updated_at
    )
    SELECT
      c.name,
      NULL,
      NULL,
      c.sales_user_id,
      c.note,
      COALESCE(c.is_active, true),
      COALESCE(c.rank::text, 'C'),
      c.name_kana,
      c.name_abbr,
      c.email,
      c.cc_email,
      NOW(),
      NOW()
    FROM customers c
    WHERE NOT EXISTS (
      SELECT 1 FROM customer_stores cs WHERE cs.customer_id = c.id
    )
    AND NOT EXISTS (
      SELECT 1 FROM stores s
      WHERE lower(trim(s.name)) = lower(trim(c.name))
    );
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 4. Quotations: drop customer_id (store_id alone is the 得意先)
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'quotations' AND column_name = 'customer_id'
  ) THEN
    -- Prefer linked store when customer_stores exists and quotation store is missing/wrong
    IF EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = 'customer_stores'
    ) THEN
      UPDATE quotations q
      SET store_id = cs.store_id
      FROM customer_stores cs
      WHERE q.customer_id = cs.customer_id
        AND (
          q.store_id IS NULL
          OR NOT EXISTS (SELECT 1 FROM stores s WHERE s.id = q.store_id)
        );
    END IF;

    -- Orphan quotations whose store_id is invalid: map customer → store by name
    IF EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = 'customers'
    ) THEN
      UPDATE quotations q
      SET store_id = s.id
      FROM customers c
      JOIN stores s ON lower(trim(s.name)) = lower(trim(c.name))
      WHERE q.customer_id = c.id
        AND NOT EXISTS (SELECT 1 FROM stores x WHERE x.id = q.store_id);
    END IF;

    -- Drop FK if present, then column
    IF EXISTS (
      SELECT 1 FROM pg_constraint WHERE conname = 'quotations_customer_id_fkey'
    ) THEN
      ALTER TABLE quotations DROP CONSTRAINT quotations_customer_id_fkey;
    END IF;

    ALTER TABLE quotations DROP COLUMN customer_id;
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 5. Drop customer_stores + customers (after data migrated)
-- ---------------------------------------------------------------------------
DROP TABLE IF EXISTS customer_stores;

DROP TABLE IF EXISTS customers;
