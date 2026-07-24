import type Product from '@/models/Product';
import type Category from '@/models/Category';
import type LookupOption from '@/models/LookupOption';
import type Store from '@/models/Store';
import type Supplier from '@/models/Supplier';

/** API-facing product shape: IDs in DB, familiar strings for clients. */
export function toProductDto(product: Product | Record<string, unknown>) {
  const isModel = typeof (product as Product).toJSON === 'function';
  const json = (isModel
    ? (product as Product).toJSON()
    : product) as unknown as Record<string, unknown>;
  const src = product as any;
  const category = (isModel ? src.category : json.category) as Category | undefined;
  const unitOption = (isModel ? src.unitOption : json.unitOption) as LookupOption | undefined;
  const specOption = (isModel ? src.specOption : json.specOption) as LookupOption | undefined;
  const stores = ((isModel ? src.stores : json.stores) || []) as Store[];
  const suppliers = ((isModel ? src.suppliers : json.suppliers) || []) as Supplier[];

  const { unitOptionId, specOptionId, categoryId, ...rest } = json;

  return {
    ...rest,
    categoryId: categoryId ?? category?.id ?? null,
    unitOptionId: unitOptionId ?? unitOption?.id ?? null,
    specOptionId: specOptionId ?? specOption?.id ?? null,
    unit: unitOption?.value || (typeof json.unit === 'string' ? json.unit : '') || '',
    spec: specOption?.value || (typeof json.spec === 'string' ? json.spec : '') || '',
    categoryLabel: category?.name || (typeof json.categoryLabel === 'string' ? json.categoryLabel : '') || '',
    category: category
      ? { id: category.id, name: category.name, categoryCode: category.categoryCode }
      : undefined,
    unitOption: unitOption ? { id: unitOption.id, value: unitOption.value } : undefined,
    specOption: specOption ? { id: specOption.id, value: specOption.value } : undefined,
    stores,
    suppliers,
  };
}

export function toProductDtoList(products: Array<Product | Record<string, unknown>>) {
  return products.map(toProductDto);
}
