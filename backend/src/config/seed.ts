import bcrypt from 'bcrypt';
import { User, RankMarginSetting, SystemSetting, Category, Supplier } from '@/models';
import logger from '@/utils/logger';

const COMPANY_NAME = '有限会社かにわでは';
const ADMIN_EMAIL = 'admin@kaniwa.local';
const LEGACY_ADMIN_EMAIL = 'admin@ishii.local';

const DEFAULT_MARGINS = [
  { rank: 'A' as const, defaultMarginRate: 15, minMarginRate: 10 },
  { rank: 'B' as const, defaultMarginRate: 20, minMarginRate: 12 },
  { rank: 'C' as const, defaultMarginRate: 25, minMarginRate: 15 },
  { rank: 'D' as const, defaultMarginRate: 30, minMarginRate: 18 },
  { rank: 'N' as const, defaultMarginRate: 35, minMarginRate: 20 },
];

const DEFAULT_SETTINGS: Record<string, string> = {
  price_increase_alert_pct: '10',
  abnormal_value_alert_pct: '30',
  company_name: COMPANY_NAME,
  company_tel: '03-6433-3200',
  company_fax: '03-6433-3202',
  order_cutoff_time: '23:00',
  email_signature: `${COMPANY_NAME}\nTEL: 03-6433-3200`,
};

const BRANDING_SETTING_KEYS = new Set(['company_name', 'email_signature']);

const DEFAULT_CATEGORIES = [
  { categoryCode: 'VEG', name: '野菜', sortOrder: 1 },
  { categoryCode: 'PROC', name: '加工', sortOrder: 2 },
  { categoryCode: 'MUSH', name: 'きのこ', sortOrder: 3 },
  { categoryCode: 'FRUIT', name: '果物', sortOrder: 4 },
];

const DEFAULT_SUPPLIERS = [
  '壱永', 'カネダイ', '丸仙', '三成', '神田', '東一', '荏原', 'アスカ', '丸和', '大捨',
];

export async function seedDatabase(): Promise<void> {
  const legacyAdmin = await User.findOne({ where: { email: LEGACY_ADMIN_EMAIL } });
  if (legacyAdmin) {
    await legacyAdmin.update({ email: ADMIN_EMAIL });
    logger.info(`Migrated admin email ${LEGACY_ADMIN_EMAIL} → ${ADMIN_EMAIL}`);
  }

  const adminExists = await User.findOne({ where: { email: ADMIN_EMAIL } });
  if (!adminExists) {
    const password = await bcrypt.hash('Admin123!', 10);
    await User.create({
      email: ADMIN_EMAIL,
      username: 'admin',
      password,
      firstName: '管理者',
      lastName: 'システム',
      role: 'admin',
      isActive: true,
    });
    logger.info(`Seeded admin user (${ADMIN_EMAIL} / Admin123!)`);
  }

  for (const margin of DEFAULT_MARGINS) {
    await RankMarginSetting.findOrCreate({
      where: { rank: margin.rank },
      defaults: margin,
    });
  }

  for (const [key, value] of Object.entries(DEFAULT_SETTINGS)) {
    const [setting, created] = await SystemSetting.findOrCreate({
      where: { settingKey: key },
      defaults: { settingKey: key, settingValue: value },
    });
    if (!created && BRANDING_SETTING_KEYS.has(key) && /イシイ|ishii/i.test(setting.settingValue || '')) {
      await setting.update({ settingValue: value });
      logger.info(`Updated system setting ${key} to new company branding`);
    }
  }

  for (const cat of DEFAULT_CATEGORIES) {
    await Category.findOrCreate({
      where: { categoryCode: cat.categoryCode },
      defaults: cat,
    });
  }

  for (const name of DEFAULT_SUPPLIERS) {
    await Supplier.findOrCreate({
      where: { name },
      defaults: { name, isActive: true },
    });
  }

  logger.info('Database seed completed.');
}
