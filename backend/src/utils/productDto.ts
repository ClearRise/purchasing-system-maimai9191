import type Product from '@/models/Product';
import type Category from '@/models/Category';
import type LookupOption from '@/models/LookupOption';
import type Store from '@/models/Store';
import type Supplier from '@/models/Supplier';

/** API-facing product shape: IDs in DB, familiar strings for clients. */
export function toProductDto(product: Product) {
  const json = product.toJSON() as unknown as Record<string, unknown>;
  const category = (product as any).category as Category | undefined;
  const unitOption = (product as any).unitOption as LookupOption | undefined;
  const specOption = (product as any).specOption as LookupOption | undefined;
  const stores = ((product as any).stores || []) as Store[];
  const suppliers = ((product as any).suppliers || []) as Supplier[];

  const { unitOptionId, specOptionId, categoryId, ...rest } = json;

  return {
    ...rest,
    categoryId: categoryId ?? category?.id ?? null,
    unitOptionId: unitOptionId ?? unitOption?.id ?? null,
    specOptionId: specOptionId ?? specOption?.id ?? null,
    unit: unitOption?.value || '',
    spec: specOption?.value || '',
    categoryLabel: category?.name || '',
    category: category
      ? { id: category.id, name: category.name, categoryCode: category.categoryCode }
      : undefined,
    unitOption: unitOption ? { id: unitOption.id, value: unitOption.value } : undefined,
    specOption: specOption ? { id: specOption.id, value: specOption.value } : undefined,
    stores,
    suppliers,
  };
}

export function toProductDtoList(products: Product[]) {
  return products.map(toProductDto);
}
