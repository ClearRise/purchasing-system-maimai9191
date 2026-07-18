import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '@/config/database';

export interface IProductStoreAttributes {
  id: number;
  productId: number;
  storeId: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export type IProductStoreCreation = Optional<IProductStoreAttributes, 'id' | 'createdAt' | 'updatedAt'>;

class ProductStore extends Model<IProductStoreAttributes, IProductStoreCreation>
  implements IProductStoreAttributes {
  public id!: number;
  public productId!: number;
  public storeId!: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

ProductStore.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    productId: { type: DataTypes.INTEGER, allowNull: false },
    storeId: { type: DataTypes.INTEGER, allowNull: false },
  },
  { sequelize, tableName: 'product_stores', modelName: 'ProductStore' }
);

export default ProductStore;
