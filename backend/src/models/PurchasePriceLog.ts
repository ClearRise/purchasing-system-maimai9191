import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '@/config/database';

export interface IPurchasePriceLogAttributes {
  id: number;
  purchasePriceId?: number;
  productId: number;
  supplierId: number;
  targetYearMonth: string;
  changeType: 'create' | 'update' | 'delete';
  priceBefore?: number;
  priceAfter: number;
  unit: string;
  changedBy: number;
  changedAt: Date;
  note?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export type IPurchasePriceLogCreation = Optional<
  IPurchasePriceLogAttributes,
  'id' | 'changedAt' | 'createdAt' | 'updatedAt'
>;

class PurchasePriceLog extends Model<IPurchasePriceLogAttributes, IPurchasePriceLogCreation>
  implements IPurchasePriceLogAttributes {
  public id!: number;
  public purchasePriceId?: number;
  public productId!: number;
  public supplierId!: number;
  public targetYearMonth!: string;
  public changeType!: 'create' | 'update' | 'delete';
  public priceBefore?: number;
  public priceAfter!: number;
  public unit!: string;
  public changedBy!: number;
  public changedAt!: Date;
  public note?: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

PurchasePriceLog.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    purchasePriceId: { type: DataTypes.INTEGER, allowNull: true },
    productId: { type: DataTypes.INTEGER, allowNull: false },
    supplierId: { type: DataTypes.INTEGER, allowNull: false },
    targetYearMonth: { type: DataTypes.STRING(7), allowNull: false },
    changeType: {
      type: DataTypes.ENUM('create', 'update', 'delete'),
      allowNull: false,
    },
    priceBefore: { type: DataTypes.DECIMAL(12, 2), allowNull: true },
    priceAfter: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
    unit: { type: DataTypes.STRING(20), allowNull: false },
    changedBy: { type: DataTypes.INTEGER, allowNull: false },
    changedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    note: { type: DataTypes.TEXT, allowNull: true },
  },
  { sequelize, tableName: 'purchase_price_logs', modelName: 'PurchasePriceLog' }
);

export default PurchasePriceLog;
