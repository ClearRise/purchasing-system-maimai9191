import React, { useEffect, useState } from 'react';
import {
  Box, Paper, TextField, Button, Table, TableHead, TableRow, TableCell,
  TableBody, CircularProgress, Typography, Divider, Grid, Stack, alpha,
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import PercentOutlinedIcon from '@mui/icons-material/PercentOutlined';
import BusinessOutlinedIcon from '@mui/icons-material/BusinessOutlined';
import NotificationsOutlinedIcon from '@mui/icons-material/NotificationsOutlined';
import ImageOutlinedIcon from '@mui/icons-material/ImageOutlined';
import { useSnackbar } from 'notistack';
import PageHeader from 'src/components/common/PageHeader';
import { api } from 'src/libs/api';
import endpoints from 'src/libs/endpoints';
import { compressSealImage } from 'src/utils/compressSealImage';

const SETTING_LABELS: Record<string, string> = {
  company_name: '会社名',
  company_tel: '電話番号',
  company_fax: 'FAX',
  order_cutoff_time: '発注締切時間',
  price_increase_alert_pct: '価格上昇アラート (%)',
  abnormal_value_alert_pct: '異常値アラート (%)',
};

interface SettingsSectionProps {
  title: string;
  description?: string;
  icon: React.ReactNode;
  iconColor?: string;
  onSave: () => void;
  children: React.ReactNode;
}

const SettingsSection: React.FC<SettingsSectionProps> = ({
  title,
  description,
  icon,
  iconColor = '#166534',
  onSave,
  children,
}) => (
  <Paper sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
    <Box
      sx={{
        px: { xs: 2, md: 2.5 },
        py: 2,
        borderBottom: '1px solid',
        borderColor: 'divider',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: 2,
      }}
    >
      <Box sx={{ display: 'flex', gap: 1.5, minWidth: 0 }}>
        <Box
          sx={{
            mt: 0.25,
            p: 1,
            borderRadius: 1.5,
            bgcolor: alpha(iconColor, 0.1),
            color: iconColor,
            display: 'flex',
            flexShrink: 0,
          }}
        >
          {icon}
        </Box>
        <Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            {title}
          </Typography>
          {description && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
              {description}
            </Typography>
          )}
        </Box>
      </Box>
      <Button variant="contained" startIcon={<SaveIcon />} onClick={onSave} sx={{ flexShrink: 0 }}>
        保存
      </Button>
    </Box>
    <Box sx={{ p: { xs: 2, md: 2.5 }, flex: 1 }}>{children}</Box>
  </Paper>
);

