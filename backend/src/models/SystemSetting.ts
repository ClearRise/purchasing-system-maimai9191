import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '@/config/database';

export interface ISystemSettingAttributes {
  id: number;
  settingKey: string;
  settingValue: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export type ISystemSettingCreation = Optional<ISystemSettingAttributes, 'id' | 'createdAt' | 'updatedAt'>;

class SystemSetting extends Model<ISystemSettingAttributes, ISystemSettingCreation>
  implements ISystemSettingAttributes {
  public id!: number;
  public settingKey!: string;
  public settingValue!: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

SystemSetting.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    settingKey: { type: DataTypes.STRING(100), allowNull: false },
    settingValue: { type: DataTypes.TEXT, allowNull: false },
  },
  {
    sequelize,
    tableName: 'system_settings',
    modelName: 'SystemSetting',
    indexes: [{ unique: true, fields: ['setting_key'], name: 'system_settings_setting_key_unique' }],
  }
);

export default SystemSetting;
