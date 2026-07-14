import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '@/config/database';
import { CustomerRank } from '@/config/constants';

export interface ICustomerAttributes {
  id: number;
  name: string;
  rank: CustomerRank;
  nameKana?: string;
  nameAbbr?: string;
  email?: string;
  ccEmail?: string;
  salesUserId?: number;
  note?: string;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export type ICustomerCreation = Optional<ICustomerAttributes, 'id' | 'isActive' | 'createdAt' | 'updatedAt'>;

class Customer extends Model<ICustomerAttributes, ICustomerCreation> implements ICustomerAttributes {
  public id!: number;
  public name!: string;
  public rank!: CustomerRank;
  public nameKana?: string;
  public nameAbbr?: string;
  public email?: string;
  public ccEmail?: string;
  public salesUserId?: number;
  public note?: string;
  public isActive!: boolean;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Customer.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    name: { type: DataTypes.STRING(100), allowNull: false },
    rank: {
      type: DataTypes.ENUM('A', 'B', 'C', 'D', 'N'),
      allowNull: false,
      defaultValue: 'C',
    },
    nameKana: { type: DataTypes.STRING(100), allowNull: true },
    nameAbbr: { type: DataTypes.STRING(10), allowNull: true },
    email: { type: DataTypes.STRING(255), allowNull: true },
    ccEmail: { type: DataTypes.STRING(255), allowNull: true },
    salesUserId: { type: DataTypes.INTEGER, allowNull: true },
    note: { type: DataTypes.TEXT, allowNull: true },
    isActive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  },
  { sequelize, tableName: 'customers', modelName: 'Customer' }
);

export default Customer;
