import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '@/config/database';

export interface ICustomerStoreAttributes {
  id: number;
  customerId: number;
  storeId: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export type ICustomerStoreCreation = Optional<ICustomerStoreAttributes, 'id' | 'createdAt' | 'updatedAt'>;

class CustomerStore extends Model<ICustomerStoreAttributes, ICustomerStoreCreation>
  implements ICustomerStoreAttributes {
  public id!: number;
  public customerId!: number;
  public storeId!: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

CustomerStore.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    customerId: { type: DataTypes.INTEGER, allowNull: false },
    storeId: { type: DataTypes.INTEGER, allowNull: false },
  },
  { sequelize, tableName: 'customer_stores', modelName: 'CustomerStore' }
);

export default CustomerStore;
