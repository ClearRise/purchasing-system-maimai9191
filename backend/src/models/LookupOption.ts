import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '@/config/database';

export const LOOKUP_KINDS = ['unit', 'spec'] as const;
export type LookupKind = (typeof LOOKUP_KINDS)[number];

export interface ILookupOptionAttributes {
  id: number;
  kind: LookupKind;
  value: string;
  /** For kind=spec: FK to the 単位 lookup_options row */
  relatedUnitId?: number | null;
  sortOrder: number;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export type ILookupOptionCreation = Optional<
  ILookupOptionAttributes,
  'id' | 'relatedUnitId' | 'sortOrder' | 'isActive' | 'createdAt' | 'updatedAt'
>;

class LookupOption extends Model<ILookupOptionAttributes, ILookupOptionCreation>
  implements ILookupOptionAttributes {
  public id!: number;
  public kind!: LookupKind;
  public value!: string;
  public relatedUnitId?: number | null;
  public sortOrder!: number;
  public isActive!: boolean;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

LookupOption.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    kind: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    value: { type: DataTypes.STRING(50), allowNull: false },
    relatedUnitId: { type: DataTypes.INTEGER, allowNull: true, field: 'related_unit_id' },
    sortOrder: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    isActive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  },
  {
    sequelize,
    tableName: 'lookup_options',
    modelName: 'LookupOption',
    indexes: [
      { unique: true, fields: ['kind', 'value'], name: 'lookup_options_kind_value_unique' },
    ],
  }
);

export default LookupOption;
