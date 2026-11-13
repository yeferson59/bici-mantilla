const formatter = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
});

/** 1890000 → "$ 1.890.000" */
export function formatPrice(value: number): string {
  return formatter.format(value).replace(/\u00a0/g, ' ');
}