const SubsectionTitle: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Typography
    variant="overline"
    sx={{ display: 'block', color: 'text.secondary', fontWeight: 600, letterSpacing: '0.06em', mb: 1.5 }}
  >
    {children}
  </Typography>
);

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
    <Box sx={{ maxWidth: 1200 }}>
      <PageHeader title="システム設定" subtitle="ランク別粗利率・会社情報の管理" />

      <Grid container spacing={3} sx={{ alignItems: 'stretch' }}>
        <Grid size={{ xs: 12, lg: 5 }}>
          <SettingsSection
            title="ランク別粗利率"
            description="得意先ランクごとの見積粗利率を設定します"
            icon={<PercentOutlinedIcon fontSize="small" />}
            onSave={saveMargins}
          >
            <Table
              sx={{
                '& .MuiTableCell-root': { py: 1.25, borderColor: 'divider' },
                '& .MuiTableCell-head': { fontWeight: 600, bgcolor: 'grey.50' },
              }}
            >
              <TableHead>
                <TableRow>
                  <TableCell width={72}>ランク</TableCell>
                  <TableCell>デフォルト粗利率</TableCell>
                  <TableCell>最低粗利率</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {margins.map((m, i) => (
                  <TableRow key={m.rank} hover>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 700, fontSize: '1rem' }}>
                        {m.rank}
                      </Typography>
                    </TableCell>
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
                        slotProps={{
                          input: { endAdornment: <Typography variant="body2" color="text.secondary">%</Typography> },
                        }}
                        sx={{ width: 120 }}
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
                        slotProps={{
                          input: { endAdornment: <Typography variant="body2" color="text.secondary">%</Typography> },
                        }}
                        sx={{ width: 120 }}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </SettingsSection>
        </Grid>

        <Grid size={{ xs: 12, lg: 7 }}>
          <SettingsSection
            title="会社情報・アラート"
            description="見積書・通知に使用する会社情報とアラート閾値"
            icon={<BusinessOutlinedIcon fontSize="small" />}
            iconColor="#2563EB"
            onSave={saveSettings}
          >
            <Stack spacing={3}>
              <Box>
                <SubsectionTitle>会社情報</SubsectionTitle>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12 }}>
                    <TextField
                      label={SETTING_LABELS.company_name}
                      value={settings.company_name || ''}
                      onChange={(e) => setSettings({ ...settings, company_name: e.target.value })}
                      fullWidth
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      label={SETTING_LABELS.company_tel}
                      value={settings.company_tel || ''}
                      onChange={(e) => setSettings({ ...settings, company_tel: e.target.value })}
                      fullWidth
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      label={SETTING_LABELS.company_fax}
                      value={settings.company_fax || ''}
                      onChange={(e) => setSettings({ ...settings, company_fax: e.target.value })}
                      fullWidth
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      label={SETTING_LABELS.order_cutoff_time}
                      value={settings.order_cutoff_time || ''}
                      onChange={(e) => setSettings({ ...settings, order_cutoff_time: e.target.value })}
                      placeholder="例: 23:00"
                      fullWidth
                    />
                  </Grid>
                </Grid>
              </Box>

              <Divider />

              <Box>
                <Typography
                  variant="overline"
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.75,
                    color: 'text.secondary',
                    fontWeight: 600,
                    letterSpacing: '0.06em',
                    mb: 1.5,
                  }}
                >
                  <NotificationsOutlinedIcon sx={{ fontSize: 16 }} />
                  アラート設定
                </Typography>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      label={SETTING_LABELS.price_increase_alert_pct}
                      type="number"
                      value={settings.price_increase_alert_pct || ''}
                      onChange={(e) => setSettings({ ...settings, price_increase_alert_pct: e.target.value })}
                      helperText="仕入価格の前月比上昇率がこの値を超えると通知"
                      fullWidth
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      label={SETTING_LABELS.abnormal_value_alert_pct}
                      type="number"
                      value={settings.abnormal_value_alert_pct || ''}
                      onChange={(e) => setSettings({ ...settings, abnormal_value_alert_pct: e.target.value })}
                      helperText="通常範囲から大きく乖離した価格を検知"
                      fullWidth
                    />
                  </Grid>
                </Grid>
              </Box>

              <Divider />

              <Box>
                <Typography
                  variant="overline"
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.75,
                    color: 'text.secondary',
                    fontWeight: 600,
                    letterSpacing: '0.06em',
                    mb: 1.5,
                  }}
                >
                  <ImageOutlinedIcon sx={{ fontSize: 16 }} />
                  見積書用会社印
                </Typography>
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: { xs: 'column', sm: 'row' },
                    alignItems: { xs: 'stretch', sm: 'center' },
                    gap: 3,
                    p: 2.5,
                    borderRadius: 2,
                    bgcolor: 'grey.50',
                    border: '1px dashed',
                    borderColor: 'divider',
                  }}
                >
                  <Box
                    sx={{
                      width: 96,
                      height: 96,
                      flexShrink: 0,
                      mx: { xs: 'auto', sm: 0 },
                      borderRadius: 2,
                      bgcolor: 'background.paper',
                      border: '1px solid',
                      borderColor: 'divider',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      overflow: 'hidden',
                    }}
                  >
                    {settings.company_seal ? (
                      <Box
                        component="img"
                        src={settings.company_seal}
                        alt="会社印プレビュー"
                        sx={{ width: '100%', height: '100%', objectFit: 'contain', p: 0.5 }}
                      />
                    ) : (
                      <Typography variant="caption" color="text.disabled" align="center" sx={{ px: 1 }}>
                        未設定
                      </Typography>
                    )}
                  </Box>
                  <Box sx={{ flex: 1, textAlign: { xs: 'center', sm: 'left' } }}>
                    <Typography variant="body2" sx={{ mb: 1.5 }}>
                      見積書PDFの右上に表示される会社印です。透明背景のPNG画像がおすすめです。
                    </Typography>
                    <Button variant="outlined" component="label">
                      印鑑画像を選択
                      <input
                        type="file"
                        hidden
                        accept="image/png,image/jpeg,image/webp"
                        onChange={(e) => handleSealUpload(e.target.files?.[0] || null)}
                      />
                    </Button>
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                      PNG / JPEG / WebP · 最大5MB · 240px以内に自動リサイズ
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Stack>
          </SettingsSection>
        </Grid>
      </Grid>
    </Box>
  );
};

export default SettingsPage;
