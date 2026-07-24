import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Autocomplete,
  Box, Button, CircularProgress, Divider, IconButton, List, ListItem, ListItemText,
  Paper, TextField, Typography,
} from '@mui/material';
import CloseOutlinedIcon from '@mui/icons-material/CloseOutlined';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import { useSnackbar } from 'notistack';
import { api } from 'src/libs/api';
import endpoints from 'src/libs/endpoints';
import type { IProduct, IStore } from 'src/types';

type CatalogOption = Pick<IProduct, 'id' | 'name' | 'spec' | 'unit' | 'categoryLabel' | 'productCode'>;

interface StoreProductsPanelProps {
  open: boolean;
  store: IStore | null;
  canEdit: boolean;
  onClose: () => void;
  onSaved: (storeId: number, productCount: number) => void;
}

/** Side panel to manage 取扱商品 for one 得意先. */
const StoreProductsPanel: React.FC<StoreProductsPanelProps> = ({
  open,
  store,
  canEdit,
  onClose,
  onSaved,
}) => {
  const { enqueueSnackbar } = useSnackbar();
  const [linkedProducts, setLinkedProducts] = useState<IProduct[]>([]);
  const [catalogOptions, setCatalogOptions] = useState<CatalogOption[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchCatalog = useCallback(async (search: string) => {
    setCatalogLoading(true);
    try {
      const res = await api.get(endpoints.masters.productsCatalog, {
        params: {
          search: search.trim() || undefined,
        },
      });
      setCatalogOptions(res.data.data || []);
    } catch {
      setCatalogOptions([]);
    } finally {
      setCatalogLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!open || !store) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await api.get(endpoints.masters.store(store.id));
        if (cancelled) return;
        setLinkedProducts(res.data.data.products || []);
        await fetchCatalog('');
      } catch {
        if (!cancelled) {
          enqueueSnackbar('取扱商品の取得に失敗しました', { variant: 'error' });
          setLinkedProducts([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [open, store, fetchCatalog, enqueueSnackbar]);

  const linkedIds = useMemo(() => new Set(linkedProducts.map((p) => p.id)), [linkedProducts]);
  const availableOptions = useMemo(
    () => catalogOptions.filter((o) => !linkedIds.has(o.id)),
    [catalogOptions, linkedIds]
  );

  const addProduct = (product: CatalogOption) => {
    if (linkedIds.has(product.id)) return;
    setLinkedProducts((prev) => [
      ...prev,
      {
        id: product.id,
        productCode: product.productCode,
        name: product.name,
        spec: product.spec,
        unit: product.unit,
        categoryLabel: product.categoryLabel,
        isActive: true,
      },
    ]);
  };

  const removeProduct = (productId: number) => {
    setLinkedProducts((prev) => prev.filter((p) => p.id !== productId));
  };

  const handleSave = async () => {
    if (!store || !canEdit) return;
    setSaving(true);
    try {
      await api.put(endpoints.masters.storeProducts(store.id), {
        productIds: linkedProducts.map((p) => p.id),
      });
      enqueueSnackbar('取扱商品を保存しました', { variant: 'success' });
      onSaved(store.id, linkedProducts.length);
      onClose();
    } catch (err: any) {
      enqueueSnackbar(err.response?.data?.message || '保存に失敗しました', { variant: 'error' });
    } finally {
      setSaving(false);
    }
  };

  if (!open || !store) return null;

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
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="h4" component="h2" noWrap>
            取扱商品
          </Typography>
          <Typography variant="caption" color="text.secondary" noWrap>
            {store.name}
          </Typography>
        </Box>
        <IconButton size="small" onClick={onClose} aria-label="閉じる" disabled={saving}>
          <CloseOutlinedIcon fontSize="small" />
        </IconButton>
      </Box>
      <Divider />

      <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
          登録した商品が、見積作成時に明細へ自動で入ります。
        </Typography>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress size={28} />
          </Box>
        ) : (
          <>
            {canEdit && (
              <Autocomplete
                options={availableOptions}
                loading={catalogLoading}
                getOptionLabel={(option) => option.name}
                isOptionEqualToValue={(a, b) => a.id === b.id}
                filterOptions={(x) => x}
                value={null}
                onOpen={() => fetchCatalog('')}
                onInputChange={(_e, value, reason) => {
                  if (reason === 'reset') return;
                  fetchCatalog(value);
                }}
                onChange={(_e, value) => {
                  if (value) addProduct(value);
                }}
                renderOption={(props, option) => (
                  <li {...props} key={option.id}>
                    <Box>
                      <Typography variant="body2">{option.name}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {[option.unit, option.spec, option.categoryLabel].filter(Boolean).join(' · ')}
                      </Typography>
                    </Box>
                  </li>
                )}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    size="small"
                    label="商品を追加"
                    placeholder="品名で検索"
                  />
                )}
                sx={{ mb: 1 }}
              />
            )}

            {linkedProducts.length === 0 ? (
              <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
                取扱商品がありません
              </Typography>
            ) : (
              <List dense disablePadding>
                {linkedProducts.map((p) => (
                  <ListItem
                    key={p.id}
                    disableGutters
                    secondaryAction={
                      canEdit ? (
                        <IconButton edge="end" size="small" onClick={() => removeProduct(p.id)}>
                          <DeleteOutlinedIcon fontSize="small" />
                        </IconButton>
                      ) : undefined
                    }
                  >
                    <ListItemText
                      primary={p.name}
                      secondary={[p.unit, p.spec, p.categoryLabel].filter(Boolean).join(' · ') || undefined}
                      slotProps={{
                        primary: { variant: 'body2' },
                        secondary: { variant: 'caption' },
                      }}
                    />
                  </ListItem>
                ))}
              </List>
            )}

            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              {linkedProducts.length}件
            </Typography>
          </>
        )}
      </Box>

      <Divider />
      <Box sx={{ p: 2, display: 'flex', gap: 1, justifyContent: 'flex-end', flexShrink: 0 }}>
        <Button onClick={onClose} color="inherit" disabled={saving}>
          {canEdit ? 'キャンセル' : '閉じる'}
        </Button>
        {canEdit && (
          <Button variant="contained" onClick={handleSave} disabled={saving || loading}>
            {saving ? '保存中...' : '保存'}
          </Button>
        )}
      </Box>
    </Paper>
  );
};

export default StoreProductsPanel;
