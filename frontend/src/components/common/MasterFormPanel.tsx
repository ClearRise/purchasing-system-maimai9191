import React from 'react';
import {
  Box, Button, Divider, IconButton, Paper, Stack, TextField, Typography,
} from '@mui/material';
import CloseOutlinedIcon from '@mui/icons-material/CloseOutlined';

export type MasterField = { name: string; label: string; required?: boolean };

type FormValues = Record<string, string>;

interface MasterFormPanelProps {
  open: boolean;
  mode: 'create' | 'edit';
  form: FormValues;
  saving?: boolean;
  /** Override create-mode title (default: 新規登録) */
  createTitle?: string;
  /** Override create-mode save label (default: 登録) */
  createSaveLabel?: string;
  /** Simple text fields (得意先/発注先/店舗). Ignored if renderFields is set. */
  fields?: MasterField[];
  /** Custom fields (商品・ユーザーなど) */
  renderFields?: (form: FormValues) => React.ReactNode;
  onClose: () => void;
  onSave: () => void;
  onChange: (name: string, value: string) => void;
}

/** Inline right-side form panel for create/edit (opens beside the table). */
const MasterFormPanel: React.FC<MasterFormPanelProps> = ({
  open,
  mode,
  form,
  saving,
  createTitle = '新規登録',
  createSaveLabel = '登録',
  fields,
  renderFields,
  onClose,
  onSave,
  onChange,
}) => {
  if (!open) return null;

  const isEdit = mode === 'edit';

  return (
    <Paper
      sx={{
        width: { xs: '100%', md: 400 },
        flexShrink: 0,
        minHeight: 0,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      <Box sx={{ px: 2, py: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <Typography variant="h4" component="h2">
          {isEdit ? '編集' : createTitle}
        </Typography>
        <IconButton size="small" onClick={onClose} aria-label="閉じる">
          <CloseOutlinedIcon fontSize="small" />
        </IconButton>
      </Box>
      <Divider />

      <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
        {renderFields ? (
          renderFields(form)
        ) : (
          <Stack spacing={1.5}>
            {(fields || []).map((f) => (
              <TextField
                key={f.name}
                label={f.label}
                value={form[f.name] || ''}
                onChange={(e) => onChange(f.name, e.target.value)}
                required={f.required}
                fullWidth
                size="small"
                multiline={f.name === 'note'}
                rows={f.name === 'note' ? 2 : undefined}
              />
            ))}
          </Stack>
        )}
      </Box>

      <Divider />
      <Box sx={{ p: 2, display: 'flex', gap: 1, justifyContent: 'flex-end', flexShrink: 0 }}>
        <Button onClick={onClose} color="inherit" disabled={saving}>キャンセル</Button>
        <Button variant="contained" onClick={onSave} disabled={saving}>
          {saving ? '保存中...' : isEdit ? '更新' : createSaveLabel}
        </Button>
      </Box>
    </Paper>
  );
};

export default MasterFormPanel;
