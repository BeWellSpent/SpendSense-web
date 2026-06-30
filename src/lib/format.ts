export function formatMoney(
  units: bigint | number,
  nanos: number,
  currency: string,
  locale: string,
): string {
  const value = Number(units) + nanos / 1e9
  try {
    return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(value)
  } catch {
    // Fallback if locale or currency code is unrecognised
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value)
  }
}

export function formatMoneyFromNumber(
  amount: number,
  currency: string,
  locale: string,
): string {
  try {
    return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(amount)
  } catch {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)
  }
}
