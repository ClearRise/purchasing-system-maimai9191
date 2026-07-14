import React from 'react';
import MasterCrudPage from './MasterCrudPage';
import endpoints from 'src/libs/endpoints';
import { usePermissions } from 'src/hooks/usePermissions';

const columns = [
  { field: 'name', headerName: '発注先名', flex: 1, minWidth: 150 },
  { field: 'shortName', headerName: '略称', width: 80 },
  { field: 'phone', headerName: '電話', width: 130 },
  { field: 'email', headerName: 'メール', width: 180 },
  { field: 'note', headerName: '備考', flex: 1, minWidth: 120 },
];

const fields = [
  { name: 'name', label: '発注先名', required: true },
  { name: 'shortName', label: '略称' },
  { name: 'phone', label: '電話番号' },
  { name: 'email', label: 'メール' },
  { name: 'note', label: '備考' },
];

const SuppliersPage: React.FC = () => {
  const { canManageMasters } = usePermissions();
  return (
    <MasterCrudPage
      title="発注先マスタ"
      subtitle="仕入先（発注先）の管理"
      endpoint={endpoints.masters.suppliers}
      columns={columns}
      fields={fields}
      canEdit={canManageMasters}
    />
  );
};

export default SuppliersPage;
