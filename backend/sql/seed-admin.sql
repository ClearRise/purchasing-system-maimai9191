-- Admin user (password hash passed from seed.ts)
INSERT INTO users (email, username, password, first_name, last_name, role, is_active, created_at, updated_at)
SELECT :email, :username, :password, :firstName, :lastName, 'admin', true, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = :email);
