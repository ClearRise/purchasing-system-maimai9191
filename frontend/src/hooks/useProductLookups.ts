import { useCallback, useEffect, useState } from 'react';
import { api } from 'src/libs/api';
import endpoints from 'src/libs/endpoints';

export type SpecItem = { value: string; unit: string };

export type ProductLookups = {
  units: string[];
  specs: string[];
  specItems: SpecItem[];
  specsByUnit: Record<string, string[]>;
};

const DEFAULT_UNITS = ['PC', 'kg', 'case', 'hon', 'CS', 'tama'];

/** Shared 単位 / 規格 lists from masters/lookup (システム設定で管理). */
export function useProductLookups() {
  const [units, setUnits] = useState<string[]>(DEFAULT_UNITS);
  const [specs, setSpecs] = useState<string[]>([]);
  const [specItems, setSpecItems] = useState<SpecItem[]>([]);
  const [specsByUnit, setSpecsByUnit] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(endpoints.masters.lookup);
      const data = res.data.data || {};
      setUnits(Array.isArray(data.units) && data.units.length ? data.units : DEFAULT_UNITS);
      setSpecs(Array.isArray(data.specs) ? data.specs : []);
      setSpecItems(Array.isArray(data.specItems) ? data.specItems : []);
      setSpecsByUnit(data.specsByUnit && typeof data.specsByUnit === 'object' ? data.specsByUnit : {});
    } catch {
      setUnits(DEFAULT_UNITS);
      setSpecs([]);
      setSpecItems([]);
      setSpecsByUnit({});
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { reload(); }, [reload]);

  return { units, specs, specItems, specsByUnit, loading, reload };
}
