import type { GridRowSelectionModel } from '@mui/x-data-grid';

/** Resolve selected row ids for MUI X DataGrid v7+ include/exclude model. */
export function getSelectedRowIds(
  selection: GridRowSelectionModel,
  allIds: Array<number | string>
): number[] {
  const selected = new Set(allIds.map(Number));

  if (selection.type === 'exclude') {
    selection.ids.forEach((id) => selected.delete(Number(id)));
  } else {
    selected.clear();
    selection.ids.forEach((id) => selected.add(Number(id)));
  }

  return Array.from(selected);
}
