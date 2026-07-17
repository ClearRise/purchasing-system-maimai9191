import React, { useEffect, useState } from 'react';
import {
  Box, Button, IconButton, TextField, Typography, Stack,
} from '@mui/material';
import AddOutlinedIcon from '@mui/icons-material/AddOutlined';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined';
import PanelHeader from 'src/components/common/PanelHeader';
import { formatSpec, parseSpec } from 'src/utils/specFormat';

interface SpecListEditorProps {
  title?: string;
  /** Specs for the currently selected unit only (display strings) */
  values: string[];
  /** Fixed unit this editor manages */
  unit: string;
  allUnits: string[];
  onChange: (values: string[]) => void;
  onSave: () => void;
  saving?: boolean;
}

/** 規格 for one 単位 — amount + linked unit. */
const SpecListEditor: React.FC<SpecListEditorProps> = ({
  title = '商品規格',
  values,
  unit,
  allUnits,
  onChange,
  onSave,
  saving,
}) => {
  const [draftAmount, setDraftAmount] = useState('');

  useEffect(() => {
    setDraftAmount('');
  }, [unit]);

  const add = () => {
    if (!unit) return;
    const next = formatSpec(draftAmount, unit);
    if (!next) return;
    if (values.includes(next)) {
      setDraftAmount('');
      return;
    }
    onChange([...values, next]);
    setDraftAmount('');
  };

  const updateAt = (index: number, amount: string) => {
    if (!unit) return;
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
              disabled={saving || !unit}
            >
              保存
            </Button>
          }
        />
      </Box>

      {!unit ? (
        <Typography variant="body2" color="text.secondary">
          左の「商品単位」から単位を選択してください。
        </Typography>
      ) : (
        <>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
            単位「{unit}」に紐づく規格
          </Typography>
          <Stack spacing={1}>
            {values.map((value, index) => {
              const parsed = parseSpec(value, allUnits.length ? allUnits : [unit]);
              return (
                <Box key={`${value}-${index}`} sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                  <TextField
                    size="small"
                    label="数量"
                    value={parsed.amount}
                    onChange={(e) => updateAt(index, e.target.value)}
                    sx={{ flex: 1 }}
                  />
                  <TextField
                    size="small"
                    label="単位"
                    value={unit}
                    sx={{ width: 100 }}
                    disabled
                  />
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
                size="small"
                label="単位"
                value={unit}
                sx={{ width: 100 }}
                disabled
              />
              <Button
                variant="outlined"
                size="small"
                startIcon={<AddOutlinedIcon />}
                onClick={add}
                sx={{ flexShrink: 0 }}
              >
                追加
              </Button>
            </Box>
          </Stack>
        </>
      )}
    </Box>
  );
};

export default SpecListEditor;
