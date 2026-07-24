import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '@/config/database';
import { QuotationStatus } from '@/config/constants';

export interface IQuotationAttributes {
  id: number;
  quotationNo: string;
  storeId: number;
  periodStart: Date;
  periodEnd: Date;
  status: QuotationStatus;
  note?: string;
  createdBy: number;
  sentAt?: Date;
  pdfPath?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export type IQuotationCreation = Optional<IQuotationAttributes, 'id' | 'status' | 'createdAt' | 'updatedAt'>;

class Quotation extends Model<IQuotationAttributes, IQuotationCreation> implements IQuotationAttributes {
  public id!: number;
  public quotationNo!: string;
  public storeId!: number;
  public periodStart!: Date;
  public periodEnd!: Date;
  public status!: QuotationStatus;
  public note?: string;
  public createdBy!: number;
  public sentAt?: Date;
  public pdfPath?: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Quotation.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    quotationNo: { type: DataTypes.STRING(30), allowNull: false },
    storeId: { type: DataTypes.INTEGER, allowNull: false },
    periodStart: { type: DataTypes.DATEONLY, allowNull: false },
    periodEnd: { type: DataTypes.DATEONLY, allowNull: false },
    status: {
      type: DataTypes.ENUM('draft', 'confirmed', 'sent'),
      allowNull: false,
      defaultValue: 'draft',
    },
    note: { type: DataTypes.TEXT, allowNull: true },
    createdBy: { type: DataTypes.INTEGER, allowNull: false },
    sentAt: { type: DataTypes.DATE, allowNull: true },
    pdfPath: { type: DataTypes.STRING(500), allowNull: true },
  },
  {
    sequelize,
    tableName: 'quotations',
    modelName: 'Quotation',
    indexes: [{ unique: true, fields: ['quotation_no'], name: 'quotations_quotation_no_unique' }],
  }
);

export default Quotation;
