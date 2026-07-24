import User from './User';
import Supplier from './Supplier';
import Store from './Store';
import Category from './Category';
import Product from './Product';
import ProductStore from './ProductStore';
import ProductSupplier from './ProductSupplier';
import PurchasePrice from './PurchasePrice';
import PurchasePriceLog from './PurchasePriceLog';
import Quotation from './Quotation';
import QuotationLine from './QuotationLine';
import RankMarginSetting from './RankMarginSetting';
import SystemSetting from './SystemSetting';
import LookupOption from './LookupOption';

// User associations
Store.belongsTo(User, { foreignKey: 'salesUserId', as: 'salesUser' });

// Product-Store (得意先) M:N — which products each 得意先 uses
Product.belongsToMany(Store, {
  through: ProductStore,
  foreignKey: 'productId',
  otherKey: 'storeId',
  as: 'stores',
});
Store.belongsToMany(Product, {
  through: ProductStore,
  foreignKey: 'storeId',
  otherKey: 'productId',
  as: 'products',
});

// Category
Product.belongsTo(Category, { foreignKey: 'categoryId', as: 'category', constraints: false });
Category.hasMany(Product, { foreignKey: 'categoryId', as: 'products', constraints: false });

// Product unit / spec lookup options (FKs applied in SQL migrations)
Product.belongsTo(LookupOption, { foreignKey: 'unitOptionId', as: 'unitOption', constraints: false });
Product.belongsTo(LookupOption, { foreignKey: 'specOptionId', as: 'specOption', constraints: false });
LookupOption.hasMany(Product, { foreignKey: 'unitOptionId', as: 'unitProducts', constraints: false });
LookupOption.hasMany(Product, { foreignKey: 'specOptionId', as: 'specProducts', constraints: false });

// Spec → unit relation on lookup_options
LookupOption.belongsTo(LookupOption, {
  foreignKey: 'relatedUnitId',
  as: 'relatedUnit',
  constraints: false,
});
LookupOption.hasMany(LookupOption, {
  foreignKey: 'relatedUnitId',
  as: 'relatedSpecs',
  constraints: false,
});

// Supplier on product
Product.belongsTo(Supplier, { foreignKey: 'defaultSupplierId', as: 'defaultSupplier' });
Product.belongsToMany(Supplier, {
  through: ProductSupplier,
  foreignKey: 'productId',
  otherKey: 'supplierId',
  as: 'suppliers',
});
Supplier.belongsToMany(Product, {
  through: ProductSupplier,
  foreignKey: 'supplierId',
  otherKey: 'productId',
  as: 'products',
});

// Purchase prices
PurchasePrice.belongsTo(Product, { foreignKey: 'productId', as: 'product' });
PurchasePrice.belongsTo(Supplier, { foreignKey: 'supplierId', as: 'supplier' });
PurchasePrice.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });
Product.hasMany(PurchasePrice, { foreignKey: 'productId', as: 'purchasePrices' });

PurchasePriceLog.belongsTo(Product, { foreignKey: 'productId', as: 'product' });
PurchasePriceLog.belongsTo(Supplier, { foreignKey: 'supplierId', as: 'supplier' });
PurchasePriceLog.belongsTo(User, { foreignKey: 'changedBy', as: 'changer' });

// Quotations — storeId is the 得意先
Quotation.belongsTo(Store, { foreignKey: 'storeId', as: 'store' });
Quotation.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });
Quotation.hasMany(QuotationLine, { foreignKey: 'quotationId', as: 'lines' });
QuotationLine.belongsTo(Quotation, { foreignKey: 'quotationId', as: 'quotation' });
QuotationLine.belongsTo(Product, { foreignKey: 'productId', as: 'product' });
QuotationLine.belongsTo(Supplier, { foreignKey: 'supplierId', as: 'supplier' });

export {
  User,
  Supplier,
  Store,
  Category,
  Product,
  ProductStore,
  ProductSupplier,
  PurchasePrice,
  PurchasePriceLog,
  Quotation,
  QuotationLine,
  RankMarginSetting,
  SystemSetting,
  LookupOption,
};

export default {
  User,
  Supplier,
  Store,
  Category,
  Product,
  ProductStore,
  ProductSupplier,
  PurchasePrice,
  PurchasePriceLog,
  Quotation,
  QuotationLine,
  RankMarginSetting,
  SystemSetting,
  LookupOption,
};
