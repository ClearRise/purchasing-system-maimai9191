import React, { useEffect, useMemo, useState } from 'react';
import { Box, Paper } from '@mui/material';
import OptionListEditor from 'src/components/common/OptionListEditor';
import SpecListEditor from 'src/components/common/SpecListEditor';

export type SpecItem = { value: string; unit: string };

interface ProductSettingsPanelProps {
  units: string[];
  specs: SpecItem[];
  saving?: boolean;
  onUnitsChange: (values: string[]) => void;
  onSpecsChange: (items: SpecItem[]) => void;
  onSaveUnits: () => void;
  onSaveSpecs: () => void;
}

const ProductSettingsPanel: React.FC<ProductSettingsPanelProps> = ({
  units,
  specs,
  saving,
  onUnitsChange,
  onSpecsChange,
  onSaveUnits,
  onSaveSpecs,
}) => {
  const [selectedUnit, setSelectedUnit] = useState(units[0] || '');

  useEffect(() => {
    if (!units.length) {
      setSelectedUnit('');
      return;
    }
    if (!units.includes(selectedUnit)) {
      setSelectedUnit(units[0]);
    }
  }, [units, selectedUnit]);

  const specsForUnit = useMemo(
    () => specs.filter((s) => s.unit === selectedUnit).map((s) => s.value),
    [specs, selectedUnit]
  );

  const countByValue = useMemo(() => {
    const map: Record<string, number> = {};
    for (const u of units) map[u] = 0;
    for (const s of specs) {
      if (map[s.unit] != null) map[s.unit] += 1;
    }
    return map;
  }, [units, specs]);

  const handleUnitsChange = (nextUnits: string[]) => {
    const keep = new Set(nextUnits);
    const nextSpecs = specs.filter((s) => keep.has(s.unit));
    if (units.length === nextUnits.length) {
      const renamed = nextSpecs.map((s) => {
        const idx = units.indexOf(s.unit);
        if (idx >= 0 && units[idx] !== nextUnits[idx]) {
          return { ...s, unit: nextUnits[idx] };
        }
        return s;
      });
      onSpecsChange(renamed);
    } else {
      onSpecsChange(nextSpecs);
    }
    onUnitsChange(nextUnits);
  };

  const handleSpecsForUnitChange = (values: string[]) => {
    if (!selectedUnit) return;
    const others = specs.filter((s) => s.unit !== selectedUnit);
    const nextForUnit = values
      .map((v) => v.trim())
      .filter(Boolean)
      .map((value) => ({ value, unit: selectedUnit }));
    onSpecsChange([...others, ...nextForUnit]);
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: { xs: 'column', md: 'row' },
        gap: 2,
        alignItems: 'stretch',
      }}
    >
      <Paper sx={{ flex: 1, minWidth: 0, p: 2 }}>
        <OptionListEditor
          title="商品単位"
          values={units}
          onChange={handleUnitsChange}
          onSave={onSaveUnits}
          saving={saving}
          placeholder="例: g / kg"
          selectedValue={selectedUnit}
          onSelect={setSelectedUnit}
          countByValue={countByValue}
        />
      </Paper>

      <Paper sx={{ flex: 1, minWidth: 0, p: 2 }}>
        <SpecListEditor
          title="商品規格"
          values={specsForUnit}
          unit={selectedUnit}
          allUnits={units}
          onChange={handleSpecsForUnitChange}
          onSave={onSaveSpecs}
          saving={saving}
        />
      </Paper>
    </Box>
  );
};

export default ProductSettingsPanel;
