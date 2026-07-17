import React, { useEffect, useState } from 'react';
import {
  Paper,
  Typography,
  Box,
  List,
  ListItem,
  ListItemText,
  Chip,
  CircularProgress,
  alpha,
  Tooltip,
  IconButton,
} from '@mui/material';
import HelpOutlineOutlinedIcon from '@mui/icons-material/HelpOutlineOutlined';
import PeopleAltOutlinedIcon from '@mui/icons-material/PeopleAltOutlined';
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import SendOutlinedIcon from '@mui/icons-material/SendOutlined';
import DraftsOutlinedIcon from '@mui/icons-material/DraftsOutlined';
import PageHeader from 'src/components/common/PageHeader';
import ProductProfitChart from 'src/components/dashboard/ProductProfitChart';
import { api } from 'src/libs/api';
import endpoints from 'src/libs/endpoints';
import type { IDashboardData } from 'src/types';

const LabelHint: React.FC<{ title: string }> = ({ title }) => (
  <Tooltip title={title} arrow placement="top">
    <IconButton
      size="small"
      aria-label="説明"
      sx={{
        p: 0.15,
        color: 'text.secondary',
        '&:hover': { color: 'primary.main', bgcolor: 'transparent' },
      }}
    >
      <HelpOutlineOutlinedIcon sx={{ fontSize: 14 }} />
    </IconButton>
  </Tooltip>
);

type StatItem = {
  label: string;
  hint: string;
  value: number;
  icon: React.ReactNode;
  color: string;
};

