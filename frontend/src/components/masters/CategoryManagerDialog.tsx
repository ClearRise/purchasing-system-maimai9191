import React, { useEffect, useState } from 'react';
import {
  Box, Button, Dialog, DialogActions, DialogContent, DialogTitle,
  IconButton, Stack, TextField, Typography,
} from '@mui/material';
import AddOutlinedIcon from '@mui/icons-material/AddOutlined';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined';
import { useSnackbar } from 'notistack';
import { api } from 'src/libs/api';
import endpoints from 'src/libs/endpoints';
import type { ICategory } from 'src/types';

interface CategoryManagerDialogProps {
  open: boolean;
  categories: ICategory[];
  onClose: () => void;
  onSaved: (categories: ICategory[]) => void;
}

/** Manage product categories (name list) from 商品マスタ. */
const CategoryManagerDialog: React.FC<CategoryManagerDialogProps> = ({
  open,
  categories,
  onClose,
  onSaved,
}) => {
  const { enqueueSnackbar } = useSnackbar();
  const [names, setNames] = useState<string[]>([]);
  const [draft, setDraft] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setNames(categories.map((c) => c.name));
    setDraft('');
  }, [open, categories]);

  const add = () => {
    const v = draft.trim();
    if (!v) return;
    if (names.some((n) => n.toLowerCase() === v.toLowerCase())) {
      setDraft('');
      return;
    }
    setNames((prev) => [...prev, v]);
    setDraft('');
  };

  const updateAt = (index: number, value: string) => {
    setNames((prev) => prev.map((n, i) => (i === index ? value : n)));
  };

  const removeAt = (index: number) => {
    setNames((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await api.put(endpoints.masters.categories, { values: names });
      const next: ICategory[] = res.data.data || [];
      onSaved(next);
      enqueueSnackbar('カテゴリを保存しました', { variant: 'success' });
      onClose();
    } catch (err: any) {
      enqueueSnackbar(err.response?.data?.message || 'カテゴリの保存に失敗しました', { variant: 'error' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={saving ? undefined : onClose} fullWidth maxWidth="xs">
      <DialogTitle sx={{ pb: 1 }}>商品カテゴリ</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
          商品マスタのカテゴリ選択肢を管理します。削除したカテゴリは商品から外れます。
        </Typography>
        <Stack spacing={1}>
          {names.map((name, index) => (
            <Box key={index} sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              <TextField
                size="small"
                value={name}
                onChange={(e) => updateAt(index, e.target.value)}
                fullWidth
                placeholder="カテゴリ名"
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
              placeholder="例: 野菜 / 加工"
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
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={saving}>キャンセル</Button>
        <Button
          variant="contained"
          startIcon={<SaveOutlinedIcon />}
          onClick={handleSave}
          disabled={saving}
        >
          保存
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CategoryManagerDialog;
