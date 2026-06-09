const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const currencyFormatterDetailed = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const compactFormatter = new Intl.NumberFormat('en-US', {
  notation: 'compact',
  compactDisplay: 'short',
  maximumFractionDigits: 1,
});

export function formatCurrency(value: number): string {
  if (Math.abs(value) >= 1_000_000) {
    return compactFormatter.format(value);
  }
  return currencyFormatter.format(value);
}

export function formatCurrencyFull(value: number): string {
  return currencyFormatter.format(value);
}

export function formatCurrencyDetailed(value: number): string {
  return currencyFormatterDetailed.format(value);
}

export function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-US').format(Math.round(value));
}

export function formatYears(years: number): string {
  if (years < 1) return 'Less than a year';
  if (years === 1) return '1 year';
  return `${Math.floor(years)} years`;
}

export function formatAgeRange(start: number, end: number): string {
  return `${start} – ${end}`;
}

export function getFIRELabel(type: string): string {
  const labels: Record<string, string> = {
    lean: 'Lean FIRE',
    regular: 'Regular FIRE',
    fat: 'Fat FIRE',
    coast: 'Coast FIRE',
    barista: 'Barista FIRE',
  };
  return labels[type] || type;
}

export function getFireDescription(type: string): string {
  const descriptions: Record<string, string> = {
    lean: 'Minimalist lifestyle, lower expenses (20x annual expenses)',
    regular: 'Comfortable middle-class lifestyle (25x annual expenses)',
    fat: 'Luxury lifestyle, higher expenses (30x annual expenses)',
    coast: 'Let compound interest do the work',
    barista: 'Work part-time, let investments cover the rest',
  };
  return descriptions[type] || '';
}
