/** Compose/parse 規格 = 数量 + 単位 (e.g. "200g", "1 kg") */

export function formatSpec(amount: string, unit: string): string {
  const a = amount.trim();
  const u = unit.trim();
  if (!a || !u) return '';
  // Match common sheet style: "200g" / "1 kg"
  if (/^(g|ml|L)$/i.test(u)) return `${a}${u}`;
  return `${a} ${u}`;
}

export function parseSpec(
  value: string,
  units: string[]
): { amount: string; unit: string } {
  const raw = (value || '').trim();
  if (!raw) return { amount: '', unit: units[0] || '' };

  const sorted = [...units].sort((a, b) => b.length - a.length);
  for (const u of sorted) {
    if (!u) continue;
    if (raw.endsWith(` ${u}`)) {
      return { amount: raw.slice(0, -(u.length + 1)).trim(), unit: u };
    }
    if (raw.endsWith(u)) {
      const amount = raw.slice(0, -u.length).trim();
      if (amount) return { amount, unit: u };
    }
  }
  return { amount: raw, unit: units[0] || '' };
}
