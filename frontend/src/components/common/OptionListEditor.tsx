import React, { useState } from 'react';
import {
  Box, Button, IconButton, TextField, Stack,
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
}

/** Editable ordered list for 単位 / 規格 in システム設定. */
const OptionListEditor: React.FC<OptionListEditorProps> = ({
  title,
  values,
  onChange,
  onSave,
  saving,
  placeholder = '値を入力',
}) => {
  const [draft, setDraft] = useState('');

  const add = () => {
    const v = draft.trim();
    if (!v) return;
    if (values.includes(v)) {
      setDraft('');
      return;
    }
    onChange([...values, v]);
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
              disabled={saving}
            >
              保存
            </Button>
          }
        />
      </Box>

      <Stack spacing={1}>
        {values.map((value, index) => (
          <Box key={index} sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <TextField
              size="small"
              value={value}
              onChange={(e) => updateAt(index, e.target.value)}
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
