import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '@/config/database';

export interface IProductAttributes {
  id: number;
  storeId: number;
  orderDisplayName?: string;
  productCode: string;
  companyProductCode?: string;
  name: string;
  spec?: string;
  specUnit?: string;
  contentAmount?: string;
  unit: string;
  categoryId?: number;
  categoryLabel?: string;
  shelfGroup?: string;
  defaultSupplierId?: number;
  stockTarget?: number;
  sortOrder?: number;
  note?: string;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export type IProductCreation = Optional<IProductAttributes, 'id' | 'isActive' | 'createdAt' | 'updatedAt'>;

class Product extends Model<IProductAttributes, IProductCreation> implements IProductAttributes {
  public id!: number;
  public storeId!: number;
  public orderDisplayName?: string;
  public productCode!: string;
  public companyProductCode?: string;
  public name!: string;
  public spec?: string;
  public specUnit?: string;
  public contentAmount?: string;
  public unit!: string;
  public categoryId?: number;
  public categoryLabel?: string;
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
    storeId: { type: DataTypes.INTEGER, allowNull: false },
    orderDisplayName: { type: DataTypes.STRING(100), allowNull: true },
    productCode: { type: DataTypes.STRING(50), allowNull: false },
    companyProductCode: {
      type: DataTypes.STRING(50),
      allowNull: true,
      field: 'ishii_product_code',
    },
    name: { type: DataTypes.STRING(100), allowNull: false },
    spec: { type: DataTypes.STRING(50), allowNull: true },
    specUnit: { type: DataTypes.STRING(20), allowNull: true },
    contentAmount: { type: DataTypes.STRING(50), allowNull: true },
    unit: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: 'PC',
    },
    categoryId: { type: DataTypes.INTEGER, allowNull: true },
    categoryLabel: { type: DataTypes.STRING(50), allowNull: true },
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
