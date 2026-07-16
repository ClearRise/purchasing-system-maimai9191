import fs from 'fs';
import path from 'path';
import bcrypt from 'bcrypt';
import sequelize from '@/config/database';
import logger from '@/utils/logger';

function resolveSqlDir(): string {
  const candidates = [
    path.join(__dirname, '../../sql'),
    path.join(process.cwd(), 'sql'),
    path.join(process.cwd(), 'backend/sql'),
  ];
  for (const dir of candidates) {
    if (fs.existsSync(path.join(dir, 'seed.sql'))) return dir;
  }
  throw new Error(`SQL seed folder not found. Tried: ${candidates.join(', ')}`);
}

function readSql(name: string): string {
  return fs.readFileSync(path.join(resolveSqlDir(), name), 'utf8');
}

/** True when core tables already exist. */
export async function tablesExist(): Promise<boolean> {
  const [rows] = await sequelize.query(
    `SELECT to_regclass('public.users') IS NOT NULL AS exists`
  );
  return Boolean((rows as { exists: boolean }[])[0]?.exists);
}

/** True when default admin (or any user) is already present. */
export async function isSeeded(): Promise<boolean> {
  const [rows] = await sequelize.query(`SELECT COUNT(*)::int AS count FROM users`);
  return ((rows as { count: number }[])[0]?.count ?? 0) > 0;
}

export async function seedDatabase(force = false): Promise<void> {
  if (!force && (await isSeeded())) {
    logger.info('Seed skipped (data already exists). Use npm run seed -- --force to re-run.');
    return;
  }

  const password = await bcrypt.hash('Admin123!', 10);

  await sequelize.query(readSql('seed-admin.sql'), {
    replacements: {
      email: 'admin@kaniwaseika.com',
      username: 'admin',
      password,
      firstName: '管理者',
      lastName: 'システム',
    },
  });

  await sequelize.query(readSql('seed.sql'));
  logger.info('Database seed completed.');
}
