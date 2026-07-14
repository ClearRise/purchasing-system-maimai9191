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

export const connectDatabase = async (): Promise<void> => {
  try {
    await sequelize.authenticate();
    logger.info('Database connection established.');

    if (NODE_ENV === 'development') {
      await sequelize.sync({ alter: true });
      logger.info('Database models synchronized.');
      const { seedDatabase } = await import('@/config/seed');
      await seedDatabase();
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
