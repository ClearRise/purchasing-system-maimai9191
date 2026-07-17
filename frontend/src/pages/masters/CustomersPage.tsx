import React from 'react';
import MasterCrudPage from './MasterCrudPage';
import endpoints from 'src/libs/endpoints';
import { usePermissions } from 'src/hooks/usePermissions';

const columns = [
  { field: 'name', headerName: '得意先名', flex: 1, minWidth: 180 },
  { field: 'rank', headerName: 'ランク', width: 80 },
  { field: 'nameKana', headerName: 'フリガナ', width: 130 },
  { field: 'nameAbbr', headerName: '略号', width: 100 },
  { field: 'email', headerName: 'メール', width: 180 },
  { field: 'note', headerName: '備考', flex: 1, minWidth: 120 },
];

const fields = [
  { name: 'name', label: '得意先名', required: true },
  { name: 'rank', label: 'ランク (A/B/C/D/N)', required: true },
  { name: 'nameKana', label: 'フリガナ' },
  { name: 'nameAbbr', label: '略号' },
  { name: 'email', label: 'メール' },
  { name: 'note', label: '備考' },
];

const CustomersPage: React.FC = () => {
  const { canManageCustomers } = usePermissions();
  return (
    <MasterCrudPage
      title="得意先マスタ"
      subtitle="得意先・ランクの管理"
      endpoint={endpoints.masters.customers}
      columns={columns}
      fields={fields}
      canEdit={canManageCustomers}
    />
  );
};

export default CustomersPage;
