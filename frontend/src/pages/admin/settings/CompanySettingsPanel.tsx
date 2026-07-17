import React from 'react';
import { Box, Paper, TextField, Button, Typography, Divider } from '@mui/material';
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined';
import PanelHeader from 'src/components/common/PanelHeader';

const COMPANY_FIELDS = ['company_name', 'company_tel', 'company_fax', 'order_cutoff_time'] as const;

const SETTING_LABELS: Record<string, string> = {
  company_name: '会社名',
  company_tel: '電話番号',
  company_fax: 'FAX',
  order_cutoff_time: '発注締切時間',
};

interface CompanySettingsPanelProps {
  settings: Record<string, string>;
  onChange: (key: string, value: string) => void;
  onSave: () => void;
  onSealUpload: (file: File | null) => void;
}

const CompanySettingsPanel: React.FC<CompanySettingsPanelProps> = ({
  settings,
  onChange,
  onSave,
  onSealUpload,
}) => (
  <Paper>
    <PanelHeader
      title="会社情報"
      action={
        <Button variant="contained" size="small" startIcon={<SaveOutlinedIcon />} onClick={onSave}>
          保存
        </Button>
      }
    />
    <Divider />
    <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 2, maxWidth: 560 }}>
      {COMPANY_FIELDS.map((key) => (
        <TextField
          key={key}
          label={SETTING_LABELS[key]}
          value={settings[key] || ''}
          onChange={(e) => onChange(key, e.target.value)}
          fullWidth
          size="small"
        />
      ))}

      <Box>
        <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
          見積書用会社印
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
          {settings.company_seal ? (
            <Box
              component="img"
              src={settings.company_seal}
              alt="会社印"
              sx={{ width: 72, height: 72, objectFit: 'contain', border: '1px solid', borderColor: 'divider' }}
            />
          ) : (
            <Typography variant="body2" color="text.secondary">未設定</Typography>
          )}
          <Button variant="outlined" size="small" component="label">
            画像を選択
            <input
              type="file"
              hidden
              accept="image/png,image/jpeg,image/webp"
              onChange={(e) => onSealUpload(e.target.files?.[0] || null)}
            />
          </Button>
        </Box>
      </Box>
    </Box>
  </Paper>
);

export default CompanySettingsPanel;
