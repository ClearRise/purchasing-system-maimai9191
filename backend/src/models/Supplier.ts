import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '@/config/database';

export interface ISupplierAttributes {
  id: number;
  name: string;
  shortName?: string;
  address?: string;
  phone?: string;
  fax?: string;
  email?: string;
  contactPerson?: string;
  note?: string;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export type ISupplierCreation = Optional<ISupplierAttributes, 'id' | 'isActive' | 'createdAt' | 'updatedAt'>;

class Supplier extends Model<ISupplierAttributes, ISupplierCreation> implements ISupplierAttributes {
  public id!: number;
  public name!: string;
  public shortName?: string;
  public address?: string;
  public phone?: string;
  public fax?: string;
  public email?: string;
  public contactPerson?: string;
  public note?: string;
  public isActive!: boolean;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Supplier.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    name: { type: DataTypes.STRING(100), allowNull: false },
    shortName: { type: DataTypes.STRING(20), allowNull: true },
    address: { type: DataTypes.STRING(255), allowNull: true },
    phone: { type: DataTypes.STRING(20), allowNull: true },
    fax: { type: DataTypes.STRING(20), allowNull: true },
    email: { type: DataTypes.STRING(255), allowNull: true },
    contactPerson: { type: DataTypes.STRING(50), allowNull: true },
    note: { type: DataTypes.TEXT, allowNull: true },
    isActive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  },
  { sequelize, tableName: 'suppliers', modelName: 'Supplier' }
);

export default Supplier;
