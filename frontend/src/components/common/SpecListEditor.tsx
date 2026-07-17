import React, { useEffect, useState } from 'react';
import {
  Box, Button, IconButton, TextField, MenuItem, Typography, Stack,
} from '@mui/material';
import AddOutlinedIcon from '@mui/icons-material/AddOutlined';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined';
import PanelHeader from 'src/components/common/PanelHeader';
import { formatSpec, parseSpec } from 'src/utils/specFormat';

interface SpecListEditorProps {
  title?: string;
  values: string[];
  units: string[];
  onChange: (values: string[]) => void;
  onSave: () => void;
  saving?: boolean;
}

/** 規格 = 数量 + 単位(select from 単位マスタ). Stored as display strings e.g. "200g", "1 kg". */
const SpecListEditor: React.FC<SpecListEditorProps> = ({
  title = '商品規格',
  values,
  units,
  onChange,
  onSave,
  saving,
}) => {
  const [draftAmount, setDraftAmount] = useState('');
  const [draftUnit, setDraftUnit] = useState(units[0] || '');
  const defaultUnit = units[0] || '';

  useEffect(() => {
    if (!units.length) return;
    if (!draftUnit || !units.includes(draftUnit)) {
      setDraftUnit(units[0]);
    }
  }, [units, draftUnit]);

  const add = () => {
    const next = formatSpec(draftAmount, draftUnit || defaultUnit);
    if (!next) return;
    if (values.includes(next)) {
      setDraftAmount('');
      return;
    }
    onChange([...values, next]);
    setDraftAmount('');
  };

  const updateAt = (index: number, amount: string, unit: string) => {
    const next = formatSpec(amount, unit);
    onChange(values.map((v, i) => (i === index ? next : v)));
  };

  const removeAt = (index: number) => {
    onChange(values.filter((_, i) => i !== index));
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
              disabled={saving || !units.length}
            >
              保存
            </Button>
          }
        />
      </Box>

      {!units.length && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          先に左側の「商品単位」を登録してください。
        </Typography>
      )}

      <Stack spacing={1}>
        {values.map((value, index) => {
          const parsed = parseSpec(value, units);
          const unitOptions = parsed.unit && !units.includes(parsed.unit)
            ? [parsed.unit, ...units]
            : units;
          return (
            <Box key={index} sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              <TextField
                size="small"
                label="数量"
                value={parsed.amount}
                onChange={(e) => updateAt(index, e.target.value, parsed.unit || defaultUnit)}
                sx={{ flex: 1 }}
              />
              <TextField
                select
                size="small"
                label="単位"
                value={parsed.unit || defaultUnit}
                onChange={(e) => updateAt(index, parsed.amount, e.target.value)}
                sx={{ width: 120 }}
                disabled={!unitOptions.length}
              >
                {unitOptions.map((u) => (
                  <MenuItem key={u} value={u}>{u}</MenuItem>
                ))}
              </TextField>
              <IconButton size="small" color="error" onClick={() => removeAt(index)}>
                <DeleteOutlinedIcon fontSize="small" />
              </IconButton>
            </Box>
          );
        })}

        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <TextField
            size="small"
            label="数量"
            value={draftAmount}
            onChange={(e) => setDraftAmount(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add(); } }}
            placeholder="例: 200"
            sx={{ flex: 1 }}
          />
          <TextField
            select
            size="small"
            label="単位"
            value={draftUnit || defaultUnit}
            onChange={(e) => setDraftUnit(e.target.value)}
            sx={{ width: 120 }}
            disabled={!units.length}
          >
            {units.map((u) => (
              <MenuItem key={u} value={u}>{u}</MenuItem>
            ))}
          </TextField>
          <Button
            variant="outlined"
            size="small"
            startIcon={<AddOutlinedIcon />}
            onClick={add}
            disabled={!units.length}
            sx={{ flexShrink: 0 }}
          >
            追加
          </Button>
        </Box>
      </Stack>
    </Box>
  );
};

export default SpecListEditor;
