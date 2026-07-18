import LookupOption, { LOOKUP_KINDS, type LookupKind } from '@/models/LookupOption';
import CustomError from '@/utils/customError';

export type SpecItemInput = { value: string; unit: string };

function assertKind(kind: string): LookupKind {
  if (!(LOOKUP_KINDS as readonly string[]).includes(kind)) {
    throw new CustomError('不正な区分です', 400);
  }
  return kind as LookupKind;
}

function cleanUnique(values: string[]): string[] {
  const unique: string[] = [];
  for (const raw of values) {
    const v = String(raw || '').trim();
    if (!v || unique.includes(v)) continue;
    unique.push(v);
  }
  return unique;
}

class LookupOptionService {
  async listByKind(kind: string, activeOnly = true) {
    const k = assertKind(kind);
    return LookupOption.findAll({
      where: activeOnly ? { kind: k, isActive: true } : { kind: k },
      include: k === 'spec'
        ? [{ model: LookupOption, as: 'relatedUnit', attributes: ['id', 'value'] }]
        : undefined,
      order: [['sortOrder', 'ASC'], ['id', 'ASC']],
    });
  }

  async listGrouped(activeOnly = true) {
    const [units, specs] = await Promise.all([
      this.listByKind('unit', activeOnly),
      this.listByKind('spec', activeOnly),
    ]);
    const unitValues = units.map((r) => r.value);
    const unitById = new Map(units.map((u) => [u.id, u.value]));
    const specItems = specs.map((r) => ({
      value: r.value,
      unit: (r as any).relatedUnit?.value || (r.relatedUnitId ? unitById.get(r.relatedUnitId) : '') || '',
    }));
    const specsByUnit: Record<string, string[]> = {};
    for (const item of specItems) {
      if (!item.unit) continue;
      if (!specsByUnit[item.unit]) specsByUnit[item.unit] = [];
      specsByUnit[item.unit].push(item.value);
    }
    return {
      units: unitValues,
      specs: specItems.map((s) => s.value),
      specItems,
      specsByUnit,
    };
  }

  /** Replace the full unit list (order = array order). Cascades to related specs via relatedUnitId. */
  async replaceUnits(values: string[]) {
    const unique = cleanUnique(values);
    const existing = await LookupOption.findAll({
      where: { kind: 'unit' },
      order: [['sortOrder', 'ASC'], ['id', 'ASC']],
    });

    // Same length → treat as in-place rename/reorder by index
    if (existing.length === unique.length && existing.length > 0) {
      for (let i = 0; i < unique.length; i++) {
        const row = existing[i];
        const next = unique[i];
        if (row.value !== next) {
          await row.update({ value: next, sortOrder: i, isActive: true });
        } else {
          await row.update({ sortOrder: i, isActive: true });
        }
      }
      return this.listByKind('unit', false);
    }

    const keep = new Set(unique);
    for (const row of existing) {
      if (!keep.has(row.value)) {
        await LookupOption.destroy({ where: { kind: 'spec', relatedUnitId: row.id } });
        await row.destroy();
      }
    }

    for (let i = 0; i < unique.length; i++) {
      const value = unique[i];
      const found = existing.find((r) => r.value === value);
      if (found && keep.has(value)) {
        await found.update({ sortOrder: i, isActive: true });
      } else if (!existing.some((r) => r.value === value)) {
        await LookupOption.create({ kind: 'unit', value, sortOrder: i, isActive: true });
      }
    }

    const refreshed = await LookupOption.findAll({ where: { kind: 'unit' } });
    for (let i = 0; i < unique.length; i++) {
      const row = refreshed.find((r) => r.value === unique[i]);
      if (row) await row.update({ sortOrder: i, isActive: true });
    }

    return this.listByKind('unit', false);
  }

  /** Replace full 規格 list with unit relation (by unit value string from UI). */
  async replaceSpecs(items: SpecItemInput[]) {
    const cleaned: SpecItemInput[] = [];
    const seen = new Set<string>();
    for (const raw of items) {
      const value = String(raw?.value || '').trim();
      const unit = String(raw?.unit || '').trim();
      if (!value || !unit || seen.has(value)) continue;
      seen.add(value);
      cleaned.push({ value, unit });
    }

    const unitRows = await this.listByKind('unit', false);
    const unitIdByValue = new Map(unitRows.map((u) => [u.value, u.id]));
    for (const item of cleaned) {
      if (!unitIdByValue.has(item.unit)) {
        throw new CustomError(`規格「${item.value}」の単位「${item.unit}」が単位マスタにありません`, 400);
      }
    }

    const existing = await LookupOption.findAll({ where: { kind: 'spec' } });
    const keep = new Set(cleaned.map((c) => c.value));

    for (const row of existing) {
      if (!keep.has(row.value)) {
        await row.destroy();
      }
    }

    for (let i = 0; i < cleaned.length; i++) {
      const item = cleaned[i];
      const relatedUnitId = unitIdByValue.get(item.unit)!;
      const found = existing.find((r) => r.value === item.value);
      if (found) {
        await found.update({
          relatedUnitId,
          sortOrder: i,
          isActive: true,
        });
      } else {
        await LookupOption.create({
          kind: 'spec',
          value: item.value,
          relatedUnitId,
          sortOrder: i,
          isActive: true,
        });
      }
    }

    return this.listByKind('spec', false);
  }
}

export default new LookupOptionService();
