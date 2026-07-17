import LookupOption, { LOOKUP_KINDS, type LookupKind } from '@/models/LookupOption';
import CustomError from '@/utils/customError';

function assertKind(kind: string): LookupKind {
  if (!(LOOKUP_KINDS as readonly string[]).includes(kind)) {
    throw new CustomError('不正な区分です', 400);
  }
  return kind as LookupKind;
}

class LookupOptionService {
  async listByKind(kind: string, activeOnly = true) {
    const k = assertKind(kind);
    return LookupOption.findAll({
      where: activeOnly ? { kind: k, isActive: true } : { kind: k },
      order: [['sortOrder', 'ASC'], ['id', 'ASC']],
    });
  }

  async listGrouped(activeOnly = true) {
    const [units, specs] = await Promise.all([
      this.listByKind('unit', activeOnly),
      this.listByKind('spec', activeOnly),
    ]);
    return {
      units: units.map((r) => r.value),
      specs: specs.map((r) => r.value),
    };
  }

  /** Replace the full list for a kind (order = array order). */
  async replaceKind(kind: string, values: string[]) {
    const k = assertKind(kind);
    const cleaned = values
      .map((v) => String(v || '').trim())
      .filter(Boolean);

    const unique: string[] = [];
    for (const v of cleaned) {
      if (!unique.includes(v)) unique.push(v);
    }

    const existing = await LookupOption.findAll({ where: { kind: k } });
    const keep = new Set(unique);

    for (const row of existing) {
      if (!keep.has(row.value)) {
        await row.destroy();
      }
    }

    for (let i = 0; i < unique.length; i++) {
      const value = unique[i];
      const found = existing.find((r) => r.value === value);
      if (found) {
        await found.update({ sortOrder: i, isActive: true });
      } else {
        await LookupOption.create({ kind: k, value, sortOrder: i, isActive: true });
      }
    }

    return this.listByKind(k, false);
  }
}

export default new LookupOptionService();
