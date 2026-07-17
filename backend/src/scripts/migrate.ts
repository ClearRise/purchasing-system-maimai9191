/**
 * Manual: npm run migrate  (after build)
 *         npm run migrate:dev
 */
import sequelize, { closeDatabase, ensureSchema } from '@/config/database';
import logger from '@/utils/logger';

async function main() {
  try {
    await sequelize.authenticate();
    await ensureSchema();
    logger.info('Migrations finished.');
  } catch (error) {
    logger.error('Migration failed:', error);
    process.exitCode = 1;
  } finally {
    await closeDatabase();
  }
}

main();
