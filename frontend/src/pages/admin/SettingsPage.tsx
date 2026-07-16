import React, { useEffect, useState } from 'react';
import {
  Box, Paper, TextField, Button, Table, TableHead, TableRow, TableCell,
  TableBody, CircularProgress, Typography, Divider,
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import { useSnackbar } from 'notistack';
import PageHeader from 'src/components/common/PageHeader';
import { api } from 'src/libs/api';
import endpoints from 'src/libs/endpoints';
import { compressSealImage } from 'src/utils/compressSealImage';

const COMPANY_FIELDS = ['company_name', 'company_tel', 'company_fax', 'order_cutoff_time'] as const;
const ALERT_FIELDS = ['price_increase_alert_pct', 'abnormal_value_alert_pct'] as const;

const SETTING_LABELS: Record<string, string> = {
  company_name: '会社名',
  company_tel: '電話番号',
  company_fax: 'FAX',
  order_cutoff_time: '発注締切時間',
  price_increase_alert_pct: '価格上昇アラート (%)',
  abnormal_value_alert_pct: '異常値アラート (%)',
};

const SettingsPage: React.FC = () => {
  const { enqueueSnackbar } = useSnackbar();
  const [margins, setMargins] = useState<any[]>([]);
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get(endpoints.admin.rankMargins),
      api.get(endpoints.admin.settings),
    ]).then(([mRes, sRes]) => {
      setMargins(mRes.data.data);
      setSettings(sRes.data.data);
    }).finally(() => setLoading(false));
  }, []);

  const saveMargins = async () => {
    try {
      await Promise.all(margins.map((m) =>
        api.put(endpoints.admin.rankMargin(m.rank), {
          defaultMarginRate: m.defaultMarginRate,
          minMarginRate: m.minMarginRate,
        })
      ));
      enqueueSnackbar('粗利率設定を保存しました', { variant: 'success' });
    } catch {
      enqueueSnackbar('保存に失敗しました', { variant: 'error' });
    }
  };

  const saveSettings = async () => {
    try {
      await api.put(endpoints.admin.settings, settings);
      enqueueSnackbar('システム設定を保存しました', { variant: 'success' });
    } catch {
      enqueueSnackbar('保存に失敗しました', { variant: 'error' });
    }
  };

  const handleSealUpload = async (file: File | null) => {
    if (!file) return;
    try {
      const dataUrl = await compressSealImage(file);
      setSettings((prev) => ({ ...prev, company_seal: dataUrl }));
      enqueueSnackbar('印鑑画像を読み込みました。保存ボタンで反映してください。', { variant: 'info' });
    } catch (err: any) {
      enqueueSnackbar(err.message || '印鑑画像の読み込みに失敗しました', { variant: 'error' });
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', height: 280, alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress size={32} />
      </Box>
    );
  }

  return (
    <Box>
      <PageHeader title="システム設定" subtitle="ランク別粗利率・会社情報の管理" />

      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          gap: 2,
          alignItems: 'stretch',
        }}
      >
        <Paper sx={{ flex: { md: '1 1 42%' }, minWidth: 0 }}>
          <Box sx={{ px: 2, py: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              ランク別粗利率
            </Typography>
            <Button variant="contained" size="small" startIcon={<SaveIcon />} onClick={saveMargins}>
              保存
            </Button>
          </Box>
          <Divider />
          <Box sx={{ overflowX: 'auto' }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>ランク</TableCell>
                  <TableCell>デフォルト粗利率 (%)</TableCell>
                  <TableCell>最低粗利率 (%)</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {margins.map((m, i) => (
                  <TableRow key={m.rank}>
                    <TableCell sx={{ fontWeight: 500 }}>{m.rank}</TableCell>
                    <TableCell>
                      <TextField
                        type="number"
                        size="small"
                        value={m.defaultMarginRate}
                        onChange={(e) => {
                          const updated = [...margins];
                          updated[i] = { ...m, defaultMarginRate: Number(e.target.value) };
                          setMargins(updated);
                        }}
                        sx={{ width: 100 }}
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        type="number"
                        size="small"
                        value={m.minMarginRate}
                        onChange={(e) => {
                          const updated = [...margins];
                          updated[i] = { ...m, minMarginRate: Number(e.target.value) };
                          setMargins(updated);
                        }}
                        sx={{ width: 100 }}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
        </Paper>

        <Paper sx={{ flex: { md: '1 1 58%' }, minWidth: 0 }}>
          <Box sx={{ px: 2, py: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              会社情報・アラート
            </Typography>
            <Button variant="contained" size="small" startIcon={<SaveIcon />} onClick={saveSettings}>
              保存
            </Button>
          </Box>
          <Divider />
          <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            {COMPANY_FIELDS.map((key) => (
              <TextField
                key={key}
                label={SETTING_LABELS[key]}
                value={settings[key] || ''}
                onChange={(e) => setSettings({ ...settings, [key]: e.target.value })}
                fullWidth
                size="small"
              />
            ))}

            {ALERT_FIELDS.map((key) => (
              <TextField
                key={key}
                label={SETTING_LABELS[key]}
                type="number"
                value={settings[key] || ''}
                onChange={(e) => setSettings({ ...settings, [key]: e.target.value })}
                fullWidth
                size="small"
              />
            ))}

            <Box>
              <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
                見積書用会社印
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                {settings.company_seal ? (
                  <Box
                    component="img"
                    src={settings.company_seal}
                    alt="会社印"
                    sx={{ width: 72, height: 72, objectFit: 'contain', border: '1px solid', borderColor: 'divider' }}
                  />
                ) : (
                  <Typography variant="body2" color="text.secondary">未設定</Typography>
                )}
                <Button variant="outlined" size="small" component="label">
                  画像を選択
                  <input
                    type="file"
                    hidden
                    accept="image/png,image/jpeg,image/webp"
                    onChange={(e) => handleSealUpload(e.target.files?.[0] || null)}
                  />
                </Button>
              </Box>
            </Box>
          </Box>
        </Paper>
      </Box>
    </Box>
  );
};

export default SettingsPage;
