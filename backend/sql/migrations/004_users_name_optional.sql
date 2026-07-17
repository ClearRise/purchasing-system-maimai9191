-- Allow empty 姓 / 名 on system users
ALTER TABLE users ALTER COLUMN first_name DROP NOT NULL;
ALTER TABLE users ALTER COLUMN last_name DROP NOT NULL;
ALTER TABLE users ALTER COLUMN first_name SET DEFAULT '';
ALTER TABLE users ALTER COLUMN last_name SET DEFAULT '';
