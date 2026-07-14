import React from 'react';
import MasterCrudPage from './MasterCrudPage';
import endpoints from 'src/libs/endpoints';
import { usePermissions } from 'src/hooks/usePermissions';

const columns = [
  { field: 'name', headerName: '店舗名', flex: 1, minWidth: 150 },
  { field: 'groupName', headerName: 'グループ', width: 130 },
  { field: 'location', headerName: '位置', width: 150 },
  { field: 'note', headerName: '備考', flex: 1, minWidth: 120 },
];

const fields = [
  { name: 'storeCode', label: '店舗CD', required: true },
  { name: 'name', label: '店舗名', required: true },
  { name: 'groupName', label: 'グループ' },
  { name: 'location', label: '位置' },
  { name: 'note', label: '備考' },
];

const StoresPage: React.FC = () => {
  const { canManageMasters } = usePermissions();
  return (
    <MasterCrudPage
      title="店舗マスタ"
      subtitle="店舗・チェーンの管理"
      endpoint={endpoints.masters.stores}
      columns={columns}
      fields={fields}
      canEdit={canManageMasters}
    />
  );
};

export default StoresPage;
