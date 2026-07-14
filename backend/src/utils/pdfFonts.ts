import fs from 'fs';
import path from 'path';

const FONT_DIR = path.join(__dirname, '../../assets/fonts');
const FONT_FILE = path.join(FONT_DIR, 'NotoSansJP-Regular.otf');
const FONT_BOLD = path.join(FONT_DIR, 'NotoSansJP-Bold.otf');

function resolveFont(candidates: string[]): string {
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return candidate;
  }
  throw new Error('Japanese PDF font not found. Place NotoSansJP-Regular.otf in backend/assets/fonts/');
}

export function getPdfFonts() {
  const normal = resolveFont([
    FONT_FILE,
    path.join(process.env.WINDIR || 'C:\\Windows', 'Fonts', 'NotoSansJP-Regular.otf'),
  ]);
  const bold = resolveFont([
    FONT_BOLD,
    normal,
  ]);

  return {
    NotoSansJP: {
      normal,
      bold,
      italics: normal,
      bolditalics: bold,
    },
  };
}
