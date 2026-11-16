/** Simple hex darken for live brand CSS variables (settings → site). */
export function darkenHex(hex: string, amount = 0.32): string {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return hex;
  const n = parseInt(m[1], 16);
  const r = Math.max(0, ((n >> 16) & 0xff) * (1 - amount));
  const g = Math.max(0, ((n >> 8) & 0xff) * (1 - amount));
  const b = Math.max(0, (n & 0xff) * (1 - amount));
  return `#${[r, g, b].map((c) => Math.round(c).toString(16).padStart(2, '0')).join('')}`;
}

export function applyBrandCssVars(brandRed: string, themeColor: string) {
  const root = document.documentElement;
  const dark = darkenHex(brandRed);
  root.style.setProperty('--color-lfc-red', brandRed);
  root.style.setProperty('--color-lfc-red-dark', dark);
  root.style.setProperty('--lfc-red', brandRed);
  root.style.setProperty('--lfc-red-dark', dark);
  if (themeColor) {
    root.style.setProperty('--brand-theme-color', themeColor);
  }
}