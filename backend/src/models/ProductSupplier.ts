import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '@/config/database';

export interface IProductSupplierAttributes {
  id: number;
  productId: number;
  supplierId: number;
  sortOrder?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export type IProductSupplierCreation = Optional<IProductSupplierAttributes, 'id' | 'createdAt' | 'updatedAt'>;

class ProductSupplier extends Model<IProductSupplierAttributes, IProductSupplierCreation>
  implements IProductSupplierAttributes {
  public id!: number;
  public productId!: number;
  public supplierId!: number;
  public sortOrder?: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

ProductSupplier.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    productId: { type: DataTypes.INTEGER, allowNull: false },
    supplierId: { type: DataTypes.INTEGER, allowNull: false },
    sortOrder: { type: DataTypes.INTEGER, allowNull: true, defaultValue: 0 },
  },
  { sequelize, tableName: 'product_suppliers', modelName: 'ProductSupplier' }
);

export default ProductSupplier;
