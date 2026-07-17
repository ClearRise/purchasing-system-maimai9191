import React from 'react';
import { Box, Paper, TextField, Button, Divider } from '@mui/material';
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined';
import PanelHeader from 'src/components/common/PanelHeader';

const ALERT_FIELDS = ['price_increase_alert_pct', 'abnormal_value_alert_pct'] as const;

const SETTING_LABELS: Record<string, string> = {
  price_increase_alert_pct: '価格上昇アラート (%)',
  abnormal_value_alert_pct: '異常値アラート (%)',
};

interface OtherSettingsPanelProps {
  settings: Record<string, string>;
  onChange: (key: string, value: string) => void;
  onSave: () => void;
}

const OtherSettingsPanel: React.FC<OtherSettingsPanelProps> = ({
  settings,
  onChange,
  onSave,
}) => (
  <Paper>
    <PanelHeader
      title="アラート設定"
      action={
        <Button variant="contained" size="small" startIcon={<SaveOutlinedIcon />} onClick={onSave}>
          保存
        </Button>
      }
    />
    <Divider />
    <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 2, maxWidth: 420 }}>
      {ALERT_FIELDS.map((key) => (
        <TextField
          key={key}
          label={SETTING_LABELS[key]}
          type="number"
          value={settings[key] || ''}
          onChange={(e) => onChange(key, e.target.value)}
          fullWidth
          size="small"
        />
      ))}
    </Box>
  </Paper>
);

export default OtherSettingsPanel;
