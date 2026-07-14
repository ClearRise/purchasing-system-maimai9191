import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '@/config/database';
import { CustomerRank } from '@/config/constants';

export interface IRankMarginSettingAttributes {
  id: number;
  rank: CustomerRank;
  defaultMarginRate: number;
  minMarginRate: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export type IRankMarginSettingCreation = Optional<IRankMarginSettingAttributes, 'id' | 'createdAt' | 'updatedAt'>;

class RankMarginSetting extends Model<IRankMarginSettingAttributes, IRankMarginSettingCreation>
  implements IRankMarginSettingAttributes {
  public id!: number;
  public rank!: CustomerRank;
  public defaultMarginRate!: number;
  public minMarginRate!: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

RankMarginSetting.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    rank: {
      type: DataTypes.ENUM('A', 'B', 'C', 'D', 'N'),
      allowNull: false,
    },
    defaultMarginRate: { type: DataTypes.DECIMAL(5, 2), allowNull: false },
    minMarginRate: { type: DataTypes.DECIMAL(5, 2), allowNull: false },
  },
  {
    sequelize,
    tableName: 'rank_margin_settings',
    modelName: 'RankMarginSetting',
    indexes: [{ unique: true, fields: ['rank'], name: 'rank_margin_settings_rank_unique' }],
  }
);

export default RankMarginSetting;
