import { RankMarginSetting, SystemSetting } from '@/models';
import CustomError from '@/utils/customError';

class SettingsService {
  async getRankMargins() {
    return RankMarginSetting.findAll({ order: [['rank', 'ASC']] });
  }

  async updateRankMargin(rank: string, data: { defaultMarginRate?: number; minMarginRate?: number }) {
    const item = await RankMarginSetting.findOne({ where: { rank: rank as any } });
    if (!item) throw new CustomError('ランク設定が見つかりません', 404);
    await item.update(data);
    return item;
  }

  async getSystemSettings() {
    const rows = await SystemSetting.findAll();
    return Object.fromEntries(rows.map((r) => [r.settingKey, r.settingValue]));
  }

  async updateSystemSettings(settings: Record<string, string>) {
    for (const [key, value] of Object.entries(settings)) {
      const item = await SystemSetting.findOne({ where: { settingKey: key } });
      if (item) await item.update({ settingValue: value });
      else await SystemSetting.create({ settingKey: key, settingValue: value });
    }
    return this.getSystemSettings();
  }
}

export default new SettingsService();
