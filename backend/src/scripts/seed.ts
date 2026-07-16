/**
 * Manual seed (run from backend/):
 *   npm run seed          — insert only if empty
 *   npm run seed -- --force
 *   npm run seed:dev      — same, via ts-node (local)
 */
import sequelize, { closeDatabase, ensureSchema } from '@/config/database';
import { seedDatabase } from '@/config/seed';
import logger from '@/utils/logger';

async function main() {
  const force = process.argv.includes('--force');

  try {
    await sequelize.authenticate();
    logger.info('Database connection established.');
    await ensureSchema();
    await seedDatabase(force);
  } catch (error) {
    logger.error('Seed failed:', error);
    process.exitCode = 1;
  } finally {
    await closeDatabase();
  }
}

main();
