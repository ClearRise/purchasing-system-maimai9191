-- Remove 店舗CD (store_code) from stores
ALTER TABLE stores DROP COLUMN IF EXISTS store_code;
