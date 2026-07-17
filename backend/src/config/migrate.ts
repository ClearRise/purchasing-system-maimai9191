import fs from 'fs';
import path from 'path';
import sequelize from '@/config/database';
import logger from '@/utils/logger';

function resolveMigrationsDir(): string {
  const candidates = [
    path.join(__dirname, '../../sql/migrations'),
    path.join(process.cwd(), 'sql/migrations'),
    path.join(process.cwd(), 'backend/sql/migrations'),
  ];
  for (const dir of candidates) {
    if (fs.existsSync(dir)) return dir;
  }
  throw new Error(`SQL migrations folder not found. Tried: ${candidates.join(', ')}`);
}

async function ensureMigrationsTable(): Promise<void> {
  await sequelize.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id SERIAL PRIMARY KEY,
      filename VARCHAR(255) NOT NULL UNIQUE,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
}

async function appliedFilenames(): Promise<Set<string>> {
  const [rows] = await sequelize.query(`SELECT filename FROM schema_migrations`);
  return new Set((rows as { filename: string }[]).map((r) => r.filename));
}

/**
 * Apply pending SQL files in backend/sql/migrations/ in name order.
 * Safe for production DBs with real data — each file should be idempotent.
 */
export async function runMigrations(): Promise<void> {
  await ensureMigrationsTable();
  const dir = resolveMigrationsDir();
  const files = fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  const done = await appliedFilenames();

  for (const filename of files) {
    if (done.has(filename)) continue;

    const sql = fs.readFileSync(path.join(dir, filename), 'utf8');
    logger.info(`Applying migration: ${filename}`);

    const tx = await sequelize.transaction();
    try {
      await sequelize.query(sql, { transaction: tx });
      await sequelize.query(
        `INSERT INTO schema_migrations (filename) VALUES (:filename)`,
        { replacements: { filename }, transaction: tx }
      );
      await tx.commit();
      logger.info(`Migration applied: ${filename}`);
    } catch (error) {
      await tx.rollback();
      logger.error(`Migration failed: ${filename}`, error);
      throw error;
    }
  }
}
