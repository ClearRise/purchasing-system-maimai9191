import React, { useEffect, useState } from 'react';
import {
  Grid,
  Paper,
  Typography,
  Box,
  List,
  ListItem,
  ListItemText,
  Chip,
  CircularProgress,
  alpha,
} from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import PageHeader from 'src/components/common/PageHeader';
import { api } from 'src/libs/api';
import endpoints from 'src/libs/endpoints';
import type { IDashboardData } from 'src/types';

const StatCard: React.FC<{
  label: string;
  value: number;
  icon: React.ReactNode;
  color: string;
}> = ({ label, value, icon, color }) => (
  <Paper sx={{ p: 2.5 }}>
    <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
      <Box>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
          {label}
        </Typography>
        <Typography variant="h4" sx={{ fontWeight: 700, color: 'text.primary', lineHeight: 1.2 }}>
          {value.toLocaleString()}
        </Typography>
      </Box>
      <Box
        sx={{
          p: 1,
          borderRadius: 1.5,
          bgcolor: alpha(color, 0.1),
          color,
          display: 'flex',
        }}
      >
        {icon}
      </Box>
    </Box>
  </Paper>
);

const SectionCard: React.FC<{
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}> = ({ title, icon, children }) => (
  <Paper sx={{ height: '100%' }}>
    <Box sx={{ px: 2.5, py: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
      <Typography variant="subtitle1" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
        {icon}
        {title}
      </Typography>
    </Box>
    <Box sx={{ p: 1 }}>{children}</Box>
  </Paper>
);

const EmptyState: React.FC<{ message: string }> = ({ message }) => (
  <Typography variant="body2" color="text.secondary" sx={{ px: 2, py: 3, textAlign: 'center' }}>
    {message}
  </Typography>
);

const DashboardPage: React.FC = () => {
  const [data, setData] = useState<IDashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(endpoints.dashboard.summary)
      .then((res) => setData(res.data.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', height: 320, alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress size={32} />
      </Box>
    );
  }

  const s = data?.summary;

  return (
    <Box>
      <PageHeader title="ダッシュボード" subtitle="仕入・見積の概要" />

      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatCard
            label="商品数"
            value={s?.productCount || 0}
            icon={<Inventory2OutlinedIcon fontSize="small" />}
            color="#166534"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatCard
            label="得意先数"
            value={s?.customerCount || 0}
            icon={<TrendingUpIcon fontSize="small" />}
            color="#2563EB"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatCard
            label="下書き見積"
            value={s?.quotationDraft || 0}
            icon={<DescriptionOutlinedIcon fontSize="small" />}
            color="#D97706"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatCard
            label="送信済見積"
            value={s?.quotationSent || 0}
            icon={<DescriptionOutlinedIcon fontSize="small" />}
            color="#16A34A"
          />
        </Grid>
      </Grid>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, lg: 6 }}>
          <SectionCard title="利益率 TOP 商品">
            {(data?.topProducts || []).length > 0 ? (
              <List dense disablePadding>
                {(data?.topProducts || []).map((p, i) => (
                  <ListItem
                    key={p.productId}
                    divider={i < (data?.topProducts?.length || 0) - 1}
                    sx={{ px: 2, py: 1.25 }}
                  >
                    <ListItemText
                      primary={`${i + 1}. ${p.productName}`}
                      secondary={`平均粗利率 ${p.avgMarginRate}%`}
                      slotProps={{
                        primary: { sx: { fontSize: '0.875rem', fontWeight: 500 } },
                        secondary: { sx: { fontSize: '0.75rem' } },
                      }}
                    />
                    <Chip label={`${p.avgMarginRate}%`} color="success" size="small" variant="outlined" />
                  </ListItem>
                ))}
              </List>
            ) : (
              <EmptyState message="データがありません" />
            )}
          </SectionCard>
        </Grid>

        <Grid size={{ xs: 12, lg: 6 }}>
          <SectionCard
            title="赤字リスク顧客"
            icon={<WarningAmberOutlinedIcon fontSize="small" color="error" />}
          >
            {(data?.riskCustomers || []).length > 0 ? (
              <List dense disablePadding>
                {(data?.riskCustomers || []).map((c, i) => (
                  <ListItem
                    key={c.customerId}
                    divider={i < (data?.riskCustomers?.length || 0) - 1}
                    sx={{ px: 2, py: 1.25 }}
                  >
                    <ListItemText
                      primary={c.customerName}
                      secondary={`ランク ${c.rank} · 下限 ${c.minRequired}%`}
                      slotProps={{
                        primary: { sx: { fontSize: '0.875rem', fontWeight: 500 } },
                        secondary: { sx: { fontSize: '0.75rem' } },
                      }}
                    />
                    <Chip label={`${c.avgMarginRate}%`} color="error" size="small" variant="outlined" />
                  </ListItem>
                ))}
              </List>
            ) : (
              <EmptyState message="リスク顧客はありません" />
            )}
          </SectionCard>
        </Grid>

        <Grid size={{ xs: 12 }}>
          <SectionCard title="仕入単価急騰アラート">
            {(data?.priceAlerts || []).length > 0 ? (
              <List dense disablePadding>
                {(data?.priceAlerts || []).map((a, i) => (
                  <ListItem
                    key={i}
                    divider={i < (data?.priceAlerts?.length || 0) - 1}
                    sx={{ px: 2, py: 1.25 }}
                  >
                    <ListItemText
                      primary={a.productName}
                      secondary={`${a.targetYearMonth} · 変動率 ${a.changePct > 0 ? '+' : ''}${a.changePct}%`}
                      slotProps={{
                        primary: { sx: { fontSize: '0.875rem', fontWeight: 500 } },
                        secondary: { sx: { fontSize: '0.75rem' } },
                      }}
                    />
                    <Chip
                      label={`${a.changePct > 0 ? '+' : ''}${a.changePct}%`}
                      color={a.changePct > 0 ? 'warning' : 'info'}
                      size="small"
                      variant="outlined"
                    />
                  </ListItem>
                ))}
              </List>
            ) : (
              <EmptyState message="アラートはありません" />
            )}
          </SectionCard>
        </Grid>
      </Grid>
    </Box>
  );
};

export default DashboardPage;
