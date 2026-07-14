import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '@/config/database';

export interface IStoreAttributes {
  id: number;
  storeCode: string;
  name: string;
  groupName?: string;
  location?: string;
  salesUserId?: number;
  note?: string;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export type IStoreCreation = Optional<IStoreAttributes, 'id' | 'isActive' | 'createdAt' | 'updatedAt'>;

class Store extends Model<IStoreAttributes, IStoreCreation> implements IStoreAttributes {
  public id!: number;
  public storeCode!: string;
  public name!: string;
  public groupName?: string;
  public location?: string;
  public salesUserId?: number;
  public note?: string;
  public isActive!: boolean;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Store.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    storeCode: { type: DataTypes.STRING(20), allowNull: false },
    name: { type: DataTypes.STRING(100), allowNull: false },
    groupName: { type: DataTypes.STRING(100), allowNull: true },
    location: { type: DataTypes.STRING(255), allowNull: true },
    salesUserId: { type: DataTypes.INTEGER, allowNull: true },
    note: { type: DataTypes.TEXT, allowNull: true },
    isActive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  },
  { sequelize, tableName: 'stores', modelName: 'Store' }
);

export default Store;
