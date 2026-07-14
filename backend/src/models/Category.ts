import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '@/config/database';

export interface ICategoryAttributes {
  id: number;
  categoryCode: string;
  name: string;
  sortOrder?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export type ICategoryCreation = Optional<ICategoryAttributes, 'id' | 'createdAt' | 'updatedAt'>;

class Category extends Model<ICategoryAttributes, ICategoryCreation> implements ICategoryAttributes {
  public id!: number;
  public categoryCode!: string;
  public name!: string;
  public sortOrder?: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Category.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    categoryCode: { type: DataTypes.STRING(20), allowNull: false },
    name: { type: DataTypes.STRING(50), allowNull: false },
    sortOrder: { type: DataTypes.INTEGER, allowNull: true, defaultValue: 0 },
  },
  {
    sequelize,
    tableName: 'categories',
    modelName: 'Category',
    indexes: [{ unique: true, fields: ['category_code'], name: 'categories_category_code_unique' }],
  }
);

export default Category;
