import React, { useEffect, useState } from 'react';
import {
  Box, Button, IconButton, TextField, Typography, Stack,
} from '@mui/material';
import AddOutlinedIcon from '@mui/icons-material/AddOutlined';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined';
import PanelHeader from 'src/components/common/PanelHeader';

interface SpecListEditorProps {
  title?: string;
  /** Specs for the currently selected unit only */
  values: string[];
  /** Unit these specs are linked to */
  unit: string;
  onChange: (values: string[]) => void;
  onSave: () => void;
  saving?: boolean;
}

/** Free-text 規格 list for one selected 単位. */
const SpecListEditor: React.FC<SpecListEditorProps> = ({
  title = '商品規格',
  values,
  unit,
  onChange,
  onSave,
  saving,
}) => {
  const [draft, setDraft] = useState('');

  useEffect(() => {
    setDraft('');
  }, [unit]);

  const add = () => {
    if (!unit) return;
    const next = draft.trim();
    if (!next) return;
    if (values.includes(next)) {
      setDraft('');
      return;
    }
    onChange([...values, next]);
    setDraft('');
  };

  const updateAt = (index: number, value: string) => {
    onChange(values.map((v, i) => (i === index ? value : v)));
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
            単位「{unit}」に紐づく規格（文字・数字どちらも可）
          </Typography>
          <Stack spacing={1}>
            {values.map((value, index) => (
              <Box key={index} sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                <TextField
                  size="small"
                  label="規格"
                  value={value}
                  onChange={(e) => updateAt(index, e.target.value)}
                  placeholder="例: バラ / 200g / 特大"
                  fullWidth
                />
                <IconButton size="small" color="error" onClick={() => removeAt(index)}>
                  <DeleteOutlinedIcon fontSize="small" />
                </IconButton>
              </Box>
            ))}

            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              <TextField
                size="small"
                label="規格"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add(); } }}
                placeholder="例: バラ / 200g / 特大"
                fullWidth
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
