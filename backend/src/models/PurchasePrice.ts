import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '@/config/database';

export interface IPurchasePriceAttributes {
  id: number;
  targetYearMonth: string;
  productId: number;
  supplierId: number;
  purchasePrice: number;
  unit: string;
  note?: string;
  createdBy: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export type IPurchasePriceCreation = Optional<IPurchasePriceAttributes, 'id' | 'createdAt' | 'updatedAt'>;

class PurchasePrice extends Model<IPurchasePriceAttributes, IPurchasePriceCreation>
  implements IPurchasePriceAttributes {
  public id!: number;
  public targetYearMonth!: string;
  public productId!: number;
  public supplierId!: number;
  public purchasePrice!: number;
  public unit!: string;
  public note?: string;
  public createdBy!: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

PurchasePrice.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    targetYearMonth: { type: DataTypes.STRING(7), allowNull: false },
    productId: { type: DataTypes.INTEGER, allowNull: false },
    supplierId: { type: DataTypes.INTEGER, allowNull: false },
    purchasePrice: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
    unit: { type: DataTypes.STRING(20), allowNull: false },
    note: { type: DataTypes.TEXT, allowNull: true },
    createdBy: { type: DataTypes.INTEGER, allowNull: false },
  },
  { sequelize, tableName: 'purchase_prices', modelName: 'PurchasePrice' }
);

export default PurchasePrice;
