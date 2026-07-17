-- Allow managed product units (legacy PostgreSQL ENUM → VARCHAR, keep existing values)
DO $$ BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'products'
      AND column_name = 'unit'
      AND udt_name = 'enum_products_unit'
  ) THEN
    ALTER TABLE products
      ALTER COLUMN unit TYPE VARCHAR(50) USING unit::text;
  END IF;
END $$;

-- Ensure length is enough if already VARCHAR but shorter
DO $$ BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'products'
      AND column_name = 'unit'
      AND data_type = 'character varying'
      AND character_maximum_length IS NOT NULL
      AND character_maximum_length < 50
  ) THEN
    ALTER TABLE products ALTER COLUMN unit TYPE VARCHAR(50);
  END IF;
END $$;
