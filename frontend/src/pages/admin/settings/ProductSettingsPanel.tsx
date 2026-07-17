import React from 'react';
import { Box, Paper } from '@mui/material';
import OptionListEditor from 'src/components/common/OptionListEditor';
import SpecListEditor from 'src/components/common/SpecListEditor';

interface ProductSettingsPanelProps {
  units: string[];
  specs: string[];
  saving?: boolean;
  onUnitsChange: (values: string[]) => void;
  onSpecsChange: (values: string[]) => void;
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
}) => (
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
        onChange={onUnitsChange}
        onSave={onSaveUnits}
        saving={saving}
        placeholder="例: g / kg"
      />
    </Paper>
    <Paper sx={{ flex: 1, minWidth: 0, p: 2 }}>
      <SpecListEditor
        title="商品規格"
        values={specs}
        units={units}
        onChange={onSpecsChange}
        onSave={onSaveSpecs}
        saving={saving}
      />
    </Paper>
  </Box>
);

export default ProductSettingsPanel;
