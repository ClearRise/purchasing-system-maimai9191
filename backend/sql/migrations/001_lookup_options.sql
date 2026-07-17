-- Managed 単位 / 規格 options (システム設定)
-- Safe on existing DBs: create only if missing; do not drop data.

CREATE TABLE IF NOT EXISTS lookup_options (
  id SERIAL PRIMARY KEY,
  kind VARCHAR(20) NOT NULL,
  value VARCHAR(50) NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS lookup_options_kind_value_unique
  ON lookup_options (kind, value);

-- If an older Sequelize ENUM column exists, convert to VARCHAR (keep values)
DO $$ BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'lookup_options'
      AND column_name = 'kind'
      AND udt_name LIKE 'enum_%'
  ) THEN
    ALTER TABLE lookup_options
      ALTER COLUMN kind TYPE VARCHAR(20) USING kind::text;
  END IF;
END $$;
