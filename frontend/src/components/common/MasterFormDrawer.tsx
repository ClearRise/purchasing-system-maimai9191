import React from 'react';
import {
  Box, Button, Divider, Drawer, IconButton, Stack, TextField, Typography,
} from '@mui/material';
import AddOutlinedIcon from '@mui/icons-material/AddOutlined';
import CloseOutlinedIcon from '@mui/icons-material/CloseOutlined';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';

export type MasterField = { name: string; label: string; required?: boolean };

type FormValues = Record<string, string>;

interface MasterFormDrawerProps {
  open: boolean;
  mode: 'create' | 'edit';
  forms: FormValues[];
  saving?: boolean;
  /** Simple text fields (得意先/発注先/店舗). Ignored if renderFields is set. */
  fields?: MasterField[];
  /** Custom fields (商品など) */
  renderFields?: (form: FormValues, index: number) => React.ReactNode;
  /** When false, hides multi-row add in create mode (default true). */
  allowMultiAdd?: boolean;
  onClose: () => void;
  onSave: () => void;
  onAddRow: () => void;
  onRemoveRow: (index: number) => void;
  onChange: (index: number, name: string, value: string) => void;
}

const MasterFormDrawer: React.FC<MasterFormDrawerProps> = ({
  open,
  mode,
  forms,
  saving,
  fields,
  renderFields,
  allowMultiAdd = true,
  onClose,
  onSave,
  onAddRow,
  onRemoveRow,
  onChange,
}) => {
  const isEdit = mode === 'edit';
  const showMultiAdd = allowMultiAdd && !isEdit;

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      slotProps={{ paper: { sx: { width: { xs: '100%', sm: 420 }, display: 'flex', flexDirection: 'column' } } }}
    >
      <Box sx={{ px: 2, py: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="h4" component="h2">
          {isEdit ? '編集' : '新規登録'}
        </Typography>
        <IconButton size="small" onClick={onClose}>
          <CloseOutlinedIcon fontSize="small" />
        </IconButton>
      </Box>
      <Divider />

      <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
        <Stack spacing={2}>
          {forms.map((form, index) => (
            <Box key={index}>
              {!isEdit && forms.length > 1 && (
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" color="text.secondary">{index + 1}件目</Typography>
                  <IconButton size="small" onClick={() => onRemoveRow(index)} disabled={forms.length <= 1}>
                    <DeleteOutlinedIcon fontSize="small" />
                  </IconButton>
                </Box>
              )}

              {renderFields ? (
                renderFields(form, index)
              ) : (
                <Stack spacing={1.5}>
                  {(fields || []).map((f) => (
                    <TextField
                      key={f.name}
                      label={f.label}
                      value={form[f.name] || ''}
                      onChange={(e) => onChange(index, f.name, e.target.value)}
                      required={f.required}
                      fullWidth
                      size="small"
                      multiline={f.name === 'note'}
                      rows={f.name === 'note' ? 2 : undefined}
                    />
                  ))}
                </Stack>
              )}

              {!isEdit && index < forms.length - 1 && <Divider sx={{ mt: 2 }} />}
            </Box>
          ))}
        </Stack>

        {showMultiAdd && (
          <Button fullWidth variant="outlined" startIcon={<AddOutlinedIcon />} onClick={onAddRow} sx={{ mt: 2 }}>
            行を追加
          </Button>
        )}
      </Box>

      <Divider />
      <Box sx={{ p: 2, display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
        <Button onClick={onClose} color="inherit" disabled={saving}>キャンセル</Button>
        <Button variant="contained" onClick={onSave} disabled={saving}>
          {saving ? '保存中...' : isEdit ? '更新' : allowMultiAdd ? `${forms.length}件を登録` : '登録'}
        </Button>
      </Box>
    </Drawer>
  );
};

export default MasterFormDrawer;
