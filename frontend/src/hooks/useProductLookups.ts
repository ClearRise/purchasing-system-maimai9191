import { useCallback, useEffect, useState } from 'react';
import { api } from 'src/libs/api';
import endpoints from 'src/libs/endpoints';

export type ProductLookups = {
  units: string[];
  specs: string[];
};

const DEFAULT_UNITS = ['PC', 'kg', 'case', 'hon', 'CS', 'tama'];

/** Shared 単位 / 規格 lists from masters/lookup (システム設定で管理). */
export function useProductLookups() {
  const [units, setUnits] = useState<string[]>(DEFAULT_UNITS);
  const [specs, setSpecs] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(endpoints.masters.lookup);
      const data = res.data.data || {};
      setUnits(Array.isArray(data.units) && data.units.length ? data.units : DEFAULT_UNITS);
      setSpecs(Array.isArray(data.specs) ? data.specs : []);
    } catch {
      setUnits(DEFAULT_UNITS);
      setSpecs([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { reload(); }, [reload]);

  return { units, specs, loading, reload };
}
