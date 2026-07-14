import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '@/config/database';

export interface IQuotationLineAttributes {
  id: number;
  quotationId: number;
  lineNo: number;
  productId: number;
  categoryCode?: string;
  productName: string;
  spec?: string;
  unit: string;
  purchasePrice: number;
  supplierId?: number;
  rankMarginRate: number;
  autoQuotePrice: number;
  finalQuotePrice: number;
  isVisible: boolean;
  note?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export type IQuotationLineCreation = Optional<IQuotationLineAttributes, 'id' | 'isVisible' | 'createdAt' | 'updatedAt'>;

class QuotationLine extends Model<IQuotationLineAttributes, IQuotationLineCreation>
  implements IQuotationLineAttributes {
  public id!: number;
  public quotationId!: number;
  public lineNo!: number;
  public productId!: number;
  public categoryCode?: string;
  public productName!: string;
  public spec?: string;
  public unit!: string;
  public purchasePrice!: number;
  public supplierId?: number;
  public rankMarginRate!: number;
  public autoQuotePrice!: number;
  public finalQuotePrice!: number;
  public isVisible!: boolean;
  public note?: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

QuotationLine.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    quotationId: { type: DataTypes.INTEGER, allowNull: false },
    lineNo: { type: DataTypes.INTEGER, allowNull: false },
    productId: { type: DataTypes.INTEGER, allowNull: false },
    categoryCode: { type: DataTypes.STRING(20), allowNull: true },
    productName: { type: DataTypes.STRING(100), allowNull: false },
    spec: { type: DataTypes.STRING(50), allowNull: true },
    unit: { type: DataTypes.STRING(20), allowNull: false },
    purchasePrice: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
    supplierId: { type: DataTypes.INTEGER, allowNull: true },
    rankMarginRate: { type: DataTypes.DECIMAL(5, 2), allowNull: false },
    autoQuotePrice: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
    finalQuotePrice: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
    isVisible: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    note: { type: DataTypes.TEXT, allowNull: true },
  },
  { sequelize, tableName: 'quotation_lines', modelName: 'QuotationLine' }
);

export default QuotationLine;