/** Flat KPI strip — no cards, no separators. */
const StatsStrip: React.FC<{ items: StatItem[] }> = ({ items }) => (
  <Box
    sx={{
      flexShrink: 0,
      display: 'grid',
      gridTemplateColumns: {
        xs: 'repeat(2, minmax(0, 1fr))',
        sm: 'repeat(4, minmax(0, 1fr))',
      },
      gap: { xs: 1.5, sm: 2.5 },
      px: { xs: 1.5, sm: 2 },
      py: { xs: 1.25, sm: 1.5 },
      borderRadius: 2,
      bgcolor: (t) => alpha(t.palette.primary.main, 0.04),
    }}
  >
    {items.map((item) => (
      <Box
        key={item.label}
        sx={{
          minWidth: 0,
          display: 'flex',
          alignItems: 'center',
          gap: 1.25,
        }}
      >
        <Box
          sx={{
            width: 36,
            height: 36,
            borderRadius: '50%',
            bgcolor: alpha(item.color, 0.12),
            color: item.color,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          {item.icon}
        </Box>
        <Box sx={{ minWidth: 0 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}>
            <Typography variant="caption" color="text.secondary" noWrap>
              {item.label}
            </Typography>
            <LabelHint title={item.hint} />
          </Box>
          <Typography
            variant="h2"
            component="p"
            sx={{
              mt: 0.15,
              fontWeight: 600,
              fontSize: '1.5rem',
              lineHeight: 1.15,
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {item.value.toLocaleString()}
          </Typography>
        </Box>
      </Box>
    ))}
  </Box>
);

const SectionCard: React.FC<{
  title: string;
  hint: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  bodySx?: object;
}> = ({ title, hint, icon, children, bodySx }) => (
  <Paper sx={{ height: '100%', minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
    <Box
      sx={{
        px: 1.5,
        py: 1,
        borderBottom: '1px solid',
        borderColor: 'divider',
        flexShrink: 0,
      }}
    >
      <Typography
        variant="subtitle2"
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 0.5,
        }}
      >
        {icon}
        {title}
        <LabelHint title={hint} />
      </Typography>
    </Box>
    <Box sx={{ flex: 1, minHeight: 0, overflow: 'auto', ...bodySx }}>{children}</Box>
  </Paper>
);

const EmptyState: React.FC<{ message: string }> = ({ message }) => (
  <Typography variant="caption" color="text.secondary" sx={{ px: 1.5, py: 2, textAlign: 'center', display: 'block' }}>
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
      <Box sx={{ display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress size={32} />
      </Box>
    );
  }

  const s = data?.summary;

  return (
    <Box
      sx={{
        flex: 1,
        minHeight: 0,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      <PageHeader title="ダッシュボード" subtitle="仕入・見積の概要" dense />

      <Box
        sx={{
          flex: 1,
          minHeight: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: 1.25,
          overflow: { xs: 'auto', md: 'hidden' },
        }}
      >
        <StatsStrip
          items={[
            {
              label: '商品数',
              hint: 'いま使える状態で登録されている商品の数です。',
              value: s?.productCount || 0,
              icon: <Inventory2OutlinedIcon sx={{ fontSize: 18 }} />,
              color: '#166534',
            },
            {
              label: '得意先数',
              hint: 'いま取引可能な状態で登録されている得意先の数です。',
              value: s?.customerCount || 0,
              icon: <PeopleAltOutlinedIcon sx={{ fontSize: 18 }} />,
              color: '#2563EB',
            },
            {
              label: '下書き見積',
              hint: 'まだお客様へ送っていない見積書の数です。',
              value: s?.quotationDraft || 0,
              icon: <DraftsOutlinedIcon sx={{ fontSize: 18 }} />,
              color: '#D97706',
            },
            {
              label: '送信済見積',
              hint: 'すでに送信済みにした見積書の数です。',
              value: s?.quotationSent || 0,
              icon: <SendOutlinedIcon sx={{ fontSize: 18 }} />,
              color: '#16A34A',
            },
          ]}
        />

        <Box
          sx={{
            flex: 1,
            minWidth: 0,
            minHeight: 0,
            display: 'grid',
            gap: 1.25,
            gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' },
            gridTemplateRows: {
              xs: 'auto',
              md: 'minmax(0, 1.2fr) minmax(0, 0.9fr) minmax(0, 0.75fr)',
            },
            gridTemplateAreas: {
              xs: `
                "chart"
                "top"
                "risk"
                "alert"
              `,
              lg: `
                "chart chart"
                "top risk"
                "alert alert"
              `,
            },
          }}
        >
          <Box sx={{ gridArea: 'chart', minHeight: { xs: 280, md: 0 } }}>
            <SectionCard
              title="商品別 月次利益推移"
              hint="開始月〜終了月を選ぶと、その期間の月が横軸に並びます。各月は全発注先の平均仕入と、全ランク標準粗利の平均売価から1単位あたりの平均利益を出しています。最初は直近利益が最も高い商品を表示します。"
              bodySx={{ display: 'flex', flexDirection: 'column' }}
            >
              <ProductProfitChart compact />
            </SectionCard>
          </Box>

          <Box sx={{ gridArea: 'top', minHeight: { xs: 160, md: 0 } }}>
            <SectionCard
              title="利益率 TOP 商品"
              hint="見積で利益が取れている商品を、平均の粗利率が高い順に並べています。"
            >
              {(data?.topProducts || []).length > 0 ? (
                <List dense disablePadding>
                  {(data?.topProducts || []).slice(0, 5).map((p, i) => (
                    <ListItem
                      key={p.productId}
                      divider={i < Math.min(5, data?.topProducts?.length || 0) - 1}
                      sx={{ px: 1.5, py: 0.75 }}
                    >
                      <ListItemText
                        primary={`${i + 1}. ${p.productName}`}
                        secondary={`平均粗利率 ${p.avgMarginRate}%`}
                        slotProps={{
                          primary: { sx: { fontSize: '0.8125rem', fontWeight: 500 } },
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
          </Box>

          <Box sx={{ gridArea: 'risk', minHeight: { xs: 160, md: 0 } }}>
            <SectionCard
              title="粗利下限割れ顧客"
              hint="いちばん新しい見積で、ランクごとの最低粗利率を下回っている得意先です。すぐ赤字というわけではなく、値付けの見直しが必要な可能性があります。"
              icon={<WarningAmberOutlinedIcon sx={{ fontSize: 16 }} color="error" />}
            >
              {(data?.riskCustomers || []).length > 0 ? (
                <List dense disablePadding>
                  {(data?.riskCustomers || []).slice(0, 5).map((c, i) => (
                    <ListItem
                      key={c.customerId}
                      divider={i < Math.min(5, data?.riskCustomers?.length || 0) - 1}
                      sx={{ px: 1.5, py: 0.75 }}
                    >
                      <ListItemText
                        primary={c.customerName}
                        secondary={`ランク ${c.rank} · 下限 ${c.minRequired}%`}
                        slotProps={{
                          primary: { sx: { fontSize: '0.8125rem', fontWeight: 500 } },
                          secondary: { sx: { fontSize: '0.75rem' } },
                        }}
                      />
                      <Chip label={`${c.avgMarginRate}%`} color="error" size="small" variant="outlined" />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <EmptyState message="下限割れの得意先はありません" />
              )}
            </SectionCard>
          </Box>

          <Box sx={{ gridArea: 'alert', minHeight: { xs: 140, md: 0 } }}>
            <SectionCard
              title="仕入単価急騰アラート"
              hint="同じ商品・発注先で、前の月より仕入単価が大きく上がったものを表示します。判定の目安はシステム設定の「価格上昇アラート (%)」です。"
            >
              {(data?.priceAlerts || []).length > 0 ? (
                <List dense disablePadding>
                  {(data?.priceAlerts || []).slice(0, 4).map((a, i) => (
                    <ListItem
                      key={`${a.productName}-${a.supplierName}-${a.targetYearMonth}-${i}`}
                      divider={i < Math.min(4, data?.priceAlerts?.length || 0) - 1}
                      sx={{ px: 1.5, py: 0.65 }}
                    >
                      <ListItemText
                        primary={a.productName}
                        secondary={[
                          a.supplierName,
                          a.prevYearMonth && a.targetYearMonth
                            ? `${a.prevYearMonth} → ${a.targetYearMonth}`
                            : a.targetYearMonth,
                          a.priceBefore != null && a.priceAfter != null
                            ? `¥${Number(a.priceBefore).toLocaleString()} → ¥${Number(a.priceAfter).toLocaleString()}`
                            : null,
                        ].filter(Boolean).join(' · ')}
                        slotProps={{
                          primary: { sx: { fontSize: '0.8125rem', fontWeight: 500 } },
                          secondary: { sx: { fontSize: '0.75rem' } },
                        }}
                      />
                      <Chip
                        label={`+${a.changePct}%`}
                        color="warning"
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
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default DashboardPage;
