import { DataTypes, Model } from 'sequelize';
import sequelize from '@/config/database';
import { IUserAttributes, IUserCreationAttributes } from '@/types';

class User extends Model<IUserAttributes, IUserCreationAttributes> implements IUserAttributes {
  public id!: number;
  public email!: string;
  public username!: string;
  public password!: string;
  public firstName!: string;
  public lastName!: string;
  public role!: IUserAttributes['role'];
  public isActive!: boolean;
  public lastLogin?: Date;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  public getFullName(): string {
    return `${this.lastName} ${this.firstName}`;
  }
}

User.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    email: { type: DataTypes.STRING(255), allowNull: false },
    username: { type: DataTypes.STRING(50), allowNull: false },
    password: { type: DataTypes.STRING(255), allowNull: false },
    firstName: { type: DataTypes.STRING(100), allowNull: false },
    lastName: { type: DataTypes.STRING(100), allowNull: false },
    role: {
      type: DataTypes.ENUM('admin', 'purchase', 'sales'),
      allowNull: false,
      defaultValue: 'sales',
    },
    isActive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    lastLogin: { type: DataTypes.DATE, allowNull: true },
  },
  {
    sequelize,
    tableName: 'users',
    modelName: 'User',
    indexes: [
      { unique: true, fields: ['email'], name: 'users_email_unique' },
      { unique: true, fields: ['username'], name: 'users_username_unique' },
    ],
  }
);

export default User;
