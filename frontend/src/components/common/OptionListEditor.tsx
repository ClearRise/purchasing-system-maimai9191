import React, { useState } from 'react';
import {
  Box, Button, IconButton, TextField, Stack, Typography,
} from '@mui/material';
import AddOutlinedIcon from '@mui/icons-material/AddOutlined';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined';
import PanelHeader from 'src/components/common/PanelHeader';

interface OptionListEditorProps {
  title: string;
  values: string[];
  onChange: (values: string[]) => void;
  onSave: () => void;
  saving?: boolean;
  placeholder?: string;
  /** When set, rows are selectable (e.g. pick unit for related specs). */
  selectedValue?: string;
  onSelect?: (value: string) => void;
  /** Optional count label per value (e.g. linked specs count) */
  countByValue?: Record<string, number>;
}

/** Editable ordered list for 単位 / 規格 in システム設定. */
const OptionListEditor: React.FC<OptionListEditorProps> = ({
  title,
  values,
  onChange,
  onSave,
  saving,
  placeholder = '値を入力',
  selectedValue,
  onSelect,
  countByValue,
}) => {
  const [draft, setDraft] = useState('');
  const selectable = Boolean(onSelect);

  const add = () => {
    const v = draft.trim();
    if (!v) return;
    if (values.includes(v)) {
      setDraft('');
      return;
    }
    onChange([...values, v]);
    setDraft('');
    onSelect?.(v);
  };

  const updateAt = (index: number, value: string) => {
    const prev = values[index];
    onChange(values.map((v, i) => (i === index ? value : v)));
    if (selectable && selectedValue === prev) {
      onSelect?.(value);
    }
  };

  const removeAt = (index: number) => {
    const removed = values[index];
    const next = values.filter((_, i) => i !== index);
    onChange(next);
    if (selectable && selectedValue === removed) {
      onSelect?.(next[0] || '');
    }
  };

  return (
    <Box>
      <Box sx={{ mx: -0.5, mb: 1.5 }}>
        <PanelHeader
          title={title}
          action={
            <Button
              variant="contained"
              size="small"
              startIcon={<SaveOutlinedIcon />}
              onClick={onSave}
              disabled={saving}
            >
              保存
            </Button>
          }
        />
      </Box>

      <Stack spacing={1}>
        {values.map((value, index) => {
          const active = selectable && value === selectedValue;
          const count = countByValue?.[value];
          return (
            <Box
              key={index}
              onClick={() => onSelect?.(value)}
              sx={{
                display: 'flex',
                gap: 1,
                alignItems: 'center',
                px: selectable ? 1 : 0,
                py: selectable ? 0.75 : 0,
                mx: selectable ? -1 : 0,
                borderRadius: 1,
                cursor: selectable ? 'pointer' : 'default',
                bgcolor: active ? '#F1F5F9' : 'transparent',
                '&:hover': selectable
                  ? { bgcolor: active ? '#E2E8F0' : 'action.hover' }
                  : undefined,
              }}
            >
              <TextField
                size="small"
                value={value}
                onChange={(e) => updateAt(index, e.target.value)}
                onFocus={() => onSelect?.(value)}
                fullWidth
                onClick={(e) => e.stopPropagation()}
              />
              {count != null && (
                <Typography variant="caption" color="text.secondary" sx={{ flexShrink: 0, minWidth: 28 }}>
                  {count}件
                </Typography>
              )}
              <IconButton
                size="small"
                color="error"
                onClick={(e) => {
                  e.stopPropagation();
                  removeAt(index);
                }}
              >
                <DeleteOutlinedIcon fontSize="small" />
              </IconButton>
            </Box>
          );
        })}

        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <TextField
            size="small"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add(); } }}
            placeholder={placeholder}
            fullWidth
          />
          <Button variant="outlined" size="small" startIcon={<AddOutlinedIcon />} onClick={add} sx={{ flexShrink: 0 }}>
            追加
          </Button>
        </Box>
      </Stack>
    </Box>
  );
};

export default OptionListEditor;
