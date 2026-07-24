import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '@/config/database';
import { CustomerRank } from '@/config/constants';

/** 得意先 (= former store). One master for customer location + commercial identity. */
export interface IStoreAttributes {
  id: number;
  name: string;
  rank: CustomerRank;
  groupName?: string;
  location?: string;
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

export type IStoreCreation = Optional<
  IStoreAttributes,
  'id' | 'rank' | 'isActive' | 'createdAt' | 'updatedAt'
>;

class Store extends Model<IStoreAttributes, IStoreCreation> implements IStoreAttributes {
  public id!: number;
  public name!: string;
  public rank!: CustomerRank;
  public groupName?: string;
  public location?: string;
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

Store.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    name: { type: DataTypes.STRING(100), allowNull: false },
    rank: {
      type: DataTypes.STRING(1),
      allowNull: false,
      defaultValue: 'C',
    },
    groupName: { type: DataTypes.STRING(100), allowNull: true },
    location: { type: DataTypes.STRING(255), allowNull: true },
    nameKana: { type: DataTypes.STRING(100), allowNull: true },
    nameAbbr: { type: DataTypes.STRING(10), allowNull: true },
    email: { type: DataTypes.STRING(255), allowNull: true },
    ccEmail: { type: DataTypes.STRING(255), allowNull: true, field: 'cc_email' },
    salesUserId: { type: DataTypes.INTEGER, allowNull: true },
    note: { type: DataTypes.TEXT, allowNull: true },
    isActive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  },
  { sequelize, tableName: 'stores', modelName: 'Store' }
);

export default Store;
