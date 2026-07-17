import React from 'react';
import {
  Box, Paper, TextField, Button, Table, TableHead, TableRow, TableCell,
  TableBody, Divider,
} from '@mui/material';
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined';
import PanelHeader from 'src/components/common/PanelHeader';

interface RankMargin {
  rank: string;
  defaultMarginRate: number;
  minMarginRate: number;
}

interface CustomerSettingsPanelProps {
  margins: RankMargin[];
  onChange: (index: number, patch: Partial<RankMargin>) => void;
  onSave: () => void;
}

/** 得意先ランク別の粗利率設定 */
const CustomerSettingsPanel: React.FC<CustomerSettingsPanelProps> = ({
  margins,
  onChange,
  onSave,
}) => (
  <Paper>
    <PanelHeader
      title="ランク別粗利率"
      action={
        <Button variant="contained" size="small" startIcon={<SaveOutlinedIcon />} onClick={onSave}>
          保存
        </Button>
      }
    />
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
                  onChange={(e) => onChange(i, { defaultMarginRate: Number(e.target.value) })}
                  sx={{ width: 100 }}
                />
              </TableCell>
              <TableCell>
                <TextField
                  type="number"
                  size="small"
                  value={m.minMarginRate}
                  onChange={(e) => onChange(i, { minMarginRate: Number(e.target.value) })}
                  sx={{ width: 100 }}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Box>
  </Paper>
);

export default CustomerSettingsPanel;
