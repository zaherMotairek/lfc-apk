/** Reorder nav items by comma-separated paths; append any paths not listed. */
export function applyNavOrder<T extends { to: string }>(
  specs: T[],
  orderCsv: string | undefined,
  hiddenCsv: string | undefined,
): T[] {
  const hidden = new Set(
    (hiddenCsv ?? '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean),
  );
  const visible = specs.filter((spec) => !hidden.has(spec.to));
  const order = (orderCsv ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  if (order.length === 0) return visible;

  const byTo = new Map(visible.map((item) => [item.to, item]));
  const ordered: T[] = [];
  for (const to of order) {
    const item = byTo.get(to);
    if (item) {
      ordered.push(item);
      byTo.delete(to);
    }
  }
  for (const rest of byTo.values()) ordered.push(rest);
  return ordered;
}
