import fs from 'fs';
import path from 'path';
import bcrypt from 'bcrypt';
import sequelize from '@/config/database';
import logger from '@/utils/logger';

const SQL_DIR = path.join(__dirname, '../../sql');

function readSql(name: string): string {
  return fs.readFileSync(path.join(SQL_DIR, name), 'utf8');
}

export async function seedDatabase(): Promise<void> {
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
