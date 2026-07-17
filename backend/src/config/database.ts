import { Sequelize } from 'sequelize';
import { DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD, DB_DIALECT, DB_SSL, NODE_ENV } from './constants';
import logger from '@/utils/logger';

const sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASSWORD, {
  host: DB_HOST,
  port: DB_PORT,
  dialect: DB_DIALECT as 'postgres',
  logging: NODE_ENV === 'development' ? (msg) => logger.debug(msg) : false,
  dialectOptions: DB_SSL
    ? {
        ssl: {
          require: true,
          rejectUnauthorized: false,
        },
      }
    : {},
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
  define: {
    timestamps: true,
    underscored: true,
    freezeTableName: true,
  },
});

/** Create missing tables from models, then apply SQL migrations (safe for real data). */
export async function ensureSchema(): Promise<void> {
  await import('@/models');
  // Dev: alter to match models. Prod: only create missing tables (no destructive alter).
  await sequelize.sync({ alter: NODE_ENV === 'development' });

  const { runMigrations } = await import('@/config/migrate');
  await runMigrations();

  logger.info('Database schema ready.');
}

export const connectDatabase = async (): Promise<void> => {
  try {
    await sequelize.authenticate();
    logger.info('Database connection established.');

    const { tablesExist, seedDatabase } = await import('@/config/seed');
    const existed = await tablesExist();

    await ensureSchema();

    if (!existed) {
      logger.info('Tables were missing — running initial seed.');
      await seedDatabase(true);
    } else {
      await seedDatabase(false);
    }
  } catch (error) {
    logger.error('Unable to connect to the database:', error);
    throw error;
  }
};

export const closeDatabase = async (): Promise<void> => {
  await sequelize.close();
  logger.info('Database connection closed.');
};

export default sequelize;
