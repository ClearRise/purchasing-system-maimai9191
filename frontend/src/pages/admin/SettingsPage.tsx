import React, { useEffect, useState } from 'react';
import { Box, CircularProgress, Tab, Tabs } from '@mui/material';
import { useSnackbar } from 'notistack';
import PageHeader from 'src/components/common/PageHeader';
import { api } from 'src/libs/api';
import endpoints from 'src/libs/endpoints';
import { compressSealImage } from 'src/utils/compressSealImage';
import CompanySettingsPanel from './settings/CompanySettingsPanel';
import SystemUsersPanel from './settings/SystemUsersPanel';
import ProductSettingsPanel, { type SpecItem } from './settings/ProductSettingsPanel';
import CustomerSettingsPanel from './settings/CustomerSettingsPanel';
import OtherSettingsPanel from './settings/OtherSettingsPanel';

type SettingsTab = 'company' | 'users' | 'product' | 'customer' | 'other';

const TAB_ITEMS: { value: SettingsTab; label: string }[] = [
  { value: 'company', label: '会社' },
  { value: 'users', label: 'システムユーザー' },
  { value: 'product', label: '商品' },
  { value: 'customer', label: '得意先' },
  { value: 'other', label: 'その他' },
];

const SettingsPage: React.FC = () => {
  const { enqueueSnackbar } = useSnackbar();
  const [tab, setTab] = useState<SettingsTab>('company');
  const [margins, setMargins] = useState<any[]>([]);
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [units, setUnits] = useState<string[]>([]);
  const [specs, setSpecs] = useState<SpecItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingLookups, setSavingLookups] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get(endpoints.admin.rankMargins),
      api.get(endpoints.admin.settings),
      api.get(endpoints.admin.lookupOptions('unit')),
      api.get(endpoints.admin.lookupOptions('spec')),
    ]).then(([mRes, sRes, unitRes, specRes]) => {
      setMargins(mRes.data.data);
      setSettings(sRes.data.data);
      const unitList: string[] = unitRes.data.data || [];
      setUnits(unitList);
      const defaultUnit = unitList[0] || '';
      const rawSpecs = specRes.data.data || [];
      setSpecs(
        Array.isArray(rawSpecs)
          ? rawSpecs.map((s: string | SpecItem) => {
            if (typeof s === 'string') return { value: s, unit: defaultUnit };
            return { value: s.value, unit: s.unit || defaultUnit };
          }).filter((s: SpecItem) => Boolean(s.value))
          : []
      );
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

  const saveUnits = async () => {
    setSavingLookups(true);
    try {
      const res = await api.put(endpoints.admin.lookupOptions('unit'), { values: units });
      setUnits(res.data.data || []);
      enqueueSnackbar('単位マスタを保存しました', { variant: 'success' });
    } catch (err: any) {
      enqueueSnackbar(err.response?.data?.message || '保存に失敗しました', { variant: 'error' });
    } finally {
      setSavingLookups(false);
    }
  };

  const saveSpecs = async () => {
    setSavingLookups(true);
    try {
      // Persist units first so newly added 単位 exist before linking 規格
      const unitRes = await api.put(endpoints.admin.lookupOptions('unit'), { values: units });
      setUnits(unitRes.data.data || []);

      const res = await api.put(endpoints.admin.lookupOptions('spec'), { items: specs });
      const raw = res.data.data || [];
      setSpecs(
        raw.map((s: SpecItem) => ({ value: s.value, unit: s.unit || '' }))
      );
      enqueueSnackbar('規格マスタを保存しました', { variant: 'success' });
    } catch (err: any) {
      enqueueSnackbar(err.response?.data?.message || '保存に失敗しました', { variant: 'error' });
    } finally {
      setSavingLookups(false);
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
      <PageHeader
        title="システム設定"
        subtitle="会社情報・ユーザー・商品マスタ・得意先設定の管理"
      />

      <Tabs
        value={tab}
        onChange={(_, value: SettingsTab) => setTab(value)}
        variant="scrollable"
        scrollButtons="auto"
        sx={{
          mb: 2,
          borderBottom: 1,
          borderColor: 'divider',
          minHeight: 42,
          '& .MuiTab-root': { minHeight: 42, py: 1 },
        }}
      >
        {TAB_ITEMS.map((item) => (
          <Tab key={item.value} value={item.value} label={item.label} />
        ))}
      </Tabs>

      {tab === 'company' && (
        <CompanySettingsPanel
          settings={settings}
          onChange={(key, value) => setSettings((prev) => ({ ...prev, [key]: value }))}
          onSave={saveSettings}
          onSealUpload={handleSealUpload}
        />
      )}

      {tab === 'users' && <SystemUsersPanel />}

      {tab === 'product' && (
        <ProductSettingsPanel
          units={units}
          specs={specs}
          saving={savingLookups}
          onUnitsChange={setUnits}
          onSpecsChange={setSpecs}
          onSaveUnits={saveUnits}
          onSaveSpecs={saveSpecs}
        />
      )}

      {tab === 'customer' && (
        <CustomerSettingsPanel
          margins={margins}
          onChange={(index, patch) => {
            setMargins((prev) => prev.map((m, i) => (i === index ? { ...m, ...patch } : m)));
          }}
          onSave={saveMargins}
        />
      )}

      {tab === 'other' && (
        <OtherSettingsPanel
          settings={settings}
          onChange={(key, value) => setSettings((prev) => ({ ...prev, [key]: value }))}
          onSave={saveSettings}
        />
      )}
    </Box>
  );
};

export default SettingsPage;
