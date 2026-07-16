import bcrypt from 'bcrypt';
import { User, RankMarginSetting, SystemSetting, Category, Supplier } from '@/models';
import logger from '@/utils/logger';

export async function seedDatabase(): Promise<void> {
  const adminEmail = 'admin@kaniwaseika.com';
  const admin = await User.findOne({ where: { email: adminEmail } });
  if (!admin) {
    await User.create({
      email: adminEmail,
      username: 'admin',
      password: await bcrypt.hash('Admin123!', 10),
      firstName: '管理者',
      lastName: 'システム',
      role: 'admin',
      isActive: true,
    });
  }

  const margins = [
    { rank: 'A' as const, defaultMarginRate: 15, minMarginRate: 10 },
    { rank: 'B' as const, defaultMarginRate: 20, minMarginRate: 12 },
    { rank: 'C' as const, defaultMarginRate: 25, minMarginRate: 15 },
    { rank: 'D' as const, defaultMarginRate: 30, minMarginRate: 18 },
    { rank: 'N' as const, defaultMarginRate: 35, minMarginRate: 20 },
  ];
  for (const margin of margins) {
    await RankMarginSetting.findOrCreate({ where: { rank: margin.rank }, defaults: margin });
  }

  const settings: Record<string, string> = {
    company_name: '有限会社かにわでは',
    company_tel: '03-6433-3200',
    company_fax: '03-6433-3202',
    order_cutoff_time: '23:00',
    price_increase_alert_pct: '10',
    abnormal_value_alert_pct: '30',
    email_signature: '有限会社かにわでは\nTEL: 03-6433-3200',
  };
  for (const [settingKey, settingValue] of Object.entries(settings)) {
    await SystemSetting.findOrCreate({
      where: { settingKey },
      defaults: { settingKey, settingValue },
    });
  }

  const categories = [
    { categoryCode: 'VEG', name: '野菜', sortOrder: 1 },
    { categoryCode: 'PROC', name: '加工', sortOrder: 2 },
    { categoryCode: 'MUSH', name: 'きのこ', sortOrder: 3 },
    { categoryCode: 'FRUIT', name: '果物', sortOrder: 4 },
  ];
  for (const cat of categories) {
    await Category.findOrCreate({ where: { categoryCode: cat.categoryCode }, defaults: cat });
  }

  for (const name of ['壱永', 'カネダイ', '丸仙', '三成', '神田', '東一', '荏原', 'アスカ', '丸和', '大捨']) {
    await Supplier.findOrCreate({ where: { name }, defaults: { name, isActive: true } });
  }

  logger.info('Database seed completed.');
}
