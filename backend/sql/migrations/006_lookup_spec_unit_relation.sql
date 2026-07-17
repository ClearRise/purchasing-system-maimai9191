-- Link 規格 (spec) to 単位 (unit) via related_value
ALTER TABLE lookup_options
  ADD COLUMN IF NOT EXISTS related_value VARCHAR(50);

-- Backfill known pack-size specs
UPDATE lookup_options
SET related_value = 'g'
WHERE kind = 'spec'
  AND related_value IS NULL
  AND value ~ '^[0-9]+(\.[0-9]+)?g$';

UPDATE lookup_options
SET related_value = 'kg'
WHERE kind = 'spec'
  AND related_value IS NULL
  AND (
    value ~ '^[0-9]+(\.[0-9]+)?[[:space:]]*kg$'
    OR value ~ '^[0-9]+(\.[0-9]+)?kg$'
  );

UPDATE lookup_options
SET related_value = 'ml'
WHERE kind = 'spec'
  AND related_value IS NULL
  AND value ~ '^[0-9]+(\.[0-9]+)?ml$';

UPDATE lookup_options
SET related_value = 'L'
WHERE kind = 'spec'
  AND related_value IS NULL
  AND value ~ '^[0-9]+(\.[0-9]+)?[[:space:]]*L$';

CREATE INDEX IF NOT EXISTS lookup_options_kind_related_idx
  ON lookup_options (kind, related_value);
