import React from 'react';
import {
  Box, Paper, Table, TableHead, TableRow, TableCell, TableBody,
  TextField, Typography, CircularProgress, Chip, alpha,
} from '@mui/material';
import type { MatrixColumn, MatrixRow } from 'src/utils/purchasePriceMatrix';

interface PriceMatrixTableProps {
  columns: MatrixColumn[];
  rows: MatrixRow[];
  loading?: boolean;
  editable?: boolean;
  highlightMin?: boolean;
  showMoMChange?: boolean;
  edited?: Record<string, number>;
  onCellChange?: (productId: number, colKey: string, value: string) => void;
  emptyMessage?: string;
}

/** Frozen product columns — left offsets must match minWidth sums */
const FROZEN_COLS = [
  { label: '品名', left: 0, minWidth: 160 },
  { label: '規格', left: 160, minWidth: 72 },
  { label: '単位', left: 232, minWidth: 52 },
  { label: '備考', left: 284, minWidth: 120 },
] as const;

const HEADER_BG = '#F8FAFC';

/** Top + left sticky — highest layer (corner headers) */
const cornerHeaderSx = (left: number, minWidth: number, isLastFrozen: boolean) => ({
  position: 'sticky' as const,
  top: 0,
  left,
  minWidth,
  zIndex: 4,
  bgcolor: HEADER_BG,
  fontWeight: 500,
  whiteSpace: 'nowrap' as const,
  borderRight: '1px solid',
  borderColor: 'divider',
  ...(isLastFrozen && {
    boxShadow: '2px 0 6px rgba(15, 23, 42, 0.08)',
  }),
});

/** Top sticky only — scrolls horizontally with table */
const scrollHeaderSx = {
  position: 'sticky' as const,
  top: 0,
  zIndex: 3,
  bgcolor: HEADER_BG,
  fontWeight: 500,
  whiteSpace: 'nowrap' as const,
};

/** Left sticky only — body rows */
const frozenBodySx = (left: number, minWidth: number, isLastFrozen: boolean) => ({
  position: 'sticky' as const,
  left,
  minWidth,
  zIndex: 2,
  bgcolor: 'background.paper',
  fontSize: '0.8125rem',
  borderRight: '1px solid',
  borderColor: 'divider',
  ...(isLastFrozen && {
    boxShadow: '2px 0 6px rgba(15, 23, 42, 0.08)',
  }),
  '.MuiTableRow-root:hover &': {
    bgcolor: 'action.hover',
  },
});

const PriceMatrixTable: React.FC<PriceMatrixTableProps> = ({
  columns,
  rows,
  loading,
  editable,
  highlightMin,
  showMoMChange,
  edited,
  onCellChange,
  emptyMessage = 'データがありません',
}) => {
  if (loading) {
    return (
      <Paper sx={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
        <Box sx={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center' }}>
          <CircularProgress size={32} />
        </Box>
      </Paper>
    );
  }

  const colSpan = FROZEN_COLS.length + columns.length + (highlightMin ? 1 : 0);

  return (
    <Paper sx={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
      <Table size="small" sx={{ minWidth: 640, borderCollapse: 'separate', borderSpacing: 0 }}>
        <TableHead>
          <TableRow>
            {FROZEN_COLS.map((col, i) => (
              <TableCell
                key={col.label}
                sx={cornerHeaderSx(col.left, col.minWidth, i === FROZEN_COLS.length - 1)}
              >
                {col.label}
              </TableCell>
            ))}
            {columns.map((col) => (
              <TableCell key={col.key} sx={{ ...scrollHeaderSx, minWidth: 108, textAlign: 'center' }}>
                <Typography variant="caption" sx={{ fontWeight: 500, display: 'block' }}>
                  {col.label}
                </Typography>
                {col.subLabel && (
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                    {col.subLabel}
                  </Typography>
                )}
              </TableCell>
            ))}
            {highlightMin && (
              <TableCell sx={{ ...scrollHeaderSx, minWidth: 72, textAlign: 'center' }}>最安</TableCell>
            )}
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.id} hover>
              <TableCell sx={{ ...frozenBodySx(FROZEN_COLS[0].left, FROZEN_COLS[0].minWidth, false), fontWeight: 500 }}>
                {row.name}
              </TableCell>
              <TableCell sx={frozenBodySx(FROZEN_COLS[1].left, FROZEN_COLS[1].minWidth, false)}>{row.spec || '-'}</TableCell>
              <TableCell sx={frozenBodySx(FROZEN_COLS[2].left, FROZEN_COLS[2].minWidth, false)}>{row.unit}</TableCell>
              <TableCell sx={{ ...frozenBodySx(FROZEN_COLS[3].left, FROZEN_COLS[3].minWidth, true), whiteSpace: 'normal', maxWidth: 160 }}>
                {row.note || '-'}
              </TableCell>
              {columns.map((col) => {
                const raw = row.cells[col.key];
                const editKey = `${row.id}-${col.key}`;
                const displayVal = edited?.[editKey] ?? raw ?? '';
                const isMin = highlightMin && raw != null && row.minPrice != null && raw === row.minPrice;
                const change = showMoMChange ? row.changePct?.[col.key] : null;

                return (
                  <TableCell
                    key={col.key}
                    sx={{
                      textAlign: 'center',
                      p: editable ? 0.5 : 1,
                      bgcolor: isMin ? (theme) => alpha(theme.palette.success.main, 0.08) : undefined,
                    }}
                  >
                    {editable ? (
                      <TextField
                        type="number"
                        size="small"
                        value={displayVal}
                        onChange={(e) => onCellChange?.(row.id, col.key, e.target.value)}
                        sx={{ width: 88, '& input': { textAlign: 'right', py: 0.75, fontSize: '0.8125rem' } }}
                        placeholder="-"
                      />
                    ) : (
                      <Box>
                        <Typography
                          variant="body2"
                          sx={{
                            fontWeight: isMin ? 700 : 400,
                            color: isMin ? 'success.dark' : 'text.primary',
                            fontSize: '0.8125rem',
                          }}
                        >
                          {raw != null ? `¥${raw.toLocaleString()}` : '-'}
                        </Typography>
                        {change != null && (
                          <Chip
                            label={`${change > 0 ? '+' : ''}${change}%`}
                            size="small"
                            color={Math.abs(change) >= 30 ? 'warning' : change > 0 ? 'error' : 'success'}
                            variant="outlined"
                            sx={{ mt: 0.25, height: 18, fontSize: '0.65rem' }}
                          />
                        )}
                      </Box>
                    )}
                  </TableCell>
                );
              })}
              {highlightMin && (
                <TableCell sx={{ textAlign: 'center', fontWeight: 500, fontSize: '0.8125rem' }}>
                  {row.minPrice != null ? `¥${row.minPrice.toLocaleString()}` : '-'}
                </TableCell>
              )}
            </TableRow>
          ))}
          {!rows.length && (
            <TableRow>
              <TableCell colSpan={colSpan} align="center">
                <Typography color="text.secondary" sx={{ py: 6 }}>{emptyMessage}</Typography>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </Paper>
  );
};

export default PriceMatrixTable;
