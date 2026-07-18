import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '@/config/database';

export interface IProductAttributes {
  id: number;
  orderDisplayName?: string;
  productCode: string;
  companyProductCode?: string;
  name: string;
  contentAmount?: string;
  unitOptionId: number;
  specOptionId?: number | null;
  categoryId?: number | null;
  shelfGroup?: string;
  defaultSupplierId?: number;
  stockTarget?: number;
  sortOrder?: number;
  note?: string;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export type IProductCreation = Optional<
  IProductAttributes,
  'id' | 'specOptionId' | 'categoryId' | 'isActive' | 'createdAt' | 'updatedAt'
>;

class Product extends Model<IProductAttributes, IProductCreation> implements IProductAttributes {
  public id!: number;
  public orderDisplayName?: string;
  public productCode!: string;
  public companyProductCode?: string;
  public name!: string;
  public contentAmount?: string;
  public unitOptionId!: number;
  public specOptionId?: number | null;
  public categoryId?: number | null;
  public shelfGroup?: string;
  public defaultSupplierId?: number;
  public stockTarget?: number;
  public sortOrder?: number;
  public note?: string;
  public isActive!: boolean;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Product.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    orderDisplayName: { type: DataTypes.STRING(100), allowNull: true },
    productCode: { type: DataTypes.STRING(50), allowNull: false },
    companyProductCode: {
      type: DataTypes.STRING(50),
      allowNull: true,
      field: 'ishii_product_code',
    },
    name: { type: DataTypes.STRING(100), allowNull: false },
    contentAmount: { type: DataTypes.STRING(50), allowNull: true },
    unitOptionId: { type: DataTypes.INTEGER, allowNull: false, field: 'unit_option_id' },
    specOptionId: { type: DataTypes.INTEGER, allowNull: true, field: 'spec_option_id' },
    categoryId: { type: DataTypes.INTEGER, allowNull: true },
    shelfGroup: { type: DataTypes.STRING(50), allowNull: true },
    defaultSupplierId: { type: DataTypes.INTEGER, allowNull: true },
    stockTarget: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
    sortOrder: { type: DataTypes.INTEGER, allowNull: true, defaultValue: 0 },
    note: { type: DataTypes.TEXT, allowNull: true },
    isActive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  },
  { sequelize, tableName: 'products', modelName: 'Product' }
);

export default Product;
