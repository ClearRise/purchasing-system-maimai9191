import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Box, Button, Checkbox, CircularProgress, Divider, IconButton, List, ListItem,
  ListItemButton, ListItemIcon, ListItemText, Paper, TextField, Typography,
} from '@mui/material';
import CloseOutlinedIcon from '@mui/icons-material/CloseOutlined';
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

/** Side panel to manage 取扱商品 for one 得意先 (multi-check catalog). */
const StoreProductsPanel: React.FC<StoreProductsPanelProps> = ({
  open,
  store,
  canEdit,
  onClose,
  onSaved,
}) => {
  const { enqueueSnackbar } = useSnackbar();
  const [catalog, setCatalog] = useState<CatalogOption[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(() => new Set());
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open || !store) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setSearch('');
      try {
        const [storeRes, catalogRes] = await Promise.all([
          api.get(endpoints.masters.store(store.id)),
          api.get(endpoints.masters.productsCatalog),
        ]);
        if (cancelled) return;

        const linked: IProduct[] = storeRes.data.data.products || [];
        const catalogRows: CatalogOption[] = catalogRes.data.data || [];
        const byId = new Map<number, CatalogOption>();
        for (const p of catalogRows) byId.set(p.id, p);
        for (const p of linked) {
          if (!byId.has(p.id)) {
            byId.set(p.id, {
              id: p.id,
              productCode: p.productCode,
              name: p.name,
              spec: p.spec,
              unit: p.unit,
              categoryLabel: p.categoryLabel,
            });
          }
        }
        setCatalog(Array.from(byId.values()).sort((a, b) => a.name.localeCompare(b.name, 'ja')));
        setSelectedIds(new Set(linked.map((p) => p.id)));
      } catch {
        if (!cancelled) {
          enqueueSnackbar('取扱商品の取得に失敗しました', { variant: 'error' });
          setCatalog([]);
          setSelectedIds(new Set());
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [open, store, enqueueSnackbar]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return catalog;
    return catalog.filter((p) => {
      const hay = [p.name, p.productCode, p.spec, p.unit, p.categoryLabel]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return hay.includes(q);
    });
  }, [catalog, search]);

  const selectedCount = selectedIds.size;
  const filteredSelectedCount = useMemo(
    () => filtered.reduce((n, p) => n + (selectedIds.has(p.id) ? 1 : 0), 0),
    [filtered, selectedIds]
  );
  const allFilteredSelected = filtered.length > 0 && filteredSelectedCount === filtered.length;
  const someFilteredSelected = filteredSelectedCount > 0 && !allFilteredSelected;

  const toggleProduct = useCallback((productId: number) => {
    if (!canEdit) return;
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(productId)) next.delete(productId);
      else next.add(productId);
      return next;
    });
  }, [canEdit]);

  const toggleAllFiltered = () => {
    if (!canEdit || filtered.length === 0) return;
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allFilteredSelected) {
        for (const p of filtered) next.delete(p.id);
      } else {
        for (const p of filtered) next.add(p.id);
      }
      return next;
    });
  };

  const handleSave = async () => {
    if (!store || !canEdit) return;
    setSaving(true);
    try {
      const productIds = Array.from(selectedIds);
      await api.put(endpoints.masters.storeProducts(store.id), { productIds });
      enqueueSnackbar('取扱商品を保存しました', { variant: 'success' });
      onSaved(store.id, productIds.length);
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
        width: { xs: '100%', md: 420 },
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

      <Box sx={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', p: 2, pt: 1.5 }}>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5, flexShrink: 0 }}>
          チェックした商品が見積作成時の明細に入ります。
        </Typography>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress size={28} />
          </Box>
        ) : (
          <>
            <TextField
              size="small"
              fullWidth
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="品名・規格・カテゴリで絞り込み"
              sx={{ mb: 1, flexShrink: 0 }}
            />

            <Box
              sx={{
                flex: 1,
                minHeight: 0,
                border: 1,
                borderColor: 'divider',
                borderRadius: 1,
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
              }}
            >
              {canEdit && filtered.length > 0 && (
                <>
                  <ListItem
                    dense
                    disablePadding
                    secondaryAction={
                      <Typography variant="caption" color="text.secondary" sx={{ pr: 1 }}>
                        {filteredSelectedCount}/{filtered.length}
                      </Typography>
                    }
                  >
                    <ListItemButton onClick={toggleAllFiltered} dense>
                      <ListItemIcon sx={{ minWidth: 36 }}>
                        <Checkbox
                          edge="start"
                          size="small"
                          checked={allFilteredSelected}
                          indeterminate={someFilteredSelected}
                          tabIndex={-1}
                          disableRipple
                        />
                      </ListItemIcon>
                      <ListItemText
                        primary="表示中をすべて選択"
                        slotProps={{ primary: { variant: 'body2' } }}
                      />
                    </ListItemButton>
                  </ListItem>
                  <Divider />
                </>
              )}

              <List dense disablePadding sx={{ flex: 1, overflow: 'auto' }}>
                {filtered.length === 0 ? (
                  <Typography variant="body2" color="text.secondary" sx={{ py: 3, textAlign: 'center' }}>
                    {catalog.length === 0 ? '商品マスタに商品がありません' : '該当する商品がありません'}
                  </Typography>
                ) : (
                  filtered.map((p) => {
                    const checked = selectedIds.has(p.id);
                    const secondary = [p.unit, p.spec, p.categoryLabel].filter(Boolean).join(' · ') || undefined;
                    return (
                      <ListItem key={p.id} dense disablePadding>
                        <ListItemButton
                          onClick={() => toggleProduct(p.id)}
                          disabled={!canEdit}
                          dense
                        >
                          <ListItemIcon sx={{ minWidth: 36 }}>
                            <Checkbox
                              edge="start"
                              size="small"
                              checked={checked}
                              tabIndex={-1}
                              disableRipple
                              disabled={!canEdit}
                            />
                          </ListItemIcon>
                          <ListItemText
                            primary={p.name}
                            secondary={secondary}
                            slotProps={{
                              primary: { variant: 'body2' },
                              secondary: { variant: 'caption' },
                            }}
                          />
                        </ListItemButton>
                      </ListItem>
                    );
                  })
                )}
              </List>
            </Box>

            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, flexShrink: 0 }}>
              選択中 {selectedCount}件 / 全{catalog.length}件
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
