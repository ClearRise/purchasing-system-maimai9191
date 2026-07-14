/** Main content vertical padding (top + bottom) — legacy reference */
export const VIEWPORT_CHROME = 24;

/** Root wrapper for pages with a primary data table */
export const pageTableRootSx = {
  display: 'flex',
  flexDirection: 'column',
  flex: 1,
  minHeight: 0,
} as const;

/** Paper wrapper — table fills remaining viewport height */
export const tableFlexPaperSx = {
  flex: 1,
  minHeight: 0,
  overflow: 'hidden',
} as const;

/** Filter / selector toolbar above data tables */
export const filterPaperSx = {
  mb: 2,
  px: { xs: 2, md: 2.5 },
  py: 2,
  flexShrink: 0,
  display: 'flex',
  flexWrap: 'wrap',
  gap: 2,
  rowGap: 2,
  alignItems: 'flex-end',
} as const;

/** Same as filterPaperSx but vertically centers items (mode toggles + fields) */
export const selectorBarSx = {
  ...filterPaperSx,
  alignItems: 'center',
} as const;

/** Scrollable table paper (non-DataGrid) */
export const tableScrollPaperSx = {
  flex: 1,
  minHeight: 0,
  overflow: 'auto',
} as const;
